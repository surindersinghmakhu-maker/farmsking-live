import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  Animated as RNAnimated,
  LayoutChangeEvent,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/src/store/auth-context';
import { useCart } from '@/src/store/cart-context';
import { FONT, RADIUS } from '@/constants/theme';

// ─── Public Bottom Navigation Tabs Configuration ─────────────────────────
const PUBLIC_NAV_TABS = [
  {
    key: 'home',
    label: 'Home',
    icon: 'home',
    iconOutline: 'home-outline',
    path: '/',
    color: '#10b981',
    glow: ['rgba(16, 185, 129, 0.28)', 'rgba(5, 150, 105, 0.16)', 'rgba(16, 185, 129, 0.05)'],
    laser: ['#00ff87', '#10b981', '#059669'],
    border: 'rgba(16, 185, 129, 0.45)',
    shadow: '#10b981',
  },
  {
    key: 'store',
    label: 'Store',
    icon: 'cart',
    iconOutline: 'cart-outline',
    path: '/shop',
    color: '#3b82f6',
    glow: ['rgba(59, 130, 246, 0.28)', 'rgba(37, 99, 235, 0.16)', 'rgba(59, 130, 246, 0.05)'],
    laser: ['#60a5fa', '#3b82f6', '#2563eb'],
    border: 'rgba(59, 130, 246, 0.45)',
    shadow: '#3b82f6',
  },
  {
    key: 'scan',
    label: 'AI Scan',
    icon: 'scan',
    iconOutline: 'scan-outline',
    path: '/crop-intelligence',
    color: '#00ff87',
    glow: ['rgba(0, 255, 135, 0.32)', 'rgba(16, 185, 129, 0.18)', 'rgba(0, 255, 135, 0.06)'],
    laser: ['#34d399', '#00ff87', '#059669'],
    border: 'rgba(0, 255, 135, 0.50)',
    shadow: '#00ff87',
    isSpecial: true,
  },
  {
    key: 'doctors',
    label: 'Doctors',
    icon: 'medkit',
    iconOutline: 'medkit-outline',
    path: '/topic/Crop-Doctors',
    color: '#8b5cf6',
    glow: ['rgba(139, 92, 246, 0.28)', 'rgba(109, 40, 217, 0.16)', 'rgba(139, 92, 246, 0.05)'],
    laser: ['#a78bfa', '#8b5cf6', '#6d28d9'],
    border: 'rgba(139, 92, 246, 0.45)',
    shadow: '#8b5cf6',
  },
  {
    key: 'account',
    label: 'Account',
    icon: 'person-circle',
    iconOutline: 'person-circle-outline',
    path: '/login',
    color: '#f59e0b',
    glow: ['rgba(245, 158, 11, 0.28)', 'rgba(217, 119, 6, 0.16)', 'rgba(245, 158, 11, 0.05)'],
    laser: ['#fbbf24', '#f59e0b', '#d97706'],
    border: 'rgba(245, 158, 11, 0.45)',
    shadow: '#f59e0b',
  },
];

