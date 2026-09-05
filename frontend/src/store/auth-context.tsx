import * as SecureStore from '../lib/storage';
import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { login as apiLogin, registerFarmer as apiRegister, LoginPayload, RegisterPayload } from '../api/auth.api';
import { getMe } from '../api/users.api';
import { setUnauthorizedHandler, TOKEN_KEY } from '../api/client';
import { disconnectChatSocket } from '../lib/socket';
import { User } from '../types/api';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  /** Merges fresh fields (e.g. after a profile-update API call) into the cached session user and persists them. */
  updateUser: (patch: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_KEY = 'farmsking_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      const [token, storedUser] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);
      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    })();
  }, []);

  // Pick up roles/fields granted by an admin (e.g. Business Partner) without requiring re-login:
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
    setUnauthorizedHandler(() => {
      SecureStore.deleteItemAsync(TOKEN_KEY);
      SecureStore.deleteItemAsync(USER_KEY);
      setUser(null);
      disconnectChatSocket();
      // Wipe every cached query — otherwise the next account to log in on this device/browser
      // can briefly see the previous account's data (parties, wallet, bills...) from cache.
      queryClient.clear();
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
        await persistSession(response.accessToken, response.user);
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
