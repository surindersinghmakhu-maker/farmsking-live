import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/store/auth-context';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat,
  withSequence, withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const NAV_LINKS = [
  { label: 'Home',         path: '/',                  icon: 'home-outline',        image: null,                                                     color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', bgNight: 'rgba(59,130,246,0.22)' },
  { label: 'Agri Store',   path: '/shop',              icon: 'storefront-outline',  image: require('@/assets/images/icon_agristore_3d_clean.png'),   color: '#f97316', bg: 'rgba(249,115,22,0.1)', bgNight: 'rgba(249,115,22,0.22)' },
  { label: 'Farming',      path: '/topic/Farming',     icon: 'leaf-outline',        image: require('@/assets/images/icon_farming_3d_clean.png'),     color: '#10b981', bg: 'rgba(16,185,129,0.1)', bgNight: 'rgba(16,185,129,0.22)' },
  { label: 'Gardening',    path: '/topic/Gardening',   icon: 'flower-outline',      image: require('@/assets/images/icon_gardening_3d_clean.png'),   color: '#e11d48', bg: 'rgba(225,29,72,0.1)', bgNight: 'rgba(225,29,72,0.22)' },
  { label: 'Crop Doctors', path: '/topic/Crop-Doctors',icon: 'medkit-outline',      image: require('@/assets/images/icon_cropdoctors_3d_clean.png'), color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', bgNight: 'rgba(6,182,212,0.22)' },
];

export default function PublicHeader({
  onCartPress,
  cartItemCount,
  themeMode: propThemeMode,
  onThemeToggle,
}: {
  onCartPress?: () => void;
  cartItemCount?: number;
  themeMode?: 'day' | 'night';
  onThemeToggle?: (mode: 'day' | 'night') => void;
} = {}) {
  const router   = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktop = width > 1120;
  const isTablet  = width > 768 && width <= 1120;
  const isMobile  = width <= 768;
  const { user } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  // Synchronized Theme state
  const [internalTheme, setInternalTheme] = useState<'day' | 'night'>('day');
  const activeTheme = propThemeMode || internalTheme;
  const isDay = activeTheme === 'day';

  // Synchronized Language state
  const [lang, setLang] = useState<'EN' | 'PA' | 'HI'>('EN');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('farmsking_theme_mode');
      if (savedTheme === 'night' || savedTheme === 'day') {
        setInternalTheme(savedTheme);
      }
      const savedLang = localStorage.getItem('farmsking_user_language');
      if (savedLang) {
        const u = savedLang.toUpperCase();
        if (u === 'EN' || u === 'PA' || u === 'HI') setLang(u as any);
      }
      const handleStorage = () => {
        const t = localStorage.getItem('farmsking_theme_mode');
        if (t === 'night' || t === 'day') setInternalTheme(t);
        const l = localStorage.getItem('farmsking_user_language');
        if (l) {
          const u = l.toUpperCase();
          if (u === 'EN' || u === 'PA' || u === 'HI') setLang(u as any);
        }
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, []);

  const handleToggleTheme = (mode: 'day' | 'night') => {
    setInternalTheme(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('farmsking_theme_mode', mode);
      window.dispatchEvent(new Event('storage'));
    }
    if (onThemeToggle) onThemeToggle(mode);
  };

  const handleLanguageChange = (l: 'EN' | 'PA' | 'HI') => {
    setLang(l);
    if (typeof window !== 'undefined') {
      localStorage.setItem('farmsking_user_language', l.toLowerCase());
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('farmsking_language_change', { detail: l }));
    }
  };

  // Pulse animation on Login CTA when no user
  const pulseScale = useSharedValue(1);
  useEffect(() => {
    if (!user) {
      pulseScale.value = withRepeat(
        withSequence(withTiming(1.05, { duration: 1400 }), withTiming(1, { duration: 1400 })),
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
      {/* ── Main Floating Capsule Header ── */}
      <View style={[
        styles.header,
        isDay ? styles.headerDay : styles.headerNight,
        isMobile && styles.headerMobile,
      ]}>
        {Platform.OS === 'web' && (
          <BlurView
            intensity={45}
            tint={isDay ? 'light' : 'dark'}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Row 1: Logo & Right Controls */}
        <View style={styles.topRow}>
          {/* Logo */}
          <TouchableOpacity style={styles.logo} onPress={() => goTo('/')} activeOpacity={0.8}>
            <Image
              source={require('@/assets/images/farmsking_logo_transparent_bg.png')}
              style={isMobile ? styles.logoImgMobile : styles.logoImg}
              resizeMode="contain"
            />
            <View>
              <Text style={[styles.logoName, isDay ? styles.logoNameDay : styles.logoNameNight, isMobile && { fontSize: 16 }]}>FarmsKing</Text>
              {!isMobile && <Text style={[styles.logoTag, isDay ? styles.logoTagDay : styles.logoTagNight]}>SMART FARMING PLATFORM</Text>}
            </View>
          </TouchableOpacity>

          {/* Desktop Nav Links */}
          {isDesktop && (
            <View style={styles.navLinks}>
              {NAV_LINKS.map((link) => {
                const active = isActive(link.path);
                return (
                  <TouchableOpacity key={link.path} onPress={() => goTo(link.path)} activeOpacity={0.7} style={styles.navLinkWrap}>
                    <Text
                      style={[
                        styles.navLink,
                        isDay ? styles.navLinkDay : styles.navLinkNight,
                        active && (isDay ? styles.navLinkActiveDay : styles.navLinkActiveNight),
                        active && {
                          color: link.color,
                          backgroundColor: isDay ? link.bg : link.bgNight,
                          fontFamily: FONT.extraBold,
                        },
                      ]}
                    >
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
            {/* Day / Night Theme Toggle */}
            <View style={[styles.themeToggleBox, isDay ? styles.themeToggleBoxDay : styles.themeToggleBoxNight]}>
              <TouchableOpacity
                style={[styles.themeSegment, isDay && styles.themeSegmentActiveDay]}
                onPress={() => handleToggleTheme('day')}
                activeOpacity={0.85}
              >
                <Ionicons name="sunny" size={12} color={isDay ? '#b45309' : '#94a3b8'} />
                {!isMobile && <Text style={[styles.themeSegmentText, isDay && styles.themeSegmentTextActiveDay]}>Day</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeSegment, !isDay && styles.themeSegmentActiveNight]}
                onPress={() => handleToggleTheme('night')}
                activeOpacity={0.85}
              >
                <Ionicons name="moon" size={11} color={!isDay ? '#38bdf8' : '#94a3b8'} />
                {!isMobile && <Text style={[styles.themeSegmentText, !isDay && styles.themeSegmentTextActiveNight]}>Night</Text>}
              </TouchableOpacity>
            </View>

            {/* Language Selector (Always visible on mobile & desktop!) */}
            <View style={[styles.langPicker, isDay ? styles.langPickerDay : styles.langPickerNight, isMobile && styles.langPickerMobile]}>
              <TouchableOpacity onPress={() => handleLanguageChange('EN')}>
                <Text style={[styles.langOption, isDay ? styles.langOptionDay : styles.langOptionNight, lang === 'EN' && (isDay ? styles.langOptionActiveDay : styles.langOptionActiveNight)]}>
                  {isMobile ? 'EN' : 'English'}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.langDivider, isDay ? styles.langDividerDay : styles.langDividerNight]}>|</Text>
              <TouchableOpacity onPress={() => handleLanguageChange('PA')}>
                <Text style={[styles.langOption, isDay ? styles.langOptionDay : styles.langOptionNight, lang === 'PA' && (isDay ? styles.langOptionActiveDay : styles.langOptionActiveNight)]}>
                  {isMobile ? 'PA' : 'ਪੰਜਾਬੀ'}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.langDivider, isDay ? styles.langDividerDay : styles.langDividerNight]}>|</Text>
              <TouchableOpacity onPress={() => handleLanguageChange('HI')}>
                <Text style={[styles.langOption, isDay ? styles.langOptionDay : styles.langOptionNight, lang === 'HI' && (isDay ? styles.langOptionActiveDay : styles.langOptionActiveNight)]}>
                  {isMobile ? 'HI' : 'हिंदी'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Cart */}
            {onCartPress && (
              <TouchableOpacity
                style={[styles.iconBtn, isDay ? styles.iconBtnDay : styles.iconBtnNight]}
                onPress={onCartPress}
                activeOpacity={0.8}
              >
                <Ionicons name="cart-outline" size={18} color={isDay ? '#334155' : '#e2e8f0'} />
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
                style={[styles.userBtn, isDay ? styles.userBtnDay : styles.userBtnNight]}
                onPress={goToDashboard}
                activeOpacity={0.85}
              >
                <LinearGradient colors={isDay ? ['#059669', '#047857'] : ['#10b981', '#059669']} style={styles.userBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
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
                  style={[styles.loginBtn, isDay ? styles.loginBtnDay : styles.loginBtnNight, isMobile && { borderRadius: RADIUS.pill }]}
                  onPress={() => goTo('/(auth)/login')}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={isDay ? ['rgba(16,185,129,0.12)', 'rgba(16,185,129,0.05)'] : ['rgba(16,185,129,0.22)', 'rgba(16,185,129,0.10)']}
                    style={[styles.loginBtnInner, isMobile && { paddingHorizontal: 10, paddingVertical: 5 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="person-circle-outline" size={isMobile ? 16 : 19} color={isDay ? '#059669' : '#34d399'} />
                    <View style={styles.loginBtnTextBox}>
                      <Text style={[styles.loginBtnText, isDay ? styles.loginBtnTextDay : styles.loginBtnTextNight, isMobile && { fontSize: 11 }]}>
                        {isMobile ? 'Login' : 'Login / Register'}
                      </Text>
                      {!isMobile && (
                        <Text style={[styles.loginBtnSubText, isDay ? styles.loginBtnSubTextDay : styles.loginBtnSubTextNight]}>
                          Farmer & Partner Portal
                        </Text>
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>

        {/* Row 2 on Mobile/Tablet: Persistent Top Navigation Bar directly on top! */}
        {!isDesktop && (
          <View style={styles.mobileNavRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mobileNavScroll}
            >
              {NAV_LINKS.map((link) => {
                const active = isActive(link.path);
                return (
                  <TouchableOpacity
                    key={link.path}
                    onPress={() => goTo(link.path)}
                    activeOpacity={0.8}
                    style={[
                      styles.mobileNavPill,
                      isDay ? styles.mobileNavPillDay : styles.mobileNavPillNight,
                      active && (isDay ? { backgroundColor: link.bg, borderColor: link.color } : { backgroundColor: link.bgNight, borderColor: link.color }),
                    ]}
                  >
                    {link.image ? (
                      <Image source={link.image} style={{ width: 16, height: 16 }} resizeMode="contain" />
                    ) : (
                      <Ionicons name={link.icon as any} size={13} color={active ? link.color : isDay ? '#475569' : '#94a3b8'} />
                    )}
                    <Text
                      style={[
                        styles.mobileNavPillText,
                        isDay ? styles.mobileNavPillTextDay : styles.mobileNavPillTextNight,
                        active && { color: link.color, fontFamily: FONT.extraBold },
                      ]}
                    >
                      {link.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    marginHorizontal: 'auto',
    alignSelf: 'center',
    width: '94%',
    maxWidth: 1320,
    flexDirection: 'column',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 28,
    zIndex: 250,
    overflow: 'hidden',
  },
  headerDay: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...premiumShadow('rgba(0,0,0,0.08)', 'lg'),
  },
  headerNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...premiumShadow('rgba(0,0,0,0.45)', 'lg'),
  },
  headerMobile: {
    top: 6,
    left: 0,
    right: 0,
    marginHorizontal: 'auto',
    width: '96%',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  mobileNavRow: {
    width: '100%',
    marginTop: 5,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  mobileNavScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 10,
  },
  mobileNavPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  mobileNavPillDay: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  mobileNavPillNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  mobileNavPillText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
  },
  mobileNavPillTextDay: {
    color: '#334155',
  },
  mobileNavPillTextNight: {
    color: '#e2e8f0',
  },

  // Logo
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoImg: { width: 36, height: 36 },
  logoImgMobile: { width: 28, height: 28 },
  logoName: { fontSize: 17, fontFamily: FONT.extraBold, letterSpacing: 0.3 },
  logoNameDay: { color: '#0f172a' },
  logoNameNight: { color: '#ffffff' },
  logoTag: { fontSize: 7.5, fontFamily: FONT.bold, letterSpacing: 1, marginTop: -2 },
  logoTagDay: { color: '#059669' },
  logoTagNight: { color: '#34d399' },

  // Desktop nav
  navLinks: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navLinkWrap: { alignItems: 'center', justifyContent: 'center' },
  navLink: { fontSize: 13.5, fontFamily: FONT.semiBold, paddingHorizontal: 11, paddingVertical: 5.5, borderRadius: 8 },
  navLinkDay: { color: '#64748b' },
  navLinkNight: { color: '#94a3b8' },
  navLinkActiveDay: { color: '#3b82f6' },
  navLinkActiveNight: { color: '#60a5fa' },
  navLinkBar: { height: 2, borderRadius: 1, marginTop: 2, width: 24 },

  // Right side
  rightActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  langPickerMobile: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 4,
  },

  // Theme Toggle Switch
  themeToggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.pill,
    padding: 2,
    borderWidth: 1,
  },
  themeToggleBoxDay: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  themeToggleBoxNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  themeSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: RADIUS.pill,
  },
  themeSegmentActiveDay: {
    backgroundColor: '#ffffff',
    ...premiumShadow('#0f172a', 'xs'),
  },
  themeSegmentActiveNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    ...premiumShadow('#000000', 'xs'),
  },
  themeSegmentText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  themeSegmentTextActiveDay: {
    color: '#b45309',
  },
  themeSegmentTextActiveNight: {
    color: '#38bdf8',
  },

  // Language Picker
  langPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  langPickerDay: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    ...premiumShadow('rgba(0,0,0,0.04)', 'xs'),
  },
  langPickerNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  langOption: {
    fontSize: 11,
    fontFamily: FONT.medium,
  },
  langOptionDay: {
    color: '#64748b',
  },
  langOptionNight: {
    color: '#94a3b8',
  },
  langOptionActiveDay: {
    color: '#059669',
    fontFamily: FONT.bold,
  },
  langOptionActiveNight: {
    color: '#34d399',
    fontFamily: FONT.bold,
  },
  langDivider: {
    fontSize: 10,
  },
  langDividerDay: {
    color: '#cbd5e1',
  },
  langDividerNight: {
    color: '#475569',
  },

  // Icon Button
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDay: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  iconBtnNight: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },

  // Cart badge
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  cartBadgeText: { color: '#fff', fontSize: 9, fontFamily: FONT.extraBold },

  // Login CTA
  loginBtn: {
    borderRadius: 99,
    overflow: 'hidden',
    borderWidth: 1,
  },
  loginBtnDay: {
    borderColor: 'rgba(16,185,129,0.25)',
  },
  loginBtnNight: {
    borderColor: 'rgba(52,211,153,0.40)',
  },
  loginBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 15,
    paddingVertical: 7,
  },
  loginBtnTextBox: { flexDirection: 'column' },
  loginBtnText: { fontSize: 13, fontFamily: FONT.bold, lineHeight: 16 },
  loginBtnTextDay: { color: '#059669' },
  loginBtnTextNight: { color: '#34d399' },
  loginBtnSubText: { fontSize: 9, fontFamily: FONT.semiBold, letterSpacing: 0.3 },
  loginBtnSubTextDay: { color: '#16a34a' },
  loginBtnSubTextNight: { color: '#a7f3d0' },

  // User button (logged in)
  userBtn: {
    borderRadius: 99,
    overflow: 'hidden',
    borderWidth: 1,
    ...premiumShadow('rgba(16,185,129,0.2)', 'sm'),
  },
  userBtnDay: {
    borderColor: 'rgba(16,185,129,0.3)',
  },
  userBtnNight: {
    borderColor: 'rgba(52,211,153,0.45)',
  },
  userBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 120,
    maxWidth: 175,
  },
  userAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarInitials: { color: '#047857', fontSize: 13, fontFamily: FONT.extraBold },
  userBtnTextBox: { flex: 1, justifyContent: 'center' },
  userBtnName: { color: '#ffffff', fontSize: 12, fontFamily: FONT.bold, lineHeight: 14 },
  dashboardCueRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dashboardCueText: { color: '#a7f3d0', fontSize: 9.5, fontFamily: FONT.bold, letterSpacing: 0.3 },

  // Mobile dropdown
  mobileMenu: {
    position: 'absolute',
    top: 66,
    left: 0,
    right: 0,
    marginHorizontal: 'auto',
    alignSelf: 'center',
    width: '96%',
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    zIndex: 249,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  mobileMenuDay: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderColor: 'rgba(0,0,0,0.06)',
    ...premiumShadow('rgba(0,0,0,0.08)', 'lg'),
  },
  mobileMenuNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...premiumShadow('rgba(0,0,0,0.5)', 'lg'),
  },
  mobileUtilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  mobileItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  mobileItemBorderDay: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  mobileItemBorderNight: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  mobileItemActiveDay: { backgroundColor: 'rgba(16,185,129,0.06)', marginHorizontal: -16, paddingHorizontal: 16, borderRadius: 12 },
  mobileItemActiveNight: { backgroundColor: 'rgba(56, 189, 248, 0.12)', marginHorizontal: -16, paddingHorizontal: 16, borderRadius: 12 },
  mobileItemIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' },
  mobileItemText: { fontSize: 15, fontFamily: FONT.bold, flex: 1 },
  mobileItemTextDay: { color: '#334155' },
  mobileItemTextNight: { color: '#f1f5f9' },
});
