import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  Animated as RNAnimated,
  LayoutChangeEvent,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useCart } from '@/src/store/cart-context';
import { useAuth } from '@/src/store/auth-context';
import { useRole } from '@/src/store/role-context';
import { useLanguage } from '@/src/store/language-context';
import { FONT, RADIUS } from '@/constants/theme';
import { BrandLogo } from '@/src/components/BrandLogo';

interface NavTabItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
  path?: string;
  isMore?: boolean;
  isSpecial?: boolean;
  color: string;
  glow: [string, string, ...string[]];
  laser: [string, string, ...string[]];
  border: string;
  shadow: string;
}

export default function PublicBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;
  const { items } = useCart();
  const { user, logout } = useAuth();
  const { role } = useRole();
  const { language, setLanguage } = useLanguage();

  const [showMoreModal, setShowMoreModal] = useState(false);
  const totalCartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Compute active navigation tabs dynamically according to user's logged-in status & role
  const navTabs: NavTabItem[] = useMemo(() => {
    if (!user) {
      // 🌐 GUEST / UNREGISTERED VISITOR
      return [
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
          label: 'Farming',
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
        {
          key: 'more',
          label: 'More',
          icon: 'grid',
          iconOutline: 'grid-outline',
          isMore: true,
          color: '#a855f7',
          glow: ['rgba(168, 85, 247, 0.32)', 'rgba(126, 34, 206, 0.18)', 'rgba(168, 85, 247, 0.05)'],
          laser: ['#c084fc', '#a855f7', '#7e22ce'],
          border: 'rgba(168, 85, 247, 0.50)',
          shadow: '#a855f7',
        },
      ];
    }

    // 🌾 1. FARMER ROLE
    if (role === 'FARMER' || (!role && user.role === 'FARMER')) {
      return [
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
          key: 'crops',
          label: 'Crops',
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
        {
          key: 'more',
          label: 'More',
          icon: 'grid',
          iconOutline: 'grid-outline',
          isMore: true,
          color: '#a855f7',
          glow: ['rgba(168, 85, 247, 0.32)', 'rgba(126, 34, 206, 0.18)', 'rgba(168, 85, 247, 0.05)'],
          laser: ['#c084fc', '#a855f7', '#7e22ce'],
          border: 'rgba(168, 85, 247, 0.50)',
          shadow: '#a855f7',
        },
      ];
    }

    // 🌿 2. GARDENER ROLE
    if (role === 'GARDENER' || user.role === 'GARDENER') {
      return [
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
          key: 'gardens',
          label: 'Gardens',
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
          key: 'store',
          label: 'Store',
          icon: 'cart',
          iconOutline: 'cart-outline',
          path: '/shop',
          color: '#f97316',
          glow: ['rgba(249, 115, 22, 0.32)', 'rgba(234, 88, 12, 0.18)', 'rgba(249, 115, 22, 0.05)'],
          laser: ['#fb923c', '#f97316', '#ea580c'],
          border: 'rgba(249, 115, 22, 0.50)',
          shadow: '#f97316',
        },
        {
          key: 'more',
          label: 'More',
          icon: 'grid',
          iconOutline: 'grid-outline',
          isMore: true,
          color: '#a855f7',
          glow: ['rgba(168, 85, 247, 0.32)', 'rgba(126, 34, 206, 0.18)', 'rgba(168, 85, 247, 0.05)'],
          laser: ['#c084fc', '#a855f7', '#7e22ce'],
          border: 'rgba(168, 85, 247, 0.50)',
          shadow: '#a855f7',
        },
      ];
    }

    // 🛒 3. CUSTOMER ROLE
    if (role === 'CUSTOMER' || user.role === 'CUSTOMER') {
      return [
        {
          key: 'store',
          label: 'Store',
          icon: 'cart',
          iconOutline: 'cart-outline',
          path: '/shop',
          color: '#f97316',
          glow: ['rgba(249, 115, 22, 0.32)', 'rgba(234, 88, 12, 0.18)', 'rgba(249, 115, 22, 0.05)'],
          laser: ['#fb923c', '#f97316', '#ea580c'],
          border: 'rgba(249, 115, 22, 0.50)',
          shadow: '#f97316',
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
          key: 'cart',
          label: 'Cart',
          icon: 'bag-check',
          iconOutline: 'bag-check-outline',
          path: '/(user)/(tabs)/cart',
          color: '#10b981',
          glow: ['rgba(16, 185, 129, 0.32)', 'rgba(5, 150, 105, 0.18)', 'rgba(16, 185, 129, 0.05)'],
          laser: ['#00ff87', '#10b981', '#059669'],
          border: 'rgba(16, 185, 129, 0.50)',
          shadow: '#10b981',
        },
        {
          key: 'more',
          label: 'More',
          icon: 'grid',
          iconOutline: 'grid-outline',
          isMore: true,
          color: '#a855f7',
          glow: ['rgba(168, 85, 247, 0.32)', 'rgba(126, 34, 206, 0.18)', 'rgba(168, 85, 247, 0.05)'],
          laser: ['#c084fc', '#a855f7', '#7e22ce'],
          border: 'rgba(168, 85, 247, 0.50)',
          shadow: '#a855f7',
        },
      ];
    }

    // 💼 4. BUSINESS PARTNER ROLE
    if (role === 'BUSINESS_PARTNER' || user.role === 'BUSINESS_PARTNER') {
      return [
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
          key: 'partner',
          label: 'Partner Hub',
          icon: 'briefcase',
          iconOutline: 'briefcase-outline',
          path: '/(partner)/(tabs)',
          color: '#6366f1',
          glow: ['rgba(99, 102, 241, 0.32)', 'rgba(79, 70, 229, 0.18)', 'rgba(99, 102, 241, 0.05)'],
          laser: ['#818cf8', '#6366f1', '#4f46e5'],
          border: 'rgba(99, 102, 241, 0.50)',
          shadow: '#6366f1',
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
          key: 'wallet',
          label: 'Wallet',
          icon: 'wallet',
          iconOutline: 'wallet-outline',
          path: '/(partner)/(tabs)/wallet',
          color: '#f59e0b',
          glow: ['rgba(245, 158, 11, 0.32)', 'rgba(217, 119, 6, 0.18)', 'rgba(245, 158, 11, 0.05)'],
          laser: ['#fbbf24', '#f59e0b', '#d97706'],
          border: 'rgba(245, 158, 11, 0.50)',
          shadow: '#f59e0b',
        },
        {
          key: 'more',
          label: 'More',
          icon: 'grid',
          iconOutline: 'grid-outline',
          isMore: true,
          color: '#a855f7',
          glow: ['rgba(168, 85, 247, 0.32)', 'rgba(126, 34, 206, 0.18)', 'rgba(168, 85, 247, 0.05)'],
          laser: ['#c084fc', '#a855f7', '#7e22ce'],
          border: 'rgba(168, 85, 247, 0.50)',
          shadow: '#a855f7',
        },
      ];
    }

    // 🛡️ 5. DEFAULT / ADMIN / STAFF ROLES
    return [
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
        key: 'crops',
        label: 'Farming',
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
      {
        key: 'more',
        label: 'More',
        icon: 'grid',
        iconOutline: 'grid-outline',
        isMore: true,
        color: '#a855f7',
        glow: ['rgba(168, 85, 247, 0.32)', 'rgba(126, 34, 206, 0.18)', 'rgba(168, 85, 247, 0.05)'],
        laser: ['#c084fc', '#a855f7', '#7e22ce'],
        border: 'rgba(168, 85, 247, 0.50)',
        shadow: '#a855f7',
      },
    ];
  }, [user, role]);

  // Compute active tab index
  const getActiveIndex = () => {
    if (showMoreModal) return 4;
    for (let i = 0; i < navTabs.length; i++) {
      const tab = navTabs[i];
      if (tab.path && (pathname === tab.path || (tab.path !== '/' && pathname.startsWith(tab.path)))) {
        return i;
      }
    }
    if (pathname.startsWith('/ai-doctor') || pathname.startsWith('/crop-intelligence') || pathname.startsWith('/crop-disease-scanner')) {
      return 2;
    }
    if (pathname.startsWith('/shop') || pathname.startsWith('/store')) {
      return navTabs.findIndex(t => t.key === 'store') !== -1 ? navTabs.findIndex(t => t.key === 'store') : 3;
    }
    return 0; // Default Home
  };

  const activeIndex = getActiveIndex();
  const [barWidth, setBarWidth] = useState(0);
  const slideAnim = useRef(new RNAnimated.Value(activeIndex)).current;

  useEffect(() => {
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

  // Do not render inside auth flows (login/register)
  const inAuthGroup = pathname.startsWith('/(auth)') || pathname === '/login' || pathname === '/register';
  if (inAuthGroup) {
    return null;
  }

  const handleTabPress = (tabIndex: number, tabItem: NavTabItem) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (tabItem.isMore) {
      setShowMoreModal(true);
      return;
    }
    if (tabItem.path) {
      router.push(tabItem.path as any);
    }
  };

  const handleLogout = () => {
    const doLogout = () => {
      setShowMoreModal(false);
      logout();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out from FarmsKing?')) {
        doLogout();
      }
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out from FarmsKing?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  const currentTab = navTabs[activeIndex] || navTabs[0];

  return (
    <>
      {/* ── Fixed Bottom Tab Bar ── */}
      <View style={styles.fixedWrapper} pointerEvents="box-none">
        <View
          style={styles.barContainer}
          onLayout={(e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width)}
        >
          {Platform.OS === 'web' && (
            <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
          )}

          {/* Dynamic Gliding Active Pill */}
          {barWidth > 0 && (
            <RNAnimated.View
              style={[
                styles.bottomGliderPill,
                {
                  width: Math.max(0, (barWidth / navTabs.length) - 8),
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 1, 2, 3, 4],
                        outputRange: [0, 1, 2, 3, 4].map(
                          (i) => i * (barWidth / navTabs.length) + 4
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

          {/* 5 Dynamic Nav Tabs */}
          {navTabs.map((tab, idx) => {
            const isTabActive = activeIndex === idx;

            if (tab.isSpecial) {
              // Center Hero Scanner
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.centerScanWrap}
                  onPress={() => handleTabPress(idx, tab)}
                  activeOpacity={0.88}
                >
                  <View
                    style={[
                      styles.centerScanGlowAura,
                      Platform.OS === 'web' ? ({ className: 'center-scan-pulse' } as any) : {},
                    ]}
                  />
                  <LinearGradient
                    colors={isTabActive ? ['#06b6d4', '#0891b2', '#0e7490'] : ['#06b6d4', '#059669', '#047857']}
                    style={[styles.centerScanInner, isTabActive && styles.centerScanActive]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={tab.icon} size={22} color="#ffffff" />
                  </LinearGradient>
                  <Text
                    style={[
                      styles.tabLabel,
                      { marginTop: 2 },
                      isTabActive && { color: '#06b6d4', fontWeight: '800' },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabBtn}
                onPress={() => handleTabPress(idx, tab)}
                activeOpacity={0.8}
              >
                <View style={styles.iconWrapper}>
                  <Ionicons
                    name={isTabActive ? tab.icon : tab.iconOutline}
                    size={21}
                    color={isTabActive ? tab.color : '#94a3b8'}
                  />
                  {tab.key === 'store' && totalCartCount > 0 && (
                    <View style={styles.cartBadge}>
                      <Text style={styles.cartBadgeText}>
                        {totalCartCount > 99 ? '99+' : totalCartCount}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.tabLabel, isTabActive && { color: tab.color, fontWeight: '800' }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── 📱 HIGH-END EXECUTIVE "MORE" APP SHEET MODAL ── */}
      <Modal
        visible={showMoreModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMoreModal(false)}
      >
        <View style={sheetStyles.overlay}>
          <TouchableOpacity
            style={sheetStyles.backdropTap}
            activeOpacity={1}
            onPress={() => setShowMoreModal(false)}
          />

          <View style={sheetStyles.sheetCard}>
            {/* Sheet Handle */}
            <View style={sheetStyles.handleBar} />

            {/* Header */}
            <View style={sheetStyles.sheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <BrandLogo height={24} width={88} dark={true} resizeMode="contain" />
                <View style={sheetStyles.appBadge}>
                  <Text style={sheetStyles.appBadgeText}>App Directory</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowMoreModal(false)}
                style={sheetStyles.closeCircle}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={sheetStyles.scrollContent}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {/* User Profile Card */}
              {user ? (
                <View style={sheetStyles.userProfileBox}>
                  <View style={sheetStyles.avatarWrap}>
                    <Text style={sheetStyles.avatarText}>
                      {(user.name || user.mobile || 'U').slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={sheetStyles.userName} numberOfLines={1}>
                      {user.name || 'FarmsKing Member'}
                    </Text>
                    <Text style={sheetStyles.userMobile}>
                      +91 {user.mobile ? user.mobile.replace(/\D/g, '').slice(-10) : 'Registered User'}
                    </Text>
                    <View style={sheetStyles.badgeRow}>
                      <View style={sheetStyles.roleBadge}>
                        <Text style={sheetStyles.roleBadgeText}>
                          {role === 'FARMER' ? '🌾 Verified Farmer' :
                           role === 'GARDENER' ? '🌿 Home Gardener' :
                           role === 'BUSINESS_PARTNER' ? '💼 Business Partner' :
                           role === 'CUSTOMER' ? '🛒 Customer' :
                           user.role || 'Member'}
                        </Text>
                      </View>
                      {user.kingId && (
                        <View style={sheetStyles.kingIdBadge}>
                          <Text style={sheetStyles.kingIdText}>ID: {user.kingId}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setShowMoreModal(false);
                      router.push('/profile');
                    }}
                    style={sheetStyles.editProfileBtn}
                  >
                    <Ionicons name="chevron-forward" size={16} color="#10b981" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={sheetStyles.guestProfileBox}>
                  <View style={{ flex: 1 }}>
                    <Text style={sheetStyles.guestTitle}>Welcome to FarmsKing</Text>
                    <Text style={sheetStyles.guestSubtitle}>
                      Sign in to access your farm pathology records, live mandi feed, and orders.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={sheetStyles.guestLoginBtn}
                    onPress={() => {
                      setShowMoreModal(false);
                      router.push('/(auth)/login');
                    }}
                  >
                    <Text style={sheetStyles.guestLoginText}>Log In</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Quick Navigation Features */}
              <Text style={sheetStyles.sectionTitle}>Farm & Dashboard Shortcuts</Text>
              <View style={sheetStyles.menuListCard}>
                <TouchableOpacity
                  style={sheetStyles.menuRow}
                  onPress={() => {
                    setShowMoreModal(false);
                    router.push('/ai-doctor');
                  }}
                >
                  <View style={[sheetStyles.menuIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                    <Ionicons name="sparkles" size={17} color="#06b6d4" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={sheetStyles.menuTitle}>AI Crop Doctor Pathology</Text>
                    <Text style={sheetStyles.menuSubtitle}>Instant plant disease diagnosis & treatment</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#64748b" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={sheetStyles.menuRow}
                  onPress={() => {
                    setShowMoreModal(false);
                    router.push('/topic/Mandi-Rates');
                  }}
                >
                  <View style={[sheetStyles.menuIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                    <Ionicons name="trending-up" size={17} color="#f59e0b" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={sheetStyles.menuTitle}>Live APMC Mandi Rates</Text>
                    <Text style={sheetStyles.menuSubtitle}>All-India commodity price intelligence</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#64748b" />
                </TouchableOpacity>

                {user && (role === 'FARMER' || role === 'GARDENER' || user.role === 'FARMER') && (
                  <TouchableOpacity
                    style={sheetStyles.menuRow}
                    onPress={() => {
                      setShowMoreModal(false);
                      router.push('/(user)/(tabs)/records');
                    }}
                  >
                    <View style={[sheetStyles.menuIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                      <Ionicons name="document-text" size={17} color="#10b981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={sheetStyles.menuTitle}>Bahi-Khata / Farm Records</Text>
                      <Text style={sheetStyles.menuSubtitle}>Kisan digital ledger & crop expenditure</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#64748b" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[sheetStyles.menuRow, { borderBottomWidth: 0 }]}
                  onPress={() => {
                    setShowMoreModal(false);
                    router.push('/order-tracking');
                  }}
                >
                  <View style={[sheetStyles.menuIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                    <Ionicons name="cube" size={17} color="#3b82f6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={sheetStyles.menuTitle}>Order Tracking</Text>
                    <Text style={sheetStyles.menuSubtitle}>Track courier shipment & live package status</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Legal & App Essentials Section (Explicit User Request) */}
              <Text style={sheetStyles.sectionTitle}>Terms, Policies & Compliance</Text>
              <View style={sheetStyles.menuListCard}>
                <TouchableOpacity
                  style={sheetStyles.menuRow}
                  onPress={() => {
                    setShowMoreModal(false);
                    router.push('/terms');
                  }}
                >
                  <View style={[sheetStyles.menuIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                    <Ionicons name="document-text-outline" size={17} color="#6366f1" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={sheetStyles.menuTitle}>Terms and Conditions</Text>
                    <Text style={sheetStyles.menuSubtitle}>Platform terms of service & user agreement</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#64748b" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={sheetStyles.menuRow}
                  onPress={() => {
                    setShowMoreModal(false);
                    router.push('/privacy-policy');
                  }}
                >
                  <View style={[sheetStyles.menuIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Ionicons name="shield-checkmark-outline" size={17} color="#10b981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={sheetStyles.menuTitle}>Privacy Policy</Text>
                    <Text style={sheetStyles.menuSubtitle}>DPDPA 2023 & Google Play policy compliant</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#64748b" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={sheetStyles.menuRow}
                  onPress={() => {
                    setShowMoreModal(false);
                    router.push('/refund-policy');
                  }}
                >
                  <View style={[sheetStyles.menuIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                    <Ionicons name="refresh-circle-outline" size={17} color="#f59e0b" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={sheetStyles.menuTitle}>Refund & Return Policy</Text>
                    <Text style={sheetStyles.menuSubtitle}>100% genuine inputs & refund protocols</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#64748b" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={sheetStyles.menuRow}
                  onPress={() => {
                    setShowMoreModal(false);
                    router.push('/compliance');
                  }}
                >
                  <View style={[sheetStyles.menuIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                    <Ionicons name="business-outline" size={17} color="#a855f7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={sheetStyles.menuTitle}>MCA Statutory Compliance</Text>
                    <Text style={sheetStyles.menuSubtitle}>CIN: U01100PB2026PTC063294 • Ministry of Corporate Affairs</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#64748b" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[sheetStyles.menuRow, { borderBottomWidth: 0 }]}
                  onPress={() => {
                    setShowMoreModal(false);
                    router.push('/contact-us');
                  }}
                >
                  <View style={[sheetStyles.menuIconBox, { backgroundColor: 'rgba(14, 165, 233, 0.15)' }]}>
                    <Ionicons name="headset-outline" size={17} color="#0ea5e9" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={sheetStyles.menuTitle}>Support & Helpline</Text>
                    <Text style={sheetStyles.menuSubtitle}>24/7 Farmer Advisory & Agronomist Helpdesk</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Dedicated Language Selector Box (Permitted regional scripts per Rule 1) */}
              <Text style={sheetStyles.sectionTitle}>Language Selection</Text>
              <View style={sheetStyles.langBox}>
                <TouchableOpacity
                  style={[sheetStyles.langPill, language === 'en' && sheetStyles.langPillActive]}
                  onPress={() => setLanguage('en')}
                >
                  <Text style={[sheetStyles.langText, language === 'en' && sheetStyles.langTextActive]}>English</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[sheetStyles.langPill, language === 'pa' && sheetStyles.langPillActive]}
                  onPress={() => setLanguage('pa')}
                >
                  <Text style={[sheetStyles.langText, language === 'pa' && sheetStyles.langTextActive]}>ਪੰਜਾਬੀ</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[sheetStyles.langPill, language === 'hi' && sheetStyles.langPillActive]}
                  onPress={() => setLanguage('hi')}
                >
                  <Text style={[sheetStyles.langText, language === 'hi' && sheetStyles.langTextActive]}>हिंदी</Text>
                </TouchableOpacity>
              </View>

              {/* Log Out Button */}
              {user && (
                <TouchableOpacity
                  style={sheetStyles.logoutBtn}
                  activeOpacity={0.85}
                  onPress={handleLogout}
                >
                  <Ionicons name="power" size={18} color="#ef4444" />
                  <Text style={sheetStyles.logoutBtnText}>Log Out from FarmsKing</Text>
                </TouchableOpacity>
              )}

              {/* Corporate Footer Seal */}
              <View style={sheetStyles.footerSeal}>
                <Text style={sheetStyles.footerSealText}>
                  FARMSKING TECHNOLOGIES PRIVATE LIMITED
                </Text>
                <Text style={sheetStyles.footerSubText}>
                  ISO 9001:2015 &amp; ISO 27001 Certified • CIN: U01100PB2026PTC063294
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
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

const sheetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.72)',
    justifyContent: 'flex-end',
  },
  backdropTap: {
    flex: 1,
  },
  sheetCard: {
    backgroundColor: '#0c1322',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.2,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    maxHeight: '88%',
    paddingHorizontal: 16,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  handleBar: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  appBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  appBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#34d399',
    letterSpacing: 0.4,
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: 12,
  },
  userProfileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.28)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  avatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  avatarText: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  userName: {
    fontSize: 14.5,
    fontFamily: FONT.bold,
    color: '#f8fafc',
  },
  userMobile: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  roleBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#34d399',
  },
  kingIdBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  kingIdText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#fbbf24',
  },
  editProfileBtn: {
    padding: 6,
  },
  guestProfileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  guestTitle: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#f8fafc',
  },
  guestSubtitle: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 15,
  },
  guestLoginBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  guestLoginText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 6,
  },
  menuListCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#e2e8f0',
  },
  menuSubtitle: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 1,
  },
  langBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 6,
    marginBottom: 14,
  },
  langPill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  langPillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.20)',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  langText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  langTextActive: {
    fontFamily: FONT.bold,
    color: '#34d399',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1.2,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  logoutBtnText: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#ef4444',
  },
  footerSeal: {
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  footerSealText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#64748b',
    letterSpacing: 0.4,
  },
  footerSubText: {
    fontSize: 8.5,
    fontFamily: FONT.medium,
    color: '#475569',
    marginTop: 2,
  },
});
