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
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/src/store/auth-context';
import { RoleProvider } from '@/src/store/role-context';
import { CropsProvider } from '@/src/store/crops-context';
import { CartProvider } from '@/src/store/cart-context';
import { LanguageProvider } from '@/src/store/language-context';
import { ExecutiveThemeProvider } from '@/src/store/theme-context';
import { SplashView } from '@/components/SplashView';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

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
  'ADMIN',
  'SUPERADMIN',
  'ADVISOR',
  'FARM_ADVISOR',
  'GARDEN_ADVISOR',
  'TECHNICAL_TRAINER',
  'DISTRICT_MANAGER',
  'STATE_MANAGER',
  'ACCOUNTS_MANAGER',
  'OPERATIONS_MANAGER',
];

function RootNavigation() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const segmentsPath = segments.join('/');

  useEffect(() => {
    if (isLoading) return;
    const currentGroup = segments[0] as string;
    const inAuthGroup = currentGroup === '(auth)';
    const isPublicRoute = ['seo', 'support', 'contact-us', 'shop', 'dose', 'you', 'seller-dashboard', 'topic', 'privacy-policy', 'terms', 'refund-policy', 'account-deletion'].includes(currentGroup);
    const isStaffSetupRoute = segmentsPath === 'staff-profile-setup';
    const isSubdomainAdmin = Platform.OS === 'web' && typeof window !== 'undefined' && (window.location.hostname === 'admin.farmsking.in' || window.location.hostname.startsWith('admin.'));

    if (isSubdomainAdmin) {
      // Admin subdomain renders AdminWebPortalScreen directly at root / (https://admin.farmsking.in/)
      if (!user && currentGroup !== 'index' && currentGroup !== '' && currentGroup !== 'admin' && !inAuthGroup) {
        // If navigating away on admin subdomain while logged out, keep at root /
      }
      return;
    }

    if (!user && !inAuthGroup && !isPublicRoute && !isSubdomainAdmin) {
      router.replace('/(auth)/login');
    } else if (user) {
      const userRoles = [user.role, ...(user.roles || [])];
      const isStaff = STAFF_ROLES.includes(user.role);
      const profileSubmitted = !!(user as any).staffProfileSubmitted || user.profileStatus === 'UNDER_REVIEW' || user.profileStatus === 'APPROVED';

      // Redirect unsubmitted staff to profile setup
      if (isStaff && !profileSubmitted && !isStaffSetupRoute && !inAuthGroup) {
        router.replace('/staff-profile-setup' as any);
        return;
      }

      if (currentGroup === '(partner)') {
        const hasPartnerAccess = userRoles.some(r => ['BUSINESS_PARTNER', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR', 'TECHNICAL_TRAINER'].includes(r));
        if (!hasPartnerAccess) router.replace('/(user)/(tabs)');
      } else if (inAuthGroup) {
        if (['BUSINESS_PARTNER', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR', 'TECHNICAL_TRAINER'].includes(user.role)) {
          router.replace('/(partner)/(tabs)');
        } else {
          router.replace('/(user)/(tabs)');
        }
      }
    }
  }, [user, isLoading, segmentsPath]);

  if (isLoading) {
    return <SplashView />;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'FarmsKing - India\'s Agriculture Platform' }} />
      <Stack.Screen name="(partner)" options={{ headerShown: false, title: 'FarmsKing Partner' }} />
      <Stack.Screen name="(user)" options={{ headerShown: false, title: 'FarmsKing' }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false, title: 'FarmsKing Login' }} />
      <Stack.Screen name="seo" options={{ headerShown: false, title: 'FarmsKing' }} />
      <Stack.Screen name="shop" options={{ headerShown: false, title: 'FarmsKing Store' }} />
      <Stack.Screen name="support" options={{ headerShown: false, title: 'FarmsKing Support' }} />
      <Stack.Screen name="contact-us" options={{ headerShown: false, title: 'Contact Us' }} />
      <Stack.Screen name="dose" options={{ headerShown: false, title: 'FarmsKing' }} />
      <Stack.Screen name="you" options={{ headerShown: false, title: 'FarmsKing' }} />
      <Stack.Screen name="seller-dashboard" options={{ headerShown: false, title: 'FarmsKing Seller' }} />
      <Stack.Screen name="farmer-profile-setup" options={{ headerShown: false, title: 'FarmsKing Setup' }} />
      <Stack.Screen name="staff-profile-setup" options={{ headerShown: false, title: 'Staff Profile Setup' }} />
      <Stack.Screen name="crop-intelligence" options={{ headerShown: false, title: 'FarmsKing AI' }} />
      <Stack.Screen name="admin-sellers" options={{ headerShown: false, title: 'FarmsKing' }} />
      <Stack.Screen name="topic/[id]" options={{ headerShown: false, title: 'FarmsKing Topic' }} />
      <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
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

  useEffect(() => {
    if (loaded || fontError) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [loaded, fontError]);

  if (!loaded && !fontError) {
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
