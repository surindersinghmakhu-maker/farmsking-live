import React, { useState, useEffect, useRef } from 'react';
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
import { useAuth } from '@/src/store/auth-context';
import { FONT } from '@/constants/theme';
import { BrandLogo } from '@/src/components/BrandLogo';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

const ADMIN_NAV_LINKS = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    icon: 'home-outline',
    activeIcon: 'home',
    color: '#10b981',
    laser: ['#00ff87', '#10b981', '#059669'],
    glow: ['rgba(16, 185, 129, 0.28)', 'rgba(5, 150, 105, 0.16)', 'rgba(16, 185, 129, 0.05)'],
    border: 'rgba(16, 185, 129, 0.45)',
    shadow: '#10b981',
  },
  {
    id: 'shop',
    label: 'Store',
    path: '/shop',
    icon: 'cart-outline',
    activeIcon: 'cart',
    color: '#3b82f6',
    laser: ['#60a5fa', '#3b82f6', '#2563eb'],
    glow: ['rgba(59, 130, 246, 0.28)', 'rgba(37, 99, 235, 0.16)', 'rgba(59, 130, 246, 0.05)'],
    border: 'rgba(59, 130, 246, 0.45)',
    shadow: '#3b82f6',
  },
  {
    id: 'support',
    label: 'Support',
    path: '/support',
    icon: 'help-buoy-outline',
    activeIcon: 'help-buoy',
    color: '#06b6d4',
    laser: ['#38bdf8', '#06b6d4', '#0284c7'],
    glow: ['rgba(6, 182, 212, 0.28)', 'rgba(2, 132, 199, 0.16)', 'rgba(6, 182, 212, 0.05)'],
    border: 'rgba(6, 182, 212, 0.45)',
    shadow: '#06b6d4',
  },
  {
    id: 'contact',
    label: 'Contact Us',
    path: '/contact-us',
    icon: 'call-outline',
    activeIcon: 'call',
    color: '#8b5cf6',
    laser: ['#a78bfa', '#8b5cf6', '#6d28d9'],
    glow: ['rgba(139, 92, 246, 0.28)', 'rgba(109, 40, 217, 0.16)', 'rgba(139, 92, 246, 0.05)'],
    border: 'rgba(139, 92, 246, 0.45)',
    shadow: '#8b5cf6',
  },
];

