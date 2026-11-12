import * as SecureStore from '../lib/storage';
import { router } from 'expo-router';
import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { AppState, Alert, Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { login as apiLogin, registerFarmer as apiRegister, logoutOtherSessions, googleLoginApi, linkGoogleApi, unlinkGoogleApi, sendMobileLinkOtpApi, verifyMobileLinkOtpApi, sendLoginOtpApi, verifyLoginOtpApi, firebaseLoginApi, LoginPayload, RegisterPayload, GoogleLoginPayload } from '../api/auth.api';
import { getMe } from '../api/users.api';
import { setUnauthorizedHandler, TOKEN_KEY } from '../api/client';
import { disconnectChatSocket } from '../lib/socket';
import { User } from '../types/api';

const ADMIN_PORTAL_ROLES = ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'OPERATOR', 'TECHNICAL_TRAINER', 'ACCOUNTANT'];

function hasActiveAdminStaffRole(u: User | null | undefined): boolean {
  if (!u) return false;
  const deactivated = Array.isArray((u as any).deactivatedRoles) ? (u as any).deactivatedRoles : [];
  const activeRoles = [u.role, ...(u.roles || [])].filter((r) => r && !deactivated.includes(r));
  return activeRoles.some((r) => ADMIN_PORTAL_ROLES.includes(r as string));
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  sendLoginOtp: (mobile: string) => Promise<{ success: boolean; message: string; devOtp?: string }>;
  otpLogin: (payload: { mobile: string; otp: string }) => Promise<void>;
  firebaseLogin: (idToken: string) => Promise<void>;
  googleLogin: (payload: GoogleLoginPayload) => Promise<{ isProfileIncomplete?: boolean }>;
  linkGoogle: (payload: GoogleLoginPayload) => Promise<{ success: boolean; message: string }>;
  unlinkGoogle: () => Promise<{ success: boolean; message: string }>;
  sendMobileLinkOtp: (mobile: string) => Promise<{ success: boolean; message: string; devOtp?: string }>;
  verifyMobileLinkOtp: (payload: { mobile: string; otp: string; password?: string }) => Promise<{ success: boolean; message: string; isMerged?: boolean }>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  /** Merges fresh fields (e.g. after a profile-update API call) into the cached session user and persists them. */
  updateUser: (patch: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_KEY = 'farmsking_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const getInitialWebUser = (): User | null => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const token = window.localStorage.getItem(TOKEN_KEY);
        const storedUser = window.localStorage.getItem(USER_KEY);
        if (token && storedUser) {
          const parsed = JSON.parse(storedUser);
          const mapRole = (r: any) => (r === 'BUSINESS_PARTNER' ? 'AGENT' : r);
          if (parsed?.role) parsed.role = mapRole(parsed.role);
          if (Array.isArray(parsed?.roles)) parsed.roles = parsed.roles.map(mapRole);
          if (Array.isArray(parsed?.deactivatedRoles)) parsed.deactivatedRoles = parsed.deactivatedRoles.map(mapRole);
          return parsed;
        }
      } catch {}
    }
    return null;
  };

  const [user, setUser] = useState<User | null>(getInitialWebUser);
  const [isLoading, setIsLoading] = useState(Platform.OS !== 'web');
  const userRef = useRef<User | null>(null);
  userRef.current = user;
  const queryClient = useQueryClient();

  const refreshUser = async () => {
    if (!userRef.current) return;
    try {
      const fresh = await getMe();
      const merged = { ...userRef.current, ...fresh };
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(merged));
      setUser(merged);
    } catch {
      // Best-effort refresh — keep the cached session on failure (e.g. offline).
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [token, storedUser] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (token && storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            const mapRole = (r: any) => (r === 'BUSINESS_PARTNER' ? 'AGENT' : r);
            if (parsed?.role) parsed.role = mapRole(parsed.role);
            if (Array.isArray(parsed?.roles)) parsed.roles = parsed.roles.map(mapRole);
            if (Array.isArray(parsed?.deactivatedRoles)) parsed.deactivatedRoles = parsed.deactivatedRoles.map(mapRole);
            setUser(parsed);
          } catch (e) {
            console.warn('Corrupt user session in storage, resetting:', e);
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(USER_KEY);
          }
        }
      } catch (err) {
        console.warn('Error reading storage session:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Pick up roles/fields granted by an admin (e.g. Agent) without requiring re-login:
  // refresh once the session is restored, and again whenever the app returns to the foreground.
  useEffect(() => {
    if (!user) return;
    refreshUser();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshUser();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    setUnauthorizedHandler((msg?: string) => {
      SecureStore.deleteItemAsync(TOKEN_KEY);
      SecureStore.deleteItemAsync(USER_KEY);
      setUser(null);
      disconnectChatSocket();
      queryClient.clear();

      if (msg && (msg.includes('Session Terminated') || msg.includes('logged in on another device'))) {
        Alert.alert(
          'Session Terminated',
          'Your account was signed in on another device. Under the 2-device limit, your oldest session was signed out automatically.',
          [{ text: 'OK' }]
        );
      }
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient]);

  const persistSession = async (token: string, sessionUser: User) => {
    // Clear any leftover cache from a previous session BEFORE the new user's screens can fetch,
    // so no other account's cached data (parties, wallet, bills...) can flash on screen.
    queryClient.clear();
    disconnectChatSocket();
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login: async (payload) => {
        const response = await apiLogin(payload);
        if (!hasActiveAdminStaffRole(response.user)) {
          throw new Error('Only authorized Admin Panel staff accounts can access this panel.');
        }
        await persistSession(response.accessToken, response.user);

        if (response.sessionMeta?.warningMessage || response.sessionMeta?.hasMultipleLogins) {
          const meta = response.sessionMeta;
          if (meta?.evictedOldest) {
            Alert.alert(
              'Old Session Signed Out',
              'You signed in on a 3rd device. The limit is 2 active devices, so your oldest session was signed out automatically.',
              [{ text: 'OK' }]
            );
          } else if (meta?.hasMultipleLogins) {
            Alert.alert(
              'Multiple Active Devices',
              `Your account is currently signed in on ${meta.totalActiveSessions} devices. Would you like to sign out all other devices right now?`,
              [
                { text: 'Keep Both', style: 'cancel' },
                {
                  text: 'Sign Out Other Devices',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const res = await logoutOtherSessions();
                      Alert.alert('Success', res.message || 'All other active devices have been signed out.');
                    } catch (err: any) {
                      Alert.alert('Error', err.response?.data?.message || 'Could not sign out other devices.');
                    }
                  },
                },
              ]
            );
          }
        }
      },
      sendLoginOtp: async (mobile) => {
        return sendLoginOtpApi(mobile);
      },
      otpLogin: async (payload) => {
        const response = await verifyLoginOtpApi(payload);
        if (!hasActiveAdminStaffRole(response.user)) {
          throw new Error('Only authorized Admin Panel staff accounts can access this panel.');
        }
        await persistSession(response.accessToken, response.user);
      },
      firebaseLogin: async (idToken) => {
        const response = await firebaseLoginApi(idToken);
        if (!hasActiveAdminStaffRole(response.user)) {
          throw new Error('Only authorized Admin Panel staff accounts can access this panel.');
        }
        await persistSession(response.accessToken, response.user);
      },
      googleLogin: async (payload) => {
        const response = await googleLoginApi(payload);
        if (!hasActiveAdminStaffRole(response.user)) {
          throw new Error('Only authorized Admin Panel staff accounts can access this panel.');
        }
        await persistSession(response.accessToken, response.user);
        return { isProfileIncomplete: response.isProfileIncomplete };
      },
      linkGoogle: async (payload) => {
        const response = await linkGoogleApi(payload);
        if (response.user) {
          if (!userRef.current) return { success: response.success, message: response.message };
          const merged = { ...userRef.current, ...response.user };
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(merged));
          setUser(merged);
        }
        return { success: response.success, message: response.message };
      },
      unlinkGoogle: async () => {
        const response = await unlinkGoogleApi();
        if (response.user) {
          if (!userRef.current) return { success: response.success, message: response.message };
          const merged = { ...userRef.current, ...response.user };
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(merged));
          setUser(merged);
        }
        return { success: response.success, message: response.message };
      },
      sendMobileLinkOtp: async (mobile) => {
        return sendMobileLinkOtpApi(mobile);
      },
      verifyMobileLinkOtp: async (payload) => {
        const res = await verifyMobileLinkOtpApi(payload);
        if (res.accessToken && res.user) {
          await persistSession(res.accessToken, res.user);
        } else if (res.user && userRef.current) {
          const merged = { ...userRef.current, ...res.user };
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(merged));
          setUser(merged);
        }
        return { success: res.success, message: res.message, isMerged: res.isMerged };
      },
      register: async (payload) => {
        const response = await apiRegister(payload);
        await persistSession(response.accessToken, response.user);
      },
      logout: async () => {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
        setUser(null);
        disconnectChatSocket();
        queryClient.clear();
        try {
          router.replace('/(auth)/login' as any);
        } catch {
          router.replace('/');
        }
      },
      updateUser: async (patch) => {
        if (!userRef.current) return;
        const merged = { ...userRef.current, ...patch };
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(merged));
        setUser(merged);
      },
      refreshUser,
    }),
    [user, isLoading, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
