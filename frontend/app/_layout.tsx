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
import { Platform, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/src/store/auth-context';
import { RoleProvider } from '@/src/store/role-context';
import { CropsProvider } from '@/src/store/crops-context';
import { CartProvider } from '@/src/store/cart-context';
import { LanguageProvider } from '@/src/store/language-context';
import { ExecutiveThemeProvider } from '@/src/store/theme-context';
import { SplashView } from '@/components/SplashView';
import PublicBottomNav from '@/components/PublicBottomNav';
import { AppFaviconGlobalizer } from '@/src/hooks/useAppSettings';
import { WebKeyboardScrollGlobalizer } from '@/src/utils/webKeyboardScroll';
import { StaffSessionGuardian } from '@/src/components/StaffSessionGuardian';

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

const STAFF_ROLES = [
  'ADVISOR',
  'FARM_ADVISOR',
  'GARDEN_ADVISOR',
];

function RootNavigation() {
  const { user, loginPortal, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const segmentsPath = segments.join('/');

  useEffect(() => {
    if (isLoading) return;
    const currentGroup = segments[0] as string;
    const inAuthGroup = currentGroup === '(auth)';
    const isAtRootOrIndex = !currentGroup || currentGroup === '' || currentGroup === 'index';
    const isPublicRoute = isAtRootOrIndex || [
      'seo',
      'support',
      'contact-us',
      'shop',
      'dose',
      'you',
      'topic',
      'compliance',
      'crop-intelligence',
      'privacy-policy',
      'terms',
      'refund-policy',
      'order-tracking',
      'account-deletion',
    ].includes(currentGroup);
    const isStaffSetupRoute = segmentsPath === 'staff-profile-setup';
    const isSubdomainAdmin = Platform.OS === 'web' && typeof window !== 'undefined' && (window.location.hostname === 'admin.farmsking.in' || window.location.hostname.startsWith('admin.'));

    if (isSubdomainAdmin) {
      // Admin subdomain renders AdminWebPortalScreen directly at root / (https://admin.farmsking.in/)
      if (!user && !isAtRootOrIndex && currentGroup !== 'admin' && !inAuthGroup) {
        // If navigating away on admin subdomain while logged out, keep at root /
      }
      return;
    }

    if (!user && !inAuthGroup && !isPublicRoute && !isSubdomainAdmin) {
      router.replace('/(auth)/login');
    } else if (user) {
      const deactivated = new Set(Array.isArray((user as any).deactivatedRoles) ? (user as any).deactivatedRoles : []);
      const userRoles = Array.from(new Set([user.role, ...(user.roles || [])])).filter((r) => !deactivated.has(r));
      const isStaff = STAFF_ROLES.includes(user.role);
      const profileSubmitted = !!(user as any).staffProfileSubmitted || (user as any).profileStatus === 'UNDER_REVIEW' || (user as any).profileStatus === 'APPROVED';

      // Redirect unsubmitted staff to profile setup
      if (isStaff && !profileSubmitted && !isStaffSetupRoute && !inAuthGroup) {
        router.replace('/staff-profile-setup' as any);
        return;
      }

      const partnerTabRoles = ['AGENT', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR'];
      const hasPartnerTabsAccess = userRoles.some((r) => partnerTabRoles.includes(r));
      const hasAnyPartnerPortalAccess = hasPartnerTabsAccess || userRoles.includes('SELLER');
      const hasExplicitClientRole = userRoles.some((r) => ['FARMER', 'GARDENER', 'TRADER', 'SUPERVISOR', 'LABOUR'].includes(r));

      const resolveHomeRoute = (): string => {
        if (userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN')) return '/admin';
        if (loginPortal === 'CLIENT' && hasExplicitClientRole) return '/(user)/(tabs)';
        if (loginPortal === 'PARTNER' && hasAnyPartnerPortalAccess) {
          return hasPartnerTabsAccess ? '/(partner)/(tabs)' : '/seller-dashboard';
        }
        if (hasExplicitClientRole && !partnerTabRoles.includes(user.role)) {
          return '/(user)/(tabs)';
        }
        if (hasPartnerTabsAccess) return '/(partner)/(tabs)';
        if (userRoles.includes('SELLER')) return '/seller-dashboard';
        return '/(user)/(tabs)';
      };

      if (isAtRootOrIndex) {
        router.replace(resolveHomeRoute() as any);
        return;
      }

      if (currentGroup === '(partner)') {
        if (!hasAnyPartnerPortalAccess) router.replace('/(user)/(tabs)');
      } else if (inAuthGroup) {
        router.replace(resolveHomeRoute() as any);
      }
    }
  }, [user, loginPortal, isLoading, segmentsPath]);

  useEffect(() => {
    if (isLoading) return;

    // If we are redirecting away from root/index to tabs or admin, wait until the destination is active
    const currentGroup = segments[0] as string;
    const isAtRootOrIndex = !currentGroup || currentGroup === '' || currentGroup === 'index';
    if (user && isAtRootOrIndex) {
      // In the middle of redirecting to dashboard; hold the splash overlay so no blank flash occurs
      return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Double animation frame gives browser time to composite and paint the actual target screen
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if ((window as any).__dismissFarmsKingSplash) {
            (window as any).__dismissFarmsKingSplash();
          }
        });
      });
    }
  }, [user, isLoading, segmentsPath]);

  if (isLoading) {
    return <SplashView />;
  }

  return (
    <View style={{ flex: 1 }}>
      <StaffSessionGuardian />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false, title: 'FarmsKing - Smart Farming' }} />
        <Stack.Screen name="(partner)" options={{ headerShown: false, title: 'FarmsKing - Smart Farming' }} />
        <Stack.Screen name="(user)" options={{ headerShown: false, title: 'FarmsKing - Smart Farming' }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false, title: 'FarmsKing - Smart Farming' }} />
        <Stack.Screen name="seo" options={{ headerShown: false, title: 'FarmsKing - Smart Farming' }} />
        <Stack.Screen name="shop" options={{ headerShown: false, title: 'FarmsKing - Smart Farming' }} />
        <Stack.Screen name="support" options={{ headerShown: false, title: 'FarmsKing - Smart Farming' }} />
        <Stack.Screen name="contact-us" options={{ headerShown: false, title: 'FarmsKing - Smart Farming' }} />
        <Stack.Screen name="dose" options={{ headerShown: false, title: 'FarmsKing - Smart Farming' }} />
        <Stack.Screen name="you" options={{ headerShown: false, title: 'FarmsKing - Smart Farming' }} />
        <Stack.Screen name="seller-dashboard" options={{ headerShown: false, title: 'FarmsKing - Smart Farming' }} />
        <Stack.Screen name="farmer-profile-setup" options={{ headerShown: false, title: 'FarmsKing - Smart Farming' }} />
        <Stack.Screen name="staff-profile-setup" options={{ headerShown: false, title: 'FarmsKing - Smart Farming' }} />
        <Stack.Screen name="crop-intelligence" options={{ headerShown: false, title: 'FarmsKing - Smart Farming' }} />
        <Stack.Screen name="admin-sellers" options={{ headerShown: false, title: 'FarmsKing - Admin Staff' }} />
        <Stack.Screen name="topic/[id]" options={{ headerShown: false, title: 'FarmsKing - Smart Farming' }} />
        <Stack.Screen name="compliance" options={{ headerShown: false, title: 'FarmsKing - Smart Farming' }} />
        <Stack.Screen name="privacy-policy" options={{ headerShown: false, title: 'FarmsKing - Smart Farming' }} />
        <Stack.Screen name="terms" options={{ headerShown: false, title: 'FarmsKing - Smart Farming' }} />
        <Stack.Screen name="refund-policy" options={{ headerShown: false, title: 'FarmsKing - Smart Farming' }} />
        <Stack.Screen name="order-tracking" options={{ headerShown: false, title: 'FarmsKing - Smart Farming' }} />
        <Stack.Screen name="+not-found" options={{ title: 'FarmsKing - Smart Farming' }} />
      </Stack>
      <PublicBottomNav />
    </View>
  );
}