export default function PublicHeader({ 
  onCartPress, 
  cartItemCount 
}: { 
  onCartPress?: () => void;
  cartItemCount?: number;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const { user } = useAuth();
  
  const [menuOpen, setMenuOpen] = useState(false);
  const pulseScale = useSharedValue(1);

  // Active navigation index
  const getNavActiveIndex = () => {
    if (pathname === '/' || pathname === '/index' || pathname === '') return 0;
    if (pathname.startsWith('/shop')) return 1;
    if (pathname.startsWith('/support')) return 2;
    if (pathname.startsWith('/contact-us')) return 3;
    return 0;
  };

  const navActiveIndex = getNavActiveIndex();
  const initialIndex = typeof window !== 'undefined' && (window as any).__fk_admin_nav_index !== undefined
    ? (window as any).__fk_admin_nav_index
    : navActiveIndex;
  const navSlideAnim = useRef(new RNAnimated.Value(initialIndex)).current;
  const [navMeasurements, setNavMeasurements] = useState<{ x: number; width: number }[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__fk_admin_nav_index = navActiveIndex;
    }
    RNAnimated.spring(navSlideAnim, {
      toValue: navActiveIndex,
      tension: 68,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [navActiveIndex]);

  const handleAdminNavClick = (idx: number, path: string) => {
    if (typeof window !== 'undefined') {
      (window as any).__fk_admin_nav_index = idx;
    }
    RNAnimated.spring(navSlideAnim, {
      toValue: idx,
      tension: 68,
      friction: 10,
      useNativeDriver: false,
    }).start();
    setTimeout(() => {
      router.push(path as any);
    }, 160);
  };

  useEffect(() => {
    if (!user) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 1200 }),
          withTiming(1, { duration: 1200 })
        ),
        -1,
        true
      );
    }
  }, [user]);

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }]
    };
  });

  const handleMobileNav = (path: string) => {
    setMenuOpen(false);
    router.push(path as any);
  };

  const handleNavLinkLayout = (index: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setNavMeasurements((prev) => {
      const copy = [...prev];
      copy[index] = { x, width };
      return copy;
    });
  };

  const currentNavTab = ADMIN_NAV_LINKS[navActiveIndex] || ADMIN_NAV_LINKS[0];

  return (
    <>
      <View style={[styles.floatingHeader, !isDesktop && styles.floatingHeaderMobile, menuOpen && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}>
        <TouchableOpacity
          style={[styles.logoContainer, styles.logoCapsule]}
          onPress={() => router.push('/')}
          activeOpacity={0.8}
        >
          <BrandLogo
            height={isDesktop ? 38 : 30}
            width={isDesktop ? 124 : 98}
            useHdQuality
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Desktop Nav: Continuous Gliding Colorful Spring Pill */}
        {isDesktop && (
          <View style={styles.navLinks}>
            {navMeasurements.length === ADMIN_NAV_LINKS.length && (
              <RNAnimated.View
                style={[
                  styles.desktopGlidingPill,
                  {
                    left: navSlideAnim.interpolate({
                      inputRange: [0, 1, 2, 3],
                      outputRange: navMeasurements.map((m) => m?.x ?? 0),
                      extrapolate: 'clamp',
                    }),
                    width: navSlideAnim.interpolate({
                      inputRange: [0, 1, 2, 3],
                      outputRange: navMeasurements.map((m) => m?.width ?? 0),
                      extrapolate: 'clamp',
                    }),
                    borderColor: currentNavTab.border,
                    shadowColor: currentNavTab.shadow,
                  },
                ]}
                pointerEvents="none"
              >
                <LinearGradient
                  colors={currentNavTab.glow}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={currentNavTab.laser}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.desktopLaserBar}
                />
              </RNAnimated.View>
            )}

            {ADMIN_NAV_LINKS.map((link, idx) => {
              const active = navActiveIndex === idx;
              return (
                <TouchableOpacity
                  key={link.id}
                  onPress={() => handleAdminNavClick(idx, link.path)}
                  onLayout={(e) => handleNavLinkLayout(idx, e)}
                  style={styles.navLinkItem}
                  activeOpacity={0.8}
                >
                  <View style={styles.navLinkInner}>
                    <View
                      style={[
                        Platform.OS === 'web'
                          ? ({
                              transform: active ? 'scale(1.18)' : 'scale(1)',
                              transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            } as any)
                          : active
                          ? { transform: [{ scale: 1.15 }] }
                          : {},
                      ]}
                    >
                      <Ionicons
                        name={(active ? link.activeIcon : link.icon) as any}
                        size={15}
                        color={active ? link.color : '#94a3b8'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.navLinkText,
                        active && { color: link.color, fontFamily: FONT.extraBold },
                        Platform.OS === 'web' ? ({ transition: 'color 0.3s ease' } as any) : {},
                      ]}
                    >
                      {link.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: isDesktop ? 12 : 8 }}>
          {onCartPress && (
            <TouchableOpacity
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 }}
              activeOpacity={0.85}
              onPress={onCartPress}
            >
              <Ionicons name="cart" size={18} color="#fff" />
              {cartItemCount && cartItemCount > 0 ? (
                <View style={{ backgroundColor: '#ef4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontFamily: FONT.bold }}>{cartItemCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          )}

          {user ? (
            <TouchableOpacity 
              style={[styles.loginBtn, { backgroundColor: '#10b981', borderColor: '#059669' }, !isDesktop && { paddingHorizontal: 12, paddingVertical: 6 }]}
              onPress={() => router.push('/admin/(tabs)' as any)}
              activeOpacity={0.8}
            >
              <Text style={[styles.loginBtnText, { color: '#ffffff' }, !isDesktop && { fontSize: 12 }]}>
                {user.name ? user.name.split(' ')[0] : 'App'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Animated.View style={pulseStyle}>
              <TouchableOpacity 
                style={[styles.loginBtn, !isDesktop && { paddingHorizontal: 12, paddingVertical: 6 }]}
                onPress={() => {
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
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.loginBtnText, !isDesktop && { fontSize: 12 }]}>Login / App</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {!isDesktop && (
            <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)} style={{ padding: 4, marginLeft: 4 }}>
              <Ionicons name={menuOpen ? "close" : "menu"} size={28} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!isDesktop && menuOpen && (
        <View style={styles.mobileMenuDropdown}>
          {ADMIN_NAV_LINKS.map((item) => {
            const active = (pathname === item.path) || (item.path === '/' && (pathname === '' || pathname === '/index'));
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.mobileMenuItem, active && { backgroundColor: item.glow[0], borderColor: item.border, borderWidth: 1 }]}
                onPress={() => handleMobileNav(item.path)}
                activeOpacity={0.8}
              >
                <Ionicons name={(active ? item.activeIcon : item.icon) as any} size={20} color={active ? item.color : '#fff'} />
                <Text style={[styles.mobileMenuText, active && { color: item.color, fontWeight: '800' }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  floatingHeader: {
    alignSelf: 'center',
    position: 'absolute',
    top: 20,
    width: '90%',
    maxWidth: 1200,
    backgroundColor: 'rgba(20, 30, 45, 0.88)',
    borderRadius: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 8,
    zIndex: 100,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  floatingHeaderMobile: {
    width: '95%',
    top: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCapsule: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 22,
    backgroundColor: 'rgba(2, 6, 23, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  desktopGlidingPill: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    borderRadius: 16,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  desktopLaserBar: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 2,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 6,
  },
  navLinkItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    position: 'relative',
    zIndex: 2,
  },
  navLinkInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  navLinkText: {
    color: '#94a3b8',
    fontSize: 13.5,
    fontFamily: FONT.bold,
  },
  loginBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  mobileMenuDropdown: {
    position: 'absolute',
    top: 60,
    width: '95%',
    alignSelf: 'center',
    backgroundColor: 'rgba(20, 30, 45, 0.96)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 12,
    zIndex: 99,
    gap: 6,
  },
  mobileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 12,
  },
  mobileMenuText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: FONT.bold,
  },
});
