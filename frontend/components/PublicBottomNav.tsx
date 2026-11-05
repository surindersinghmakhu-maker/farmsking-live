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
import { useCart } from '@/src/store/cart-context';
import { FONT, RADIUS } from '@/constants/theme';

// ── Mobile Bottom Navigation: Exact 5 Core Menu Pillars from Desktop ──
// 1. Home | 2. Farmers | 3. Crop Doctors (Center Hero) | 4. Gardening | 5. Agri Store
const MOBILE_NAV_TABS = [
  {
    key: 'home',
    label: 'Home',
    icon: 'home',
    iconOutline: 'home-outline',
    path: '/',
    color: '#10b981',
    glow: ['rgba(16, 185, 129, 0.32)', 'rgba(5, 150, 105, 0.18)', 'rgba(16, 185, 129, 0.05)'],
    laser: ['#00ff87', '#10b981', '#059669'],
    border: 'rgba(16, 185, 129, 0.50)',
    shadow: '#10b981',
  },
  {
    key: 'farming',
    label: 'Farmers',
    icon: 'leaf',
    iconOutline: 'leaf-outline',
    path: '/topic/Farming',
    color: '#10b981',
    glow: ['rgba(16, 185, 129, 0.32)', 'rgba(5, 150, 105, 0.18)', 'rgba(16, 185, 129, 0.05)'],
    laser: ['#00ff87', '#10b981', '#059669'],
    border: 'rgba(16, 185, 129, 0.50)',
    shadow: '#10b981',
  },
  {
    key: 'doctors',
    label: 'Crop Doctors',
    icon: 'medkit',
    iconOutline: 'medkit-outline',
    path: '/ai-doctor',
    color: '#06b6d4',
    glow: ['rgba(6, 182, 212, 0.40)', 'rgba(16, 185, 129, 0.22)', 'rgba(6, 182, 212, 0.08)'],
    laser: ['#38bdf8', '#06b6d4', '#0284c7'],
    border: 'rgba(6, 182, 212, 0.60)',
    shadow: '#06b6d4',
    isSpecial: true,
  },
  {
    key: 'gardening',
    label: 'Gardening',
    icon: 'flower',
    iconOutline: 'flower-outline',
    path: '/topic/Gardening',
    color: '#e11d48',
    glow: ['rgba(225, 29, 72, 0.32)', 'rgba(190, 18, 60, 0.18)', 'rgba(225, 29, 72, 0.05)'],
    laser: ['#fb7185', '#e11d48', '#be123c'],
    border: 'rgba(225, 29, 72, 0.50)',
    shadow: '#e11d48',
  },
  {
    key: 'store',
    label: 'Agri Store',
    icon: 'cart',
    iconOutline: 'cart-outline',
    path: '/shop',
    color: '#f97316',
    glow: ['rgba(249, 115, 22, 0.32)', 'rgba(234, 88, 12, 0.18)', 'rgba(249, 115, 22, 0.05)'],
    laser: ['#fb923c', '#f97316', '#ea580c'],
    border: 'rgba(249, 115, 22, 0.50)',
    shadow: '#f97316',
  },
];