export default function PublicBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;
  const { user } = useAuth();
  const { items } = useCart();

  const totalCartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Compute active index based on route
  const getActiveIndex = () => {
    if (pathname.startsWith('/shop')) return 1;
    if (pathname.startsWith('/crop-intelligence') || pathname.startsWith('/crop-disease-scanner')) return 2;
    if (pathname.startsWith('/topic')) return 3;
    if (pathname.startsWith('/(user)') || pathname.startsWith('/(partner)') || pathname === '/login' || pathname === '/profile') return 4;
    return 0; // Home default
  };

  const activeIndex = getActiveIndex();
  const initialIndex = typeof window !== 'undefined' && (window as any).__fk_bottom_index !== undefined
    ? (window as any).__fk_bottom_index
    : activeIndex;
  const [barWidth, setBarWidth] = useState(0);
  const slideAnim = useRef(new RNAnimated.Value(initialIndex)).current;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__fk_bottom_index = activeIndex;
    }
    RNAnimated.spring(slideAnim, {
      toValue: activeIndex,
      tension: 68,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [activeIndex]);

  // Only render on mobile view
  if (!isMobile) return null;

  // Do not render inside authenticated tabs or auth flows
  const inAuthGroup = pathname.startsWith('/(auth)') || pathname === '/login' || pathname === '/register';
  const inUserTabs = pathname.startsWith('/(user)') || pathname.startsWith('/(partner)');
  if (inAuthGroup || inUserTabs) {
    return null;
  }

  const handleTabPress = (tabIndex: number, targetPath: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (typeof window !== 'undefined') {
      (window as any).__fk_bottom_index = tabIndex;
    }
    RNAnimated.spring(slideAnim, {
      toValue: tabIndex,
      tension: 68,
      friction: 10,
      useNativeDriver: false,
    }).start();

    if (tabIndex === 4) {
      setTimeout(() => handleUserTabPress(), 160);
      return;
    }
    setTimeout(() => {
      router.push(targetPath as any);
    }, 160);
  };

  const handleUserTabPress = () => {
    if (user) {
      if (['BUSINESS_PARTNER', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR', 'TECHNICAL_TRAINER'].includes(user.role || '')) {
        router.push('/(partner)/(tabs)' as any);
      } else {
        router.push('/(user)/(tabs)' as any);
      }
    } else {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          router.push('/(auth)/login' as any);
        } catch {}
        setTimeout(() => {
          if (window.location.pathname === '/' || window.location.pathname === '' || window.location.pathname === '/index') {
            window.location.href = '/login';
          }
        }, 60);
      } else {
        try {
          router.push('/(auth)/login' as any);
        } catch {
          router.push('/login' as any);
        }
      }
    }
  };

  const currentTab = PUBLIC_NAV_TABS[activeIndex] || PUBLIC_NAV_TABS[0];

  return (
    <View style={styles.fixedWrapper} pointerEvents="box-none">
      <View
        style={styles.barContainer}
        onLayout={(e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width)}
      >
        {Platform.OS === 'web' && (
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
        )}

        {/* Dynamic Continuous Spring Gliding Colorful Pill */}
        {barWidth > 0 && (
          <RNAnimated.View
            style={[
              styles.bottomGliderPill,
              {
                width: Math.max(0, (barWidth / PUBLIC_NAV_TABS.length) - 8),
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1, 2, 3, 4],
                      outputRange: [0, 1, 2, 3, 4].map(
                        (i) => i * (barWidth / PUBLIC_NAV_TABS.length) + 4
                      ),
                      extrapolate: 'clamp',
                    }),
                  },
                ],
                borderColor: currentTab.border,
                shadowColor: currentTab.shadow,
              },
            ]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={currentTab.glow}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={currentTab.laser}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bottomGliderLaser}
            />
          </RNAnimated.View>
        )}

        {/* 1. Home Tab */}
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => handleTabPress(0, '/')}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.iconWrapper,
              activeIndex === 0 && (Platform.OS === 'web' ? ({ transform: 'scale(1.15)', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' } as any) : {}),
            ]}
          >
            <Ionicons
              name={activeIndex === 0 ? 'home' : 'home-outline'}
              size={21}
              color={activeIndex === 0 ? '#10b981' : '#94a3b8'}
            />
          </View>
          <Text style={[styles.tabLabel, activeIndex === 0 && { color: '#10b981', fontWeight: '800' }]}>
            Home
          </Text>
        </TouchableOpacity>

        {/* 2. Store Tab */}
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => handleTabPress(1, '/shop')}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.iconWrapper,
              activeIndex === 1 && (Platform.OS === 'web' ? ({ transform: 'scale(1.15)', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' } as any) : {}),
            ]}
          >
            <Ionicons
              name={activeIndex === 1 ? 'cart' : 'cart-outline'}
              size={22}
              color={activeIndex === 1 ? '#3b82f6' : '#94a3b8'}
            />
            {totalCartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {totalCartCount > 99 ? '99+' : totalCartCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabLabel, activeIndex === 1 && { color: '#3b82f6', fontWeight: '800' }]}>
            Store
          </Text>
        </TouchableOpacity>

        {/* 3. Center AI Scanner Button */}
        <TouchableOpacity
          style={styles.centerScanWrap}
          onPress={() => handleTabPress(2, '/crop-intelligence')}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={activeIndex === 2 ? ['#00ff87', '#059669', '#047857'] : ['#10b981', '#059669', '#047857']}
            style={[styles.centerScanInner, activeIndex === 2 && styles.centerScanActive]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="scan" size={24} color="#02120a" />
          </LinearGradient>
          <Text
            style={[
              styles.tabLabel,
              { marginTop: 2 },
              activeIndex === 2 && { color: '#00ff87', fontWeight: '800' },
            ]}
          >
            AI Scan
          </Text>
        </TouchableOpacity>

        {/* 4. Doctors / Topics Tab */}
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => handleTabPress(3, '/topic/Crop-Doctors')}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.iconWrapper,
              activeIndex === 3 && (Platform.OS === 'web' ? ({ transform: 'scale(1.15)', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' } as any) : {}),
            ]}
          >
            <Ionicons
              name={activeIndex === 3 ? 'medkit' : 'medkit-outline'}
              size={21}
              color={activeIndex === 3 ? '#8b5cf6' : '#94a3b8'}
            />
          </View>
          <Text style={[styles.tabLabel, activeIndex === 3 && { color: '#8b5cf6', fontWeight: '800' }]}>
            Doctors
          </Text>
        </TouchableOpacity>

        {/* 5. Account / Login Tab */}
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => handleTabPress(4, '/login')}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.iconWrapper,
              activeIndex === 4 && (Platform.OS === 'web' ? ({ transform: 'scale(1.15)', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' } as any) : {}),
            ]}
          >
            <Ionicons
              name={user ? (activeIndex === 4 ? 'grid' : 'grid-outline') : (activeIndex === 4 ? 'person-circle' : 'person-circle-outline')}
              size={22}
              color={activeIndex === 4 ? '#f59e0b' : '#94a3b8'}
            />
          </View>
          <Text
            style={[styles.tabLabel, activeIndex === 4 && { color: '#f59e0b', fontWeight: '800' }]}
            numberOfLines={1}
          >
            {user ? 'Dashboard' : 'Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fixedWrapper: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  barContainer: {
    flexDirection: 'row',
    height: 64,
    maxWidth: 540,
    width: '100%',
    backgroundColor: 'rgba(2, 13, 6, 0.96)',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(0, 255, 135, 0.28)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: 'rgba(0, 255, 135, 0.15)',
    borderRightColor: 'rgba(0, 255, 135, 0.15)',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 4,
    paddingBottom: 6,
    position: 'relative',
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 12,
    overflow: 'hidden',
  },
  bottomGliderPill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 14,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomGliderLaser: {
    position: 'absolute',
    top: 0,
    left: '18%',
    right: '18%',
    height: 2.5,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 6,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
    position: 'relative',
    zIndex: 2,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#020d06',
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: FONT.extraBold,
    lineHeight: 11,
  },
  centerScanWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    zIndex: 3,
  },
  centerScanInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#020d06',
  },
  centerScanActive: {
    shadowOpacity: 0.8,
    shadowRadius: 12,
    borderWidth: 2.2,
    borderColor: '#00ff87',
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#94a3b8',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
});
