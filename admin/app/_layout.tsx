import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/src/store/auth-context';
import { RoleProvider } from '@/src/store/role-context';
import { CropsProvider } from '@/src/store/crops-context';
import { CartProvider } from '@/src/store/cart-context';
import { LanguageProvider } from '@/src/store/language-context';
import { ExecutiveThemeProvider } from '@/src/store/theme-context';
import { ExecutiveVaultProvider } from '@/src/portals/ExecutiveSecurityVault';
import { SplashView } from '@/components/SplashView';
import { AppFaviconGlobalizer } from '@/src/hooks/useAppSettings';
import { WebKeyboardScrollGlobalizer } from '@/src/utils/webKeyboardScroll';
import { AdminStepUpProvider } from '@/components/AdminStepUpProvider';

// Prevent the splash screen from auto-hiding on native mobile until assets load; hide immediately on web.
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {});
} else {
  SplashScreen.hideAsync().catch(() => {});
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

import { PORTALS, getPortalForRole, isRoleAllowedInPortal, PortalId, getSavedPortal } from '@/src/portals/portalConfig';

function RootNavigation() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const segmentsPath = segments.join('/');

  useEffect(() => {
    if (isLoading) return;
    const currentGroup = segments[0] as string;
    const inAuthGroup = currentGroup === '(auth)';
    const isRootRoute = (segments as string[]).length === 0 || ((segments as string[]).length === 1 && ((segments[0] as any) === 'index' || (segments[0] as any) === ''));
    const isPublicRoute = isRootRoute || currentGroup === 'topic' || currentGroup === 'seo' || currentGroup === 'dose' || currentGroup === 'doses' || currentGroup === 'my' || currentGroup === 'you' || currentGroup === 'public-store' || currentGroup === 'support' || currentGroup === 'contact-us';
    const isStaffSetupRoute = segments.join('/') === 'staff-profile-setup';

    const STAFF_ROLES = ['TECHNICAL_TRAINER', 'FARM_ADVISOR', 'DOCTOR'];

    if (!user && !inAuthGroup && !isPublicRoute) {
      router.replace('/(auth)/login');
    } else if (user) {
      const userRoles = [user.role, ...(user.roles || [])];
      const isStaff = STAFF_ROLES.includes(user.role);
      const profileSubmitted = !!(user as any).staffProfileSubmitted || (user as any).profileStatus === 'UNDER_REVIEW' || (user as any).profileStatus === 'APPROVED';

      // Redirect unsubmitted staff to profile setup
      if (isStaff && !profileSubmitted && !isStaffSetupRoute && !inAuthGroup) {
        router.replace('/staff-profile-setup' as any);
        return;
      }

      // ─── URL-BASED PORTAL ROUTING ENGINE ────────────────────────────
      const PORTAL_GROUPS = ['admin', 'garden', 'shop', 'farmer', 'staff'];
      const targetPortalId = getPortalForRole(user.role);
      const targetPortal = PORTALS[targetPortalId];

      if (PORTAL_GROUPS.includes(currentGroup)) {
        const activePortalId = (currentGroup === 'admin' ? 'ADMIN_HQ' : currentGroup.toUpperCase()) as PortalId;
        const allowed = isRoleAllowedInPortal(user.role, activePortalId);
        if (!allowed) {
          console.warn(`[RootRouter] Role ${user.role} unauthorized in ${currentGroup}. Redirecting to ${targetPortal.urlPrefix}`);
          router.replace(targetPortal.urlPrefix as any);
        }
      } else if (inAuthGroup || isRootRoute) {
        // First check if user had a saved portal preference that they are authorized for
        getSavedPortal().then((saved) => {
          if (saved && isRoleAllowedInPortal(user.role, saved)) {
            router.replace(PORTALS[saved].urlPrefix as any);
          } else {
            router.replace(targetPortal.urlPrefix as any);
          }
        }).catch(() => {
          router.replace(targetPortal.urlPrefix as any);
        });
      }
    }
  }, [user, isLoading, segmentsPath]);

  useEffect(() => {
    if (isLoading) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        if ((window as any).__dismissFarmsKingSplash) {
          (window as any).__dismissFarmsKingSplash();
        }
      });
    }
  }, [isLoading, segmentsPath]);

  if (isLoading) {
    return <SplashView />;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'FarmsKing - Admin Staff' }} />
      <Stack.Screen name="admin" options={{ headerShown: false, title: 'FarmsKing - Admin Staff' }} />
      <Stack.Screen name="garden" options={{ headerShown: false, title: 'FarmsKing - Admin Staff' }} />
      <Stack.Screen name="shop" options={{ headerShown: false, title: 'FarmsKing - Admin Staff' }} />
      <Stack.Screen name="farmer" options={{ headerShown: false, title: 'FarmsKing - Admin Staff' }} />
      <Stack.Screen name="staff" options={{ headerShown: false, title: 'FarmsKing - Admin Staff' }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false, title: 'FarmsKing - Admin Staff' }} />
      <Stack.Screen name="public-store" options={{ headerShown: false, title: 'FarmsKing - Admin Staff' }} />
      <Stack.Screen name="seo" options={{ headerShown: false, title: 'FarmsKing - Admin Staff' }} />
      <Stack.Screen name="support" options={{ headerShown: false, title: 'FarmsKing - Admin Staff' }} />
      <Stack.Screen name="contact-us" options={{ headerShown: false, title: 'FarmsKing - Admin Staff' }} />
      <Stack.Screen name="dose" options={{ headerShown: false, title: 'FarmsKing - Admin Staff' }} />
      <Stack.Screen name="you" options={{ headerShown: false, title: 'FarmsKing - Admin Staff' }} />
      <Stack.Screen name="seller-dashboard" options={{ headerShown: false, title: 'FarmsKing - Admin Staff' }} />
      <Stack.Screen name="farmer-profile-setup" options={{ headerShown: false, title: 'FarmsKing - Admin Staff' }} />
      <Stack.Screen name="staff-profile-setup" options={{ headerShown: false, title: 'FarmsKing - Admin Staff' }} />
      <Stack.Screen name="crop-intelligence" options={{ headerShown: false, title: 'FarmsKing - Admin Staff' }} />
      <Stack.Screen name="admin-sellers" options={{ headerShown: false, title: 'FarmsKing - Admin Staff' }} />
      <Stack.Screen name="topic/[id]" options={{ headerShown: false, title: 'FarmsKing - Admin Staff' }} />
      <Stack.Screen name="+not-found" options={{ title: 'FarmsKing - Admin Staff' }} />
    </Stack>
  );
}

