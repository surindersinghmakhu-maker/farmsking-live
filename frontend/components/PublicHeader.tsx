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
  { label: 'Home',         path: '/',                  icon: 'home-outline',        image: null,                                               color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  { label: 'Agri Store',   path: '/shop',              icon: 'storefront-outline',  image: require('@/assets/images/icon_agristore_new.png'),   color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  { label: 'Farming',      path: '/topic/Farming',     icon: 'leaf-outline',        image: require('@/assets/images/icon_farming_new.png'),     color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { label: 'Gardening',    path: '/topic/Gardening',   icon: 'flower-outline',      image: require('@/assets/images/icon_gardening_new.png'),   color: '#e11d48', bg: 'rgba(225,29,72,0.1)' },
  { label: 'Crop Doctors', path: '/topic/Crop-Doctors',icon: 'medkit-outline',      image: require('@/assets/images/icon_cropdoctors_new.png'), color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
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

  const goToDashboard = () => {
    setMenuOpen(false);
    if (['BUSINESS_PARTNER', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR', 'TECHNICAL_TRAINER'].includes(user?.role || '')) {
      router.push('/(partner)/(tabs)' as any);
    } else {
      router.push('/(user)/(tabs)' as any);
    }
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
              onPress={goToDashboard}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#059669', '#047857']} style={styles.userBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.userAvatarCircle}>
                  <Text style={styles.userAvatarInitials}>
                    {(user.name || user.mobile || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userBtnTextBox}>
                  <Text style={styles.userBtnName} numberOfLines={1}>
                    {user.name || user.mobile || 'My Account'}
                  </Text>
                  <View style={styles.dashboardCueRow}>
                    <Text style={styles.dashboardCueText}>Dashboard</Text>
                    <Ionicons name="arrow-forward" size={10} color="#a7f3d0" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
              <Animated.View style={pulseStyle}>
                <TouchableOpacity
                  style={styles.loginBtn}
                  onPress={() => goTo('/(auth)/login')}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['rgba(16,185,129,0.12)', 'rgba(16,185,129,0.06)']} style={styles.loginBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name="person-circle-outline" size={19} color="#059669" />
                    <View style={styles.loginBtnTextBox}>
                      <Text style={styles.loginBtnText}>Login / Register</Text>
                      <Text style={styles.loginBtnSubText}>Farmer & Partner Portal</Text>
                    </View>
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
                  {link.image ? (
                    <Image source={link.image} style={{ width: 28, height: 28, borderRadius: 6 }} resizeMode="contain" />
                  ) : (
                    <Ionicons name={link.icon as any} size={18} color={active ? link.color : '#64748b'} />
                  )}
                </View>
                <Text style={[styles.mobileItemText, active && { color: link.color, fontFamily: FONT.extraBold }]}>
                  {link.label}
                </Text>
                {active && <Ionicons name="chevron-forward" size={16} color={link.color} style={{ marginLeft: 'auto' }} />}
              </TouchableOpacity>
            );
          })}

          {/* Auth Action inside Mobile Menu */}
          {user ? (
            <TouchableOpacity
              style={styles.mobileUserCard}
              onPress={goToDashboard}
              activeOpacity={0.88}
            >
              <LinearGradient colors={['#065f46', '#047857']} style={styles.mobileUserCardInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.mobileUserHeaderRow}>
                  <View style={styles.mobileUserAvatar}>
                    <Text style={styles.mobileUserAvatarText}>
                      {(user.name || user.mobile || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mobileUserName} numberOfLines={1}>
                      {user.name || user.mobile || 'FarmsKing Member'}
                    </Text>
                    <Text style={styles.mobileUserRole}>
                      {user.role ? `${user.role.replace('_', ' ')} · ` : ''}Active
                    </Text>
                  </View>
                </View>
                <View style={styles.mobileOpenDashboardBtn}>
                  <Text style={styles.mobileOpenDashboardText}>Open Dashboard</Text>
                  <Ionicons name="arrow-forward-circle" size={18} color="#022c22" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.mobileLoginBtn}
              onPress={() => goTo('/(auth)/login')}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#00ff87', '#059669']} style={styles.mobileLoginBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="person-circle" size={20} color="#02120a" />
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.mobileLoginBtnText}>Login / Register</Text>
                  <Text style={styles.mobileLoginBtnSubText}>Farmer & Partner Portal · Free Access</Text>
                </View>
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
  loginBtn: { borderRadius: 99, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)' },
  loginBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 7 },
  loginBtnTextBox: { flexDirection: 'column' },
  loginBtnText: { color: '#059669', fontSize: 13, fontFamily: FONT.bold, lineHeight: 16 },
  loginBtnSubText: { color: '#16a34a', fontSize: 9, fontFamily: FONT.semiBold, letterSpacing: 0.3 },

  // User button (logged in)
  userBtn: { borderRadius: 99, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', ...premiumShadow('rgba(16,185,129,0.2)', 'sm') },
  userBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, minWidth: 120, maxWidth: 175 },
  userAvatarCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  userAvatarInitials: { color: '#047857', fontSize: 13, fontFamily: FONT.extraBold },
  userBtnTextBox: { flex: 1, justifyContent: 'center' },
  userBtnName: { color: '#ffffff', fontSize: 12, fontFamily: FONT.bold, lineHeight: 14 },
  dashboardCueRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dashboardCueText: { color: '#a7f3d0', fontSize: 9.5, fontFamily: FONT.bold, letterSpacing: 0.3 },

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

  // Mobile Logged-in User Card
  mobileUserCard: { marginTop: 14, borderRadius: 16, overflow: 'hidden', ...premiumShadow('#059669', 'sm') },
  mobileUserCardInner: { padding: 14, gap: 12 },
  mobileUserHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mobileUserAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  mobileUserAvatarText: { color: '#047857', fontSize: 16, fontFamily: FONT.extraBold },
  mobileUserName: { color: '#ffffff', fontSize: 15, fontFamily: FONT.extraBold },
  mobileUserRole: { color: '#a7f3d0', fontSize: 11, fontFamily: FONT.medium, marginTop: 1 },
  mobileOpenDashboardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#00ff87', paddingVertical: 9, borderRadius: 10 },
  mobileOpenDashboardText: { color: '#022c22', fontSize: 13, fontFamily: FONT.extraBold },

  // Login inside mobile menu
  mobileLoginBtn: { marginTop: 16, borderRadius: 99, overflow: 'hidden', ...premiumShadow('#00ff87', 'md') },
  mobileLoginBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 12 },
  mobileLoginBtnText: { color: '#02120a', fontFamily: FONT.extraBold, fontSize: 15 },
  mobileLoginBtnSubText: { color: '#032514', fontSize: 11, fontFamily: FONT.semiBold, marginTop: 2 },
});