import { MobileAppShell } from '@/components/MobileAppShell';
import { LiveWebsiteWebView } from '@/components/LiveWebsiteWebView';

function GlobalVisitorTelemetryRecorder() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem('farmsking_session_visit_recorded')) return;
      sessionStorage.setItem('farmsking_session_visit_recorded', '1');
      const isMobile = window.innerWidth < 768;
      fetch('/api/v1/app-settings/record-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device: isMobile ? 'mobile' : 'desktop',
          path: window.location.pathname || '/',
        }),
      }).catch(() => {});
    } catch {}
  }, []);
  return null;
}

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

  // Native mobile splash dismissal
  useEffect(() => {
    if (Platform.OS !== 'web') {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, []);

  const isReady = Platform.OS === 'web' || Boolean(loaded || fontError);

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
      <GlobalVisitorTelemetryRecorder />
      <LanguageProvider>
        <ExecutiveThemeProvider>
          <AuthProvider>
            <RoleProvider>
              <CropsProvider>
                <CartProvider>
                  <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                    <MobileAppShell>
                      <RootNavigation />
                      <StatusBar style="auto" />
                    </MobileAppShell>
                  </ThemeProvider>
                </CartProvider>
              </CropsProvider>
            </RoleProvider>
          </AuthProvider>
        </ExecutiveThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
export { GlobalErrorBoundary as ErrorBoundary };