import { MobileAppShell } from '@/components/MobileAppShell';
import { LiveWebsiteWebView } from '@/components/LiveWebsiteWebView';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  // Render UI without artificial splash wait
  const isReady = Platform.OS === 'web' || Boolean(loaded || fontError);

  useEffect(() => {
    if (Platform.OS !== 'web' && isReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady]);

  if (!isReady) {
    return (
      <QueryClientProvider client={queryClient}>
        <SplashView />
      </QueryClientProvider>
    );
  }

  // If shortcut webview mode is enabled on native mobile build
  if (process.env.EXPO_PUBLIC_WEBVIEW_MODE === 'true' && Platform.OS !== 'web') {
    return <LiveWebsiteWebView uri="https://farmsking.in" />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppFaviconGlobalizer />
      <WebKeyboardScrollGlobalizer />
      <LanguageProvider>
        <ExecutiveThemeProvider>
          <AuthProvider>
            <ExecutiveVaultProvider>
              <RoleProvider>
                <CropsProvider>
                  <CartProvider>
                    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                      <AdminStepUpProvider>
                        <MobileAppShell>
                          <RootNavigation />
                          <StatusBar style="auto" />
                        </MobileAppShell>
                      </AdminStepUpProvider>
                    </ThemeProvider>
                  </CartProvider>
                </CropsProvider>
              </RoleProvider>
            </ExecutiveVaultProvider>
          </AuthProvider>
        </ExecutiveThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
export { GlobalErrorBoundary as ErrorBoundary };
