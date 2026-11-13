import * as SecureStore from '../lib/storage';
import { router } from 'expo-router';
import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { AppState, Alert, Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { login as apiLogin, registerFarmer as apiRegister, logoutOtherSessions, googleLoginApi, linkGoogleApi, unlinkGoogleApi, sendMobileLinkOtpApi, verifyMobileLinkOtpApi, firebaseMobileLinkApi, sendLoginOtpApi, verifyLoginOtpApi, completeOtpRegistrationApi, firebaseLoginApi, LoginPayload, LoginPortalMode, RegisterPayload, GoogleLoginPayload, CompleteOtpRegistrationPayload } from '../api/auth.api';
import { getMe } from '../api/users.api';
import { setUnauthorizedHandler, TOKEN_KEY } from '../api/client';
import { disconnectChatSocket } from '../lib/socket';
import { User } from '../types/api';

const ADMIN_STAFF_ROLES = [
  'ADMIN',
  'SUPER_ADMIN',
  'MANAGER',
  'OPERATOR',
  'ACCOUNTANT',
  'TECHNICAL_TRAINER',
];

const PARTNER_PORTAL_ROLES = [
  'AGENT',
  'ADVISOR',
  'FARM_ADVISOR',
  'GARDEN_ADVISOR',
  'SELLER',
  'NURSERY_OWNER',
];

const EXPLICIT_CLIENT_ROLES = [
  'FARMER',
  'GARDENER',
  'TRADER',
  'SUPERVISOR',
  'LABOUR',
];

function normalizeSessionUserRoles<T>(u: T): T {
  if (!u || typeof u !== 'object') return u;
  const copy: any = { ...u };
  const mapRole = (r: any) => (r === 'BUSINESS_PARTNER' ? 'AGENT' : r);
  if (copy.role) copy.role = mapRole(copy.role);
  if (Array.isArray(copy.roles)) copy.roles = copy.roles.map(mapRole);
  if (Array.isArray(copy.deactivatedRoles)) copy.deactivatedRoles = copy.deactivatedRoles.map(mapRole);
  return copy;
}

function getActiveSessionRoles(sessionUser: any): string[] {
  if (!sessionUser) return [];
  const deactivated = new Set(Array.isArray(sessionUser.deactivatedRoles) ? sessionUser.deactivatedRoles : []);
  const combinedRoles = [sessionUser.role, ...(Array.isArray(sessionUser.roles) ? sessionUser.roles : [])].filter(Boolean);
  return Array.from(new Set(combinedRoles)).filter((r) => !deactivated.has(r));
}

function isPartnerPortalAccount(sessionUser: any): boolean {
  return getActiveSessionRoles(sessionUser).some((r) => PARTNER_PORTAL_ROLES.includes(r));
}

function hasExplicitClientAccess(sessionUser: any): boolean {
  return getActiveSessionRoles(sessionUser).some((r) => EXPLICIT_CLIENT_ROLES.includes(r));
}

function assertPortalAccessMatch(sessionUser: any, portal?: LoginPortalMode) {
  if (!portal || !sessionUser) return;
  const activeRoles = getActiveSessionRoles(sessionUser);
  if (activeRoles.some((r) => ADMIN_STAFF_ROLES.includes(r))) {
    throw new Error('Admin Staff accounts (Super Admin, Admin, Manager, Operator, Accountant, Technical Staff) must sign in through the dedicated Admin Portal screen.');
  }
  const partnerUser = isPartnerPortalAccount(sessionUser);
  if (portal === 'PARTNER' && !partnerUser) {
    throw new Error('Not registered as a FarmsKing Partner (Seller, Crop Doctor, Garden Advisor, or Sales Manager). Please contact FarmsKing Support to apply, or switch to User Login.');
  }
}

interface AuthContextValue {
  user: User | null;
  loginPortal: LoginPortalMode | null;
  setLoginPortal: (portal: LoginPortalMode) => Promise<void>;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  sendLoginOtp: (mobile: string, portal?: LoginPortalMode) => Promise<{ success: boolean; message: string; devOtp?: string; isNewUser?: boolean }>;
  otpLogin: (payload: { mobile: string; otp: string; portal?: LoginPortalMode }) => Promise<any>;
  completeOtpRegistration: (payload: CompleteOtpRegistrationPayload) => Promise<User>;
  firebaseLogin: (idToken: string, portal?: LoginPortalMode) => Promise<any>;
  googleLogin: (payload: GoogleLoginPayload) => Promise<{ requiresMobileVerification?: boolean; isProfileIncomplete?: boolean; user?: User }>;
  linkGoogle: (payload: GoogleLoginPayload) => Promise<{ success: boolean; message: string }>;
  unlinkGoogle: () => Promise<{ success: boolean; message: string }>;
  sendMobileLinkOtp: (mobile: string) => Promise<{ success: boolean; message: string; devOtp?: string }>;
  verifyMobileLinkOtp: (payload: { mobile: string; otp: string; password?: string }) => Promise<{ success: boolean; message: string; isMerged?: boolean; user?: User }>;
  firebaseMobileLink: (payload: { idToken: string; password?: string }) => Promise<{ success: boolean; message: string; isMerged?: boolean; user?: User }>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  /** Merges fresh fields (e.g. after a profile-update API call) into the cached session user and persists them. */
  updateUser: (patch: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_KEY = 'farmsking_user';
const PORTAL_KEY = 'farmsking_login_portal';

export function AuthProvider({ children }: { children: ReactNode }) {
  const getInitialPortal = (): LoginPortalMode | null => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const storedPortal = window.localStorage.getItem(PORTAL_KEY);
        if (storedPortal === 'CLIENT' || storedPortal === 'PARTNER') return storedPortal;
      } catch {}
    }
    return null;
  };

  // Synchronous initial state on Web to eliminate splash flicker & delay
  const getInitialUser = (): User | null => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(USER_KEY);
        const token = window.localStorage.getItem(TOKEN_KEY);
        if (stored && token) return normalizeSessionUserRoles(JSON.parse(stored));
      } catch {}
    }
    return null;
  };

  const [user, setUser] = useState<User | null>(getInitialUser);
  const [loginPortal, setLoginPortalState] = useState<LoginPortalMode | null>(getInitialPortal);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const token = window.localStorage.getItem(TOKEN_KEY);
        if (token) {
          const stored = window.localStorage.getItem(USER_KEY);
          return !stored;
        }
        return false;
      } catch {
        return false;
      }
    }
    return true;
  });
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
        const [token, storedUser, storedPortal] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
          SecureStore.getItemAsync(PORTAL_KEY),
        ]);
        if (storedPortal === 'CLIENT' || storedPortal === 'PARTNER') {
          setLoginPortalState(storedPortal);
        }
        if (token && storedUser) {
          try {
            setUser(normalizeSessionUserRoles(JSON.parse(storedUser)));
          } catch (e) {
            console.warn('Corrupt user session in storage, resetting:', e);
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(USER_KEY);
            await SecureStore.deleteItemAsync(PORTAL_KEY);
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
      SecureStore.deleteItemAsync(PORTAL_KEY);
      setUser(null);
      setLoginPortalState(null);
      disconnectChatSocket();
      queryClient.clear();

      if (msg && (msg.includes('Session Terminated') || msg.includes('logged in on another device'))) {
        Alert.alert(
          '⚠️ Active Session Terminated',
          'Your account was logged in on another device. As per maximum 2 device policy, the oldest session was automatically logged out.',
          [{ text: 'OK' }]
        );
      }
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient]);

  const setLoginPortal = async (portal: LoginPortalMode) => {
    await SecureStore.setItemAsync(PORTAL_KEY, portal);
    setLoginPortalState(portal);
  };

  const persistSession = async (token: string, sessionUser: User, portal?: LoginPortalMode) => {
    // Clear any leftover cache from a previous session BEFORE the new user's screens can fetch,
    // so no other account's cached data (parties, wallet, bills...) can flash on screen.
    queryClient.clear();
    disconnectChatSocket();
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(sessionUser));
    if (portal) {
      await SecureStore.setItemAsync(PORTAL_KEY, portal);
      setLoginPortalState(portal);
    }
    setUser(sessionUser);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loginPortal,
      setLoginPortal,
      isLoading,
      login: async (payload) => {
        const response = await apiLogin(payload);
        assertPortalAccessMatch(response.user, payload.portal);
        await persistSession(response.accessToken, response.user, payload.portal ?? 'CLIENT');

        if (response.sessionMeta?.warningMessage || response.sessionMeta?.hasMultipleLogins) {
          const meta = response.sessionMeta;
          if (meta?.evictedOldest) {
            Alert.alert(
              '⚠️ Notice: Old Session Auto Logged Out',
              'You logged in on a 3rd device. Limit is 2 devices. The oldest active session was automatically logged out.',
              [{ text: 'OK' }]
            );
          } else if (meta?.hasMultipleLogins) {
            Alert.alert(
              '⚠️ Multiple Devices Logged In',
              `Your account is currently logged in on ${meta.totalActiveSessions} devices.\n\nWould you like to auto log out all other devices right now?`,
              [
                { text: 'Keep Both', style: 'cancel' },
                {
                  text: 'Logout Other Devices',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const res = await logoutOtherSessions();
                      Alert.alert('✅ Success', res.message || 'All other active devices logged out successfully.');
                    } catch (err: any) {
                      Alert.alert('Error', err.response?.data?.message || 'Could not logout other devices.');
                    }
                  },
                },
              ]
            );
          }
        }
        return response.user;
      },
      sendLoginOtp: async (mobile, portal) => {
        return sendLoginOtpApi(mobile, portal);
      },
      otpLogin: async (payload) => {
        const response = await verifyLoginOtpApi(payload);
        if (response.isNewUser) {
          if (payload.portal === 'PARTNER') {
            throw new Error('No Partner account is registered with these details. Please switch to the Client Login section for Farmer, Gardener, or Buyer accounts.');
          }
          return response;
        }
        if (response.user.role === 'ADMIN' || response.user.role === 'SUPER_ADMIN') {
          throw new Error('Admin/Super Admin account cannot login from the customer app. Please use the Admin Panel.');
        }
        assertPortalAccessMatch(response.user, payload.portal);
        await persistSession(response.accessToken, response.user, payload.portal ?? 'CLIENT');
        return response.user;
      },
      completeOtpRegistration: async (payload) => {
        if (payload.portal === 'PARTNER') {
          throw new Error('New Partner registration requires Admin approval. Please switch to the Client Login section.');
        }
        const response = await completeOtpRegistrationApi(payload);
        if (response.user.role === 'ADMIN' || response.user.role === 'SUPER_ADMIN') {
          throw new Error('Admin/Super Admin account cannot login from the customer app. Please use the Admin Panel.');
        }
        assertPortalAccessMatch(response.user, payload.portal);
        await persistSession(response.accessToken, response.user, payload.portal ?? 'CLIENT');
        return response.user;
      },
      firebaseLogin: async (idToken, portal) => {
        const response = await firebaseLoginApi(idToken, portal);
        if ((response as any).isNewUser) {
          if (portal === 'PARTNER') {
            throw new Error('No Partner account is registered with these details. Please switch to the Client Login section for Farmer, Gardener, or Buyer accounts.');
          }
          return response;
        }
        if (response.user?.role === 'ADMIN' || response.user?.role === 'SUPER_ADMIN') {
          throw new Error('Admin/Super Admin account cannot login from the customer app. Please use the Admin Panel.');
        }
        assertPortalAccessMatch(response.user, portal);
        await persistSession(response.accessToken, response.user, portal ?? 'CLIENT');
        return response.user;
      },
      googleLogin: async (payload) => {
        const response = await googleLoginApi(payload);
        if (response.user.role === 'ADMIN' || response.user.role === 'SUPER_ADMIN') {
          throw new Error('Admin/Super Admin account cannot login from the customer app. Please use the Admin Panel.');
        }
        assertPortalAccessMatch(response.user, payload.portal);
        await persistSession(response.accessToken, response.user, payload.portal ?? 'CLIENT');
        return {
          requiresMobileVerification: response.requiresMobileVerification,
          isProfileIncomplete: response.isProfileIncomplete,
          user: response.user,
        };
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
        return { success: res.success, message: res.message, isMerged: res.isMerged, user: res.user };
      },
      firebaseMobileLink: async (payload) => {
        const res = await firebaseMobileLinkApi(payload);
        if (res.accessToken && res.user) {
          await persistSession(res.accessToken, res.user);
        } else if (res.user && userRef.current) {
          const merged = { ...userRef.current, ...res.user };
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(merged));
          setUser(merged);
        }
        return { success: res.success, message: res.message, isMerged: res.isMerged, user: res.user };
      },
      register: async (payload) => {
        const response = await apiRegister(payload);
        await persistSession(response.accessToken, response.user, 'CLIENT');
      },
      logout: async () => {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
        await SecureStore.deleteItemAsync(PORTAL_KEY);
        try {
          if (Platform.OS === 'web') {
            localStorage.removeItem('farmsking_user_language');
          } else {
            await SecureStore.deleteItemAsync('farmsking_user_language');
          }
        } catch {}
        setUser(null);
        setLoginPortalState(null);
        disconnectChatSocket();
        queryClient.clear();
        router.replace('/');
      },
      updateUser: async (patch) => {
        if (!userRef.current) return;
        const merged = { ...userRef.current, ...patch };
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(merged));
        setUser(merged);
      },
      refreshUser,
    }),
    [user, loginPortal, isLoading, queryClient],
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
