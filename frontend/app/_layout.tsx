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

function RootNavigation() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    const isPublicRoute = segments[0] === 'seo' || segments[0] === 'dose';

    if (!user && !inAuthGroup && !isPublicRoute) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return <SplashView />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="seo" options={{ headerShown: false }} />
      <Stack.Screen name="dose" options={{ headerShown: false }} />
      <Stack.Screen name="seller-dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="farmer-profile-setup" options={{ headerShown: false }} />
      <Stack.Screen name="crop-intelligence" options={{ headerShown: false }} />
      <Stack.Screen name="admin-sellers" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
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
      SplashScreen.hideAsync().catch(() => {});
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
