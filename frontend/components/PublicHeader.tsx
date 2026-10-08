import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/store/auth-context';
import { FONT, premiumShadow } from '@/constants/theme';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat,
  withSequence, withTiming, withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const NAV_LINKS = [
  { label: 'Home',         path: '/',                  icon: 'home-outline',        color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  { label: 'Agri Store',   path: '/shop',              icon: 'storefront-outline',  color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  { label: 'Farming',      path: '/topic/Farming',     icon: 'leaf-outline',        color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { label: 'Gardening',    path: '/topic/Gardening',   icon: 'flower-outline',      color: '#e11d48', bg: 'rgba(225,29,72,0.1)' },
  { label: 'Crop Doctors', path: '/topic/Crop-Doctors',icon: 'medkit-outline',      color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
];

export default function PublicHeader({
  onCartPress,
  cartItemCount,
}: {
  onCartPress?: () => void;
  cartItemCount?: number;
} = {}) {
  const router   = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktop = width > 1024;
  const isTablet  = width > 768 && width <= 1024;
  const isMobile  = width <= 768;
  const { user } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  // Pulse animation on Login CTA when no user
  const pulseScale = useSharedValue(1);
  useEffect(() => {
    if (!user) {
      pulseScale.value = withRepeat(
        withSequence(withTiming(1.06, { duration: 1400 }), withTiming(1, { duration: 1400 })),
        -1, true
      );
    }
  }, [user]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));

  const isActive = (path: string) =>
    pathname === path || (path === '/' && (pathname === '/index' || pathname === ''));

  const goTo = (path: string) => {
    setMenuOpen(false);
    router.push(path as any);
  };

  return (
    <>
      {/* ── Main Header ── */}
      <View style={[
        styles.header,
        isMobile  && styles.headerMobile,
        menuOpen  && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
      ]}>
        {Platform.OS === 'web' && <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />}

        {/* Logo */}
        <TouchableOpacity style={styles.logo} onPress={() => goTo('/')} activeOpacity={0.8}>
          <Image
            source={require('@/assets/images/farmsking_logo_transparent_bg.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.logoName}>FarmsKing</Text>
            <Text style={styles.logoTag}>SMART FARMING PLATFORM</Text>
          </View>
        </TouchableOpacity>

        {/* Desktop Nav Links */}
        {isDesktop && (
          <View style={styles.navLinks}>
            {NAV_LINKS.map((link) => {
              const active = isActive(link.path);
              return (
                <TouchableOpacity key={link.path} onPress={() => goTo(link.path)} activeOpacity={0.7}>
                  <Text style={[styles.navLink, active && { color: link.color, backgroundColor: link.bg, fontFamily: FONT.extraBold }]}>
                    {link.label}
                  </Text>
                  {active && <View style={[styles.navLinkBar, { backgroundColor: link.color }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Right Actions */}
        <View style={styles.rightActions}>
          {/* Cart */}
          {onCartPress && (
            <TouchableOpacity style={styles.iconBtn} onPress={onCartPress} activeOpacity={0.8}>
              <Ionicons name="cart-outline" size={20} color="#334155" />
              {cartItemCount && cartItemCount > 0 ? (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          )}

          {/* Login / Go to App */}
          {user ? (
            <TouchableOpacity
              style={styles.userBtn}
              onPress={() => goTo('/(tabs)')}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#10b981', '#059669']} style={styles.userBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="person" size={14} color="#fff" />
                <Text style={styles.userBtnText} numberOfLines={1}>
                  {user.name ? user.name.split(' ')[0] : 'Dashboard'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
              <Animated.View style={pulseStyle}>
                <TouchableOpacity
                  style={styles.loginBtn}
                  onPress={() => goTo('/(auth)/login')}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['rgba(16,185,129,0.1)', 'rgba(16,185,129,0.05)']} style={styles.loginBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name="log-in-outline" size={16} color="#059669" />
                    <Text style={styles.loginBtnText}>Get Started</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}

          {/* Mobile Hamburger */}
          {!isDesktop && (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setMenuOpen(!menuOpen)}
              activeOpacity={0.8}
            >
              <Ionicons name={menuOpen ? 'close' : 'menu'} size={24} color="#334155" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Mobile Dropdown Menu ── */}
      {!isDesktop && menuOpen && (
        <View style={styles.mobileMenu}>
          {Platform.OS === 'web' && <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />}
          <LinearGradient colors={['rgba(255,255,255,0.98)', 'rgba(248,250,252,0.99)']} style={StyleSheet.absoluteFill} />

          {NAV_LINKS.map((link, i) => {
            const active = isActive(link.path);
            return (
              <TouchableOpacity
                key={link.path}
                style={[
                  styles.mobileItem,
                  i < NAV_LINKS.length - 1 && styles.mobileItemBorder,
                  active && styles.mobileItemActive,
                ]}
                onPress={() => goTo(link.path)}
                activeOpacity={0.75}
              >
                <View style={[styles.mobileItemIcon, active && { backgroundColor: link.bg }]}>
                  <Ionicons name={link.icon as any} size={18} color={active ? link.color : '#64748b'} />
                </View>
                <Text style={[styles.mobileItemText, active && { color: link.color, fontFamily: FONT.extraBold }]}>
                  {link.label}
                </Text>
                {active && <Ionicons name="chevron-forward" size={16} color={link.color} style={{ marginLeft: 'auto' }} />}
              </TouchableOpacity>
            );
          })}

          {/* Login row inside menu */}
          {!user && (
            <TouchableOpacity
              style={styles.mobileLoginBtn}
              onPress={() => goTo('/(auth)/login')}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#00ff87', '#059669']} style={styles.mobileLoginBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="rocket" size={16} color="#02120a" />
                <Text style={styles.mobileLoginBtnText}>Start for Free — No Credit Card</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 1280,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    zIndex: 200,
    overflow: 'hidden',
    ...premiumShadow('rgba(0,0,0,0.1)', 'lg'),
  },
  headerMobile: {
    top: 10,
    width: '95%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  // Logo
  logo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoImg: { width: 38, height: 38 },
  logoName: { fontSize: 18, fontFamily: FONT.extraBold, color: '#0f172a', letterSpacing: 0.3 },
  logoTag: { fontSize: 8, fontFamily: FONT.bold, color: '#10b981', letterSpacing: 1, marginTop: -2 },

  // Desktop nav
  navLinks: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navLink: { color: '#64748b', fontSize: 14, fontFamily: FONT.semiBold, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  navLinkActive: { color: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)' },
  navLinkBar: { height: 2, backgroundColor: '#10b981', borderRadius: 1, marginTop: 2, marginHorizontal: 12 },

  // Right side
  rightActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Cart badge
  cartBadge: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#ffffff' },
  cartBadgeText: { color: '#fff', fontSize: 9, fontFamily: FONT.extraBold },

  // Login CTA
  loginBtn: { borderRadius: 99, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  loginBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 18, paddingVertical: 9 },
  loginBtnText: { color: '#059669', fontSize: 13, fontFamily: FONT.bold },

  // User button (logged in)
  userBtn: { borderRadius: 99, overflow: 'hidden' },
  userBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 9, maxWidth: 140 },
  userBtnText: { color: '#fff', fontSize: 13, fontFamily: FONT.bold },

  // Mobile dropdown
  mobileMenu: {
    position: 'absolute',
    top: 68,
    alignSelf: 'center',
    width: '95%',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderTopWidth: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    zIndex: 199,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.98)',
  },
  mobileItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  mobileItemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  mobileItemActive: { backgroundColor: 'rgba(16,185,129,0.06)', marginHorizontal: -16, paddingHorizontal: 16, borderRadius: 12 },
  mobileItemIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' },
  mobileItemIconActive: { backgroundColor: 'rgba(16,185,129,0.12)' },
  mobileItemText: { color: '#334155', fontSize: 15, fontFamily: FONT.bold, flex: 1 },

  // Login inside mobile menu
  mobileLoginBtn: { marginTop: 16, borderRadius: 99, overflow: 'hidden', ...premiumShadow('#00ff87', 'md') },
  mobileLoginBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14 },
  mobileLoginBtnText: { color: '#02120a', fontFamily: FONT.extraBold, fontSize: 15 },
});