export default function PublicBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;
  const { items } = useCart();

  const totalCartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Compute active index based on route
  const getActiveIndex = () => {
    if (pathname.startsWith('/topic/Farming') || pathname.startsWith('/farmers')) return 1;
    if (pathname.startsWith('/ai-doctor') || pathname.startsWith('/topic/Crop-Doctors') || pathname.startsWith('/crop-intelligence') || pathname.startsWith('/crop-disease-scanner')) return 2;
    if (pathname.startsWith('/topic/Gardening') || pathname.startsWith('/gardening')) return 3;
    if (pathname.startsWith('/shop') || pathname.startsWith('/store')) return 4;
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

  // STRICT RULE: Only render on Mobile View (Width <= 768px). PC / Desktop uses top header menu exclusively.
  if (!isMobile) {
    return null;
  }

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

    setTimeout(() => {
      router.push(targetPath as any);
    }, 160);
  };

  const currentTab = MOBILE_NAV_TABS[activeIndex] || MOBILE_NAV_TABS[0];

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
                width: Math.max(0, (barWidth / MOBILE_NAV_TABS.length) - 8),
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1, 2, 3, 4],
                      outputRange: [0, 1, 2, 3, 4].map(
                        (i) => i * (barWidth / MOBILE_NAV_TABS.length) + 4
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
              colors={currentTab.glow as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={currentTab.laser as [string, string, ...string[]]}
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

        {/* 2. Farmers Tab */}
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => handleTabPress(1, '/topic/Farming')}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.iconWrapper,
              activeIndex === 1 && (Platform.OS === 'web' ? ({ transform: 'scale(1.15)', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' } as any) : {}),
            ]}
          >
            <Ionicons
              name={activeIndex === 1 ? 'leaf' : 'leaf-outline'}
              size={21}
              color={activeIndex === 1 ? '#10b981' : '#94a3b8'}
            />
          </View>
          <Text style={[styles.tabLabel, activeIndex === 1 && { color: '#10b981', fontWeight: '800' }]}>
            Farmers
          </Text>
        </TouchableOpacity>

        {/* 3. Center Elevated Crop Doctors Scanner Tab */}
        <TouchableOpacity
          style={styles.centerScanWrap}
          onPress={() => handleTabPress(2, '/ai-doctor')}
          activeOpacity={0.88}
        >
          <View
            style={[
              styles.centerScanGlowAura,
              Platform.OS === 'web' ? ({ className: 'center-scan-pulse' } as any) : {},
            ]}
          />
          <LinearGradient
            colors={activeIndex === 2 ? ['#06b6d4', '#0891b2', '#0e7490'] : ['#06b6d4', '#059669', '#047857']}
            style={[styles.centerScanInner, activeIndex === 2 && styles.centerScanActive]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="medkit" size={22} color="#ffffff" />
          </LinearGradient>
          <Text
            style={[
              styles.tabLabel,
              { marginTop: 2 },
              activeIndex === 2 && { color: '#06b6d4', fontWeight: '800' },
            ]}
          >
            Crop Doctors
          </Text>
        </TouchableOpacity>

        {/* 4. Gardening Tab */}
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => handleTabPress(3, '/topic/Gardening')}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.iconWrapper,
              activeIndex === 3 && (Platform.OS === 'web' ? ({ transform: 'scale(1.15)', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' } as any) : {}),
            ]}
          >
            <Ionicons
              name={activeIndex === 3 ? 'flower' : 'flower-outline'}
              size={21}
              color={activeIndex === 3 ? '#e11d48' : '#94a3b8'}
            />
          </View>
          <Text style={[styles.tabLabel, activeIndex === 3 && { color: '#e11d48', fontWeight: '800' }]}>
            Gardening
          </Text>
        </TouchableOpacity>

        {/* 5. Agri Store Tab (with Live Cart Counter Badge) */}
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => handleTabPress(4, '/shop')}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.iconWrapper,
              activeIndex === 4 && (Platform.OS === 'web' ? ({ transform: 'scale(1.15)', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' } as any) : {}),
            ]}
          >
            <Ionicons
              name={activeIndex === 4 ? 'cart' : 'cart-outline'}
              size={21}
              color={activeIndex === 4 ? '#f97316' : '#94a3b8'}
            />
            {totalCartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {totalCartCount > 99 ? '99+' : totalCartCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabLabel, activeIndex === 4 && { color: '#f97316', fontWeight: '800' }]}>
            Agri Store
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
    width: '100%',
    backgroundColor: 'rgba(10, 16, 26, 0.94)',
    borderTopWidth: 1.2,
    borderTopColor: 'rgba(16, 185, 129, 0.35)',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 4,
    paddingBottom: 6,
    position: 'relative',
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 12,
    flexDirection: 'row',
    alignItems: 'center',
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
    height: 1.5,
    borderRadius: 1,
    opacity: 0.85,
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
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: FONT.extraBold,
  },
  centerScanWrap: {
    flex: 1.15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    zIndex: 3,
  },
  centerScanInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  centerScanActive: {
    borderColor: '#ffffff',
    shadowOpacity: 0.65,
    shadowRadius: 14,
  },
  centerScanGlowAura: {
    position: 'absolute',
    top: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(6, 182, 212, 0.25)',
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FONT.semiBold,
    color: '#94a3b8',
    letterSpacing: 0.2,
  },
});
