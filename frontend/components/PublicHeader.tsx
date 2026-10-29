import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Platform,
  Modal,
  Linking,
  Animated as RNAnimated,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/store/auth-context';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandLogo } from '@/src/components/BrandLogo';

// ── Streamlined Top Navigation: Exactly 4 Core Links ──
const MAIN_NAV_LINKS = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    icon: 'home-outline',
    image: null,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    bgNight: 'rgba(16,185,129,0.22)',
    isAction: 'home',
  },
  {
    id: 'doctors',
    label: 'Crop Doctors',
    path: '/topic/Crop-Doctors',
    icon: 'medkit-outline',
    image: require('@/assets/images/icon_cropdoctors_3d_clean.png'),
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.1)',
    bgNight: 'rgba(6,182,212,0.22)',
  },
  {
    id: 'store',
    label: 'Agri Store',
    path: '/shop',
    icon: 'storefront-outline',
    image: require('@/assets/images/icon_agristore_3d_clean.png'),
    color: '#f97316',
    bg: 'rgba(249,115,22,0.1)',
    bgNight: 'rgba(249,115,22,0.22)',
  },
  {
    id: 'helpline',
    label: 'Helpline',
    path: '#helpline',
    icon: 'call-outline',
    image: null,
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.1)',
    bgNight: 'rgba(22,163,74,0.22)',
    isAction: 'helpline',
  },
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
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktop = width > 1160;
  const isTablet = width > 768 && width <= 1160;
  const isMobile = width <= 768;
  const { user } = useAuth();

  const [helplineModalOpen, setHelplineModalOpen] = useState(false);

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

  // Animated Gliding Pill for Theme Toggle (Day / Night)
  const themeAnim = useRef(new RNAnimated.Value(isDay ? 0 : 1)).current;
  useEffect(() => {
    RNAnimated.spring(themeAnim, {
      toValue: isDay ? 0 : 1,
      tension: 100,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [isDay]);

  // Animated Gliding Pill for Language Selector [ EN | PA | HI ]
  const langAnim = useRef(new RNAnimated.Value(lang === 'EN' ? 0 : lang === 'PA' ? 1 : 2)).current;
  useEffect(() => {
    const targetIdx = lang === 'EN' ? 0 : lang === 'PA' ? 1 : 2;
    RNAnimated.spring(langAnim, {
      toValue: targetIdx,
      tension: 100,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [lang]);

  // Pulse animation on Login CTA when no user
  const pulseScale = useSharedValue(1);
  useEffect(() => {
    if (!user) {
      pulseScale.value = withRepeat(
        withSequence(withTiming(1.05, { duration: 1400 }), withTiming(1, { duration: 1400 })),
        -1,
        true
      );
    }
  }, [user]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));

  // Live pulsing beacon animation for Sticky Helpline button
  const beaconScale = useSharedValue(1);
  const beaconOpacity = useSharedValue(0.7);
  useEffect(() => {
    beaconScale.value = withRepeat(
      withSequence(withTiming(1.5, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1,
      true
    );
    beaconOpacity.value = withRepeat(
      withSequence(withTiming(0.2, { duration: 900 }), withTiming(0.85, { duration: 900 })),
      -1,
      true
    );
  }, []);
  const beaconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: beaconScale.value }],
    opacity: beaconOpacity.value,
  }));

  const isActive = (path: string) =>
    pathname === path || (path === '/' && (pathname === '/index' || pathname === ''));

  const goTo = (path: string) => {
    setMoreMenuOpen(false);
    try {
      router.push(path as any);
    } catch {
      // fallback
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      setTimeout(() => {
        if (window.location.pathname === '/' || window.location.pathname === '') {
          const target = path.startsWith('/(auth)') ? path.replace('/(auth)', '') : path;
          window.location.href = target || path;
        }
      }, 120);
    }
  };

  const goToDashboard = () => {
    setMoreMenuOpen(false);
    if (
      ['BUSINESS_PARTNER', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR', 'TECHNICAL_TRAINER'].includes(
        user?.role || ''
      )
    ) {
      router.push('/(partner)/(tabs)' as any);
    } else {
      router.push('/(user)/(tabs)' as any);
    }
  };

  const handleNavClick = (link: (typeof MAIN_NAV_LINKS)[0]) => {
    setMoreMenuOpen(false);
    if (link.isAction === 'home') {
      if (pathname === '/' || pathname === '/index' || pathname === '') {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
      goTo('/');
      return;
    }
    if (link.isAction === 'helpline') {
      setHelplineModalOpen(true);
      return;
    }
    if (link.isAction === 'mandi') {
      if (pathname === '/' || pathname === '/index' || pathname === '') {
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          const el = document.getElementById('mandi-rates') || document.querySelector('[data-mandi-rates="true"]');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
            return;
          }
        }
      }
      router.push('/#mandi-rates' as any);
      return;
    }
    goTo(link.path);
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(
      'Hello FarmsKing Expert Team, I need immediate farming and crop guidance.'
    );
    const url = `https://wa.me/919577622000?text=${text}`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const handleOpenCall = () => {
    Linking.openURL('tel:9577622000');
  };

  const [appDownloadUrl, setAppDownloadUrl] = useState<string>('https://www.farmsking.in');

  useEffect(() => {
    import('@/src/api/appSettings.api')
      .then(({ getSupportContact }) => {
        getSupportContact()
          .then((contact) => {
            if (contact?.appDownloadUrl && contact.appDownloadUrl.trim()) {
              setAppDownloadUrl(contact.appDownloadUrl.trim());
            }
          })
          .catch(() => {});
      })
      .catch(() => {});
  }, []);

  const handleDownloadApp = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(appDownloadUrl, '_blank');
    } else {
      Linking.openURL(appDownloadUrl).catch(() => {});
    }
  };

  return (
    <>
      {/* ── Main Floating Capsule Header ── */}
      <View
        style={[
          styles.header,
          isDay ? styles.headerDay : styles.headerNight,
          isMobile && styles.headerMobile,
        ]}
      >
        {Platform.OS === 'web' && (
          <BlurView
            intensity={45}
            tint={isDay ? 'light' : 'dark'}
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { borderRadius: isMobile ? 20 : 28 }]}
          />
        )}

        {/* Row 1: Logo, Streamlined Desktop Links & Right Controls */}
        <View style={[styles.topRow, isMobile && { flexWrap: 'nowrap' }]}>
          {/* Logo */}
          <TouchableOpacity style={[styles.logo, isMobile && { gap: width < 380 ? 4 : 6, flexShrink: 0 }]} onPress={() => goTo('/')} activeOpacity={0.8}>
            <BrandLogo
              size={isMobile ? 28 : 36}
              useHdQuality={true}
            />
            <View>
              <Text
                style={[
                  styles.logoName,
                  isDay ? styles.logoNameDay : styles.logoNameNight,
                  isMobile && { fontSize: width < 380 ? 14.5 : 16 },
                ]}
              >
                FarmsKing
              </Text>
              {!isMobile && (
                <Text style={[styles.logoTag, isDay ? styles.logoTagDay : styles.logoTagNight]}>
                  SMART FARMING PLATFORM
                </Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Desktop Nav: Exactly 4 Streamlined Links + "More ▾" */}
          {isDesktop && (
            <View style={styles.navLinks}>
              {MAIN_NAV_LINKS.map((link) => {
                const active = isActive(link.path);
                return (
                  <TouchableOpacity
                    key={link.id}
                    onPress={() => handleNavClick(link)}
                    activeOpacity={0.7}
                    style={styles.navLinkWrap}
                  >
                    <View
                      style={[
                        styles.navLink,
                        isDay ? styles.navLinkDay : styles.navLinkNight,
                        active && (isDay ? styles.navLinkActiveDay : styles.navLinkActiveNight),
                        active && {
                          backgroundColor: isDay ? link.bg : link.bgNight,
                        },
                        styles.navLinkInner,
                      ]}
                    >
                      {link.image ? (
                        <Image source={link.image} style={styles.navLinkIconImg} resizeMode="contain" />
                      ) : (
                        <Ionicons
                          name={link.icon as any}
                          size={14}
                          color={active ? link.color : isDay ? '#475569' : '#94a3b8'}
                        />
                      )}
                      <Text
                        style={[
                          styles.navLinkText,
                          isDay ? styles.navLinkTextDay : styles.navLinkTextNight,
                          active && { color: link.color, fontFamily: FONT.extraBold },
                        ]}
                      >
                        {link.label}
                      </Text>
                    </View>
                    {active && <View style={[styles.navLinkBar, { backgroundColor: link.color }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Right Actions: Sticky Helpline, Theme, Lang, Cart, Auth */}
          <View style={[styles.rightActions, isMobile && { gap: width < 380 ? 3 : 4, flexShrink: 0 }]}>
            {/* ── Sticky Quick Helpline: WhatsApp / Call 95776-22000 ── */}
            <TouchableOpacity
              style={[
                styles.stickyHelplineBtn,
                isDay ? styles.stickyHelplineBtnDay : styles.stickyHelplineBtnNight,
                isMobile && styles.stickyHelplineBtnMobile,
              ]}
              onPress={() => setHelplineModalOpen(true)}
              activeOpacity={0.85}
              accessibilityLabel="Farmer Quick Helpline 95776-22000"
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={[styles.stickyHelplineGradient, isMobile && { paddingHorizontal: width < 380 ? 6 : 8, paddingVertical: 4.5 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Live Pulsing Beacon */}
                <View style={styles.beaconWrap}>
                  <Animated.View style={[styles.beaconAura, beaconAnimStyle]} />
                  <View style={styles.beaconDot} />
                </View>

                {/* Dual Icons: WhatsApp & Call */}
                <View style={styles.helplineIcons}>
                  <Ionicons name="logo-whatsapp" size={isMobile ? 12 : 14} color="#ffffff" />
                  <Ionicons name="call" size={isMobile ? 11 : 12} color="#ffffff" style={{ marginLeft: 2 }} />
                </View>

                {/* Phone & Kicker */}
                {!isMobile ? (
                  <View style={styles.helplineTextBox}>
                    <Text style={styles.helplineKicker}>QUICK HELPLINE</Text>
                    <Text style={styles.helplineNumber}>95776-22000</Text>
                  </View>
                ) : (
                  width >= 360 ? (
                    <Text style={styles.helplineMobileNumber}>
                      {width < 380 ? 'Help' : width < 430 ? 'Helpline' : '95776-22000'}
                    </Text>
                  ) : null
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Day / Night Theme Toggle with Spring Gliding Pill */}
            <View
              style={[
                styles.themeToggleBox,
                isDay ? styles.themeToggleBoxDay : styles.themeToggleBoxNight,
              ]}
            >
              <RNAnimated.View
                style={[
                  styles.slidingThemePill,
                  isDay ? styles.slidingThemePillDay : styles.slidingThemePillNight,
                  {
                    left: themeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['2%', '51%'],
                    }),
                  },
                ]}
              />
              <TouchableOpacity
                style={styles.themeSegment}
                onPress={() => handleToggleTheme('day')}
                activeOpacity={0.85}
              >
                <Ionicons name="sunny" size={11} color={isDay ? '#b45309' : '#94a3b8'} />
                {!isMobile && (
                  <Text style={[styles.themeSegmentText, isDay && styles.themeSegmentTextActiveDay]}>
                    Day
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.themeSegment}
                onPress={() => handleToggleTheme('night')}
                activeOpacity={0.85}
              >
                <Ionicons name="moon" size={10.5} color={!isDay ? '#38bdf8' : '#94a3b8'} />
                {!isMobile && (
                  <Text style={[styles.themeSegmentText, !isDay && styles.themeSegmentTextActiveNight]}>
                    Night
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Language Selector with Spring Gliding Pill */}
            <View
              style={[
                styles.langPicker,
                isDay ? styles.langPickerDay : styles.langPickerNight,
                isMobile && styles.langPickerMobile,
              ]}
            >
              <RNAnimated.View
                style={[
                  styles.slidingLangPill,
                  isDay ? styles.slidingLangPillDay : styles.slidingLangPillNight,
                  {
                    left: langAnim.interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: ['2%', '35%', '68%'],
                    }),
                  },
                ]}
              />
              <TouchableOpacity style={styles.langSegment} onPress={() => handleLanguageChange('EN')} activeOpacity={0.85}>
                <Text
                  style={[
                    styles.langOption,
                    isDay ? styles.langOptionDay : styles.langOptionNight,
                    lang === 'EN' && (isDay ? styles.langOptionActiveDay : styles.langOptionActiveNight),
                  ]}
                >
                  {isMobile ? 'EN' : 'English'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.langSegment} onPress={() => handleLanguageChange('PA')} activeOpacity={0.85}>
                <Text
                  style={[
                    styles.langOption,
                    isDay ? styles.langOptionDay : styles.langOptionNight,
                    lang === 'PA' && (isDay ? styles.langOptionActiveDay : styles.langOptionActiveNight),
                  ]}
                >
                  {isMobile ? 'PA' : 'ਪੰਜਾਬੀ'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.langSegment} onPress={() => handleLanguageChange('HI')} activeOpacity={0.85}>
                <Text
                  style={[
                    styles.langOption,
                    isDay ? styles.langOptionDay : styles.langOptionNight,
                    lang === 'HI' && (isDay ? styles.langOptionActiveDay : styles.langOptionActiveNight),
                  ]}
                >
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
                <Ionicons name="cart-outline" size={17} color={isDay ? '#334155' : '#e2e8f0'} />
                {cartItemCount && cartItemCount > 0 ? (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            )}

            {/* Login / Dashboard */}
            {user ? (
              <TouchableOpacity
                style={[styles.userBtn, isDay ? styles.userBtnDay : styles.userBtnNight]}
                onPress={goToDashboard}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={isDay ? ['#059669', '#047857'] : ['#10b981', '#059669']}
                  style={styles.userBtnInner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
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
              <TouchableOpacity
                style={[
                  styles.loginBtn,
                  isDay ? styles.loginBtnDay : styles.loginBtnNight,
                  isMobile && { borderRadius: RADIUS.pill },
                  Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null,
                ]}
                onPress={() => {
                  setMoreMenuOpen(false);
                  try {
                    router.push('/(auth)/login' as any);
                  } catch (e) {
                    console.warn('Navigation error:', e);
                  }
                  if (Platform.OS === 'web' && typeof window !== 'undefined') {
                    setTimeout(() => {
                      if (window.location.pathname === '/' || window.location.pathname === '') {
                        window.location.href = '/login';
                      }
                    }, 120);
                  }
                }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={
                    isDay
                      ? ['rgba(16,185,129,0.12)', 'rgba(16,185,129,0.05)']
                      : ['rgba(16,185,129,0.22)', 'rgba(16,185,129,0.10)']
                  }
                  style={[
                    styles.loginBtnInner,
                    isMobile && { paddingHorizontal: 9, paddingVertical: 5 },
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons
                    name="person-circle-outline"
                    size={isMobile ? 15 : 18}
                    color={isDay ? '#059669' : '#34d399'}
                  />
                  <View style={styles.loginBtnTextBox}>
                    <Text
                      style={[
                        styles.loginBtnText,
                        isDay ? styles.loginBtnTextDay : styles.loginBtnTextNight,
                        isMobile && { fontSize: 11 },
                      ]}
                    >
                      {isMobile ? 'Login' : 'Login / Register'}
                    </Text>
                    {!isMobile && (
                      <Text
                        style={[
                          styles.loginBtnSubText,
                          isDay ? styles.loginBtnSubTextDay : styles.loginBtnSubTextNight,
                        ]}
                      >
                        Farmer & Partner Portal
                      </Text>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Row 2 on Mobile/Tablet: 4 Core Pills + More ▾ Pill */}
        {!isDesktop && (
          <View style={styles.mobileNavRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mobileNavScroll}
            >
              {MAIN_NAV_LINKS.map((link) => {
                const active = isActive(link.path);
                return (
                  <TouchableOpacity
                    key={link.id}
                    onPress={() => handleNavClick(link)}
                    activeOpacity={0.8}
                    style={[
                      styles.mobileNavPill,
                      isDay ? styles.mobileNavPillDay : styles.mobileNavPillNight,
                      active &&
                        (isDay
                          ? { backgroundColor: link.bg, borderColor: link.color }
                          : { backgroundColor: link.bgNight, borderColor: link.color }),
                    ]}
                  >
                    {link.image ? (
                      <Image source={link.image} style={{ width: 14, height: 14 }} resizeMode="contain" />
                    ) : (
                      <Ionicons
                        name={link.icon as any}
                        size={12}
                        color={active ? link.color : isDay ? '#475569' : '#94a3b8'}
                      />
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

      {/* ── Farmer 1-Tap Emergency Helpline Modal ── */}
      <Modal
        visible={helplineModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setHelplineModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setHelplineModalOpen(false)}
          />
          <View
            style={[
              styles.helplineModalCard,
              isDay ? styles.helplineModalCardDay : styles.helplineModalCardNight,
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <LinearGradient
                  colors={['#10b981', '#047857']}
                  style={styles.modalHeaderIconBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="headset" size={20} color="#ffffff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      style={[
                        styles.modalTitle,
                        isDay ? styles.modalTitleDay : styles.modalTitleNight,
                      ]}
                    >
                      Farmer Quick Helpline
                    </Text>
                    <View style={styles.liveTagBadge}>
                      <View style={styles.liveTagDot} />
                      <Text style={styles.liveTagText}>24x7</Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.modalSub,
                      isDay ? styles.modalSubDay : styles.modalSubNight,
                    ]}
                  >
                    Instant 1-Tap Agronomy & Emergency Desk
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setHelplineModalOpen(false)}
                style={[
                  styles.modalCloseBtn,
                  isDay ? styles.modalCloseBtnDay : styles.modalCloseBtnNight,
                ]}
              >
                <Ionicons name="close" size={17} color={isDay ? '#475569' : '#cbd5e1'} />
              </TouchableOpacity>
            </View>

            {/* Direct 1-Tap Action Cards */}
            <View style={styles.modalActionsGrid}>
              {/* Option 1: WhatsApp Support */}
              <TouchableOpacity
                style={styles.modalActionCardWhatsApp}
                activeOpacity={0.88}
                onPress={handleOpenWhatsApp}
              >
                <LinearGradient
                  colors={['#25D366', '#128C7E']}
                  style={styles.modalActionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.modalActionIconWrap}>
                    <Ionicons name="logo-whatsapp" size={26} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalActionTitle}>WhatsApp Kisan Support</Text>
                    <Text style={styles.modalActionDesc}>
                      Send photo of diseased crop, get prescription & direct chat
                    </Text>
                    <View style={styles.modalActionPill}>
                      <Text style={styles.modalActionPillText}>Chat +91 95776-22000</Text>
                      <Ionicons name="paper-plane" size={10} color="#ffffff" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Option 2: Direct Call */}
              <TouchableOpacity
                style={styles.modalActionCardCall}
                activeOpacity={0.88}
                onPress={handleOpenCall}
              >
                <LinearGradient
                  colors={['#059669', '#047857']}
                  style={styles.modalActionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.modalActionIconWrap}>
                    <Ionicons name="call" size={24} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalActionTitle}>Call Farmer Helpline</Text>
                    <Text style={styles.modalActionDesc}>
                      Speak directly with agronomists in Punjabi, Hindi or English
                    </Text>
                    <View style={styles.modalActionPill}>
                      <Text style={styles.modalActionPillText}>Dial 95776-22000</Text>
                      <Ionicons name="call" size={10} color="#ffffff" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Option 3: Official Mobile App */}
              <TouchableOpacity
                style={styles.modalActionCardApp}
                activeOpacity={0.88}
                onPress={handleDownloadApp}
              >
                <LinearGradient
                  colors={['#0284c7', '#0369a1']}
                  style={styles.modalActionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.modalActionIconWrap}>
                    <Ionicons name="phone-portrait-outline" size={24} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalActionTitle}>Official Mobile App</Text>
                    <Text style={styles.modalActionDesc}>
                      Download Android APK directly or scan QR code on homepage footer
                    </Text>
                    <View style={styles.modalActionPill}>
                      <Text style={styles.modalActionPillText}>Download APK</Text>
                      <Ionicons name="download-outline" size={10} color="#ffffff" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Support Details Info Footer */}
            <View
              style={[
                styles.modalInfoFooter,
                isDay ? styles.modalInfoFooterDay : styles.modalInfoFooterNight,
              ]}
            >
              <View style={styles.modalInfoItem}>
                <Ionicons name="time-outline" size={14} color="#10b981" />
                <Text
                  style={[
                    styles.modalInfoText,
                    isDay ? styles.modalInfoTextDay : styles.modalInfoTextNight,
                  ]}
                >
                  Daily Operating Hours: 10:00 AM – 5:00 PM IST
                </Text>
              </View>
              <View style={styles.modalInfoItem}>
                <Ionicons name="language-outline" size={14} color="#38bdf8" />
                <Text
                  style={[
                    styles.modalInfoText,
                    isDay ? styles.modalInfoTextDay : styles.modalInfoTextNight,
                  ]}
                >
                  Languages Supported: Punjabi, Hindi, English
                </Text>
              </View>
              <View style={styles.modalInfoItem}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#f59e0b" />
                <Text
                  style={[
                    styles.modalInfoText,
                    isDay ? styles.modalInfoTextDay : styles.modalInfoTextNight,
                  ]}
                >
                  100% Free Consultation for Indian Farmers
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 28,
    zIndex: 250,
    overflow: 'visible',
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

  // Mobile More Dropdown
  mobileMoreMenu: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
    gap: 4,
  },
  mobileMoreMenuDay: {},
  mobileMoreMenuNight: {},
  mobileMoreMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  mobileMoreMenuTitle: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.5,
  },
  mobileMoreMenuTitleDay: { color: '#059669' },
  mobileMoreMenuTitleNight: { color: '#34d399' },
  mobileMoreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  mobileMoreMenuItemDay: {
    backgroundColor: '#f8fafc',
  },
  mobileMoreMenuItemNight: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  mobileMoreIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileMoreLabel: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  mobileMoreLabelDay: { color: '#1e293b' },
  mobileMoreLabelNight: { color: '#f8fafc' },
  mobileMoreSub: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 1,
  },

  // Logo
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoImg: { width: 34, height: 34 },
  logoImgMobile: { width: 26, height: 26 },
  logoName: { fontSize: 16.5, fontFamily: FONT.extraBold, letterSpacing: 0.3 },
  logoNameDay: { color: '#0f172a' },
  logoNameNight: { color: '#ffffff' },
  logoTag: { fontSize: 7, fontFamily: FONT.bold, letterSpacing: 0.9, marginTop: -2 },
  logoTagDay: { color: '#059669' },
  logoTagNight: { color: '#34d399' },

  // Desktop Nav Links
  navLinks: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navLinkWrap: { alignItems: 'center', justifyContent: 'center' },
  navLink: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  navLinkInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  navLinkIconImg: {
    width: 15,
    height: 15,
  },
  navLinkText: {
    fontSize: 13,
    fontFamily: FONT.semiBold,
  },
  navLinkTextDay: { color: '#64748b' },
  navLinkTextNight: { color: '#94a3b8' },
  navLinkDay: {},
  navLinkNight: {},
  navLinkActiveDay: {},
  navLinkActiveNight: {},
  navLinkBar: { height: 2, borderRadius: 1, marginTop: 2, width: 22 },

  // More Dropdown Wrapper
  moreBtnWrapper: {
    position: 'relative',
    zIndex: 300,
  },
  moreBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moreDropdownCard: {
    position: 'absolute',
    top: 36,
    right: 0,
    width: 310,
    borderRadius: 16,
    padding: 10,
    zIndex: 350,
  },
  moreDropdownCardDay: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...premiumShadow('rgba(0,0,0,0.12)', 'lg'),
  },
  moreDropdownCardNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...premiumShadow('rgba(0,0,0,0.6)', 'lg'),
  },
  moreDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 6,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  moreDropdownHeaderTitle: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.8,
  },
  moreDropdownHeaderTitleDay: { color: '#059669' },
  moreDropdownHeaderTitleNight: { color: '#34d399' },
  moreDropdownGrid: { gap: 3 },
  moreDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 8,
  },
  moreDropdownItemDay: {
    backgroundColor: 'transparent',
  },
  moreDropdownItemNight: {
    backgroundColor: 'transparent',
  },
  moreDropdownItemIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreDropdownItemLabel: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  moreDropdownItemLabelDay: { color: '#0f172a' },
  moreDropdownItemLabelNight: { color: '#f8fafc' },
  moreDropdownItemSub: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 1,
  },

  // Right side
  rightActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  // Sticky Quick Helpline Button
  stickyHelplineBtn: {
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    ...premiumShadow('rgba(16,185,129,0.3)', 'sm'),
  },
  stickyHelplineBtnDay: {
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
  },
  stickyHelplineBtnNight: {
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  stickyHelplineBtnMobile: {
    borderRadius: RADIUS.pill,
  },
  stickyHelplineGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5.5,
  },
  beaconWrap: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  beaconAura: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#a7f3d0',
  },
  beaconDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ffffff',
  },
  helplineIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  helplineTextBox: {
    flexDirection: 'column',
  },
  helplineKicker: {
    color: '#d1fae5',
    fontSize: 7.5,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.5,
    lineHeight: 9,
  },
  helplineNumber: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.3,
    lineHeight: 13,
  },
  helplineMobileNumber: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.2,
  },

  // Theme Toggle Switch
  themeToggleBox: {
    position: 'relative',
    overflow: 'hidden',
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
  slidingThemePill: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    width: '47%',
    borderRadius: RADIUS.pill,
    zIndex: 0,
  },
  slidingThemePillDay: {
    backgroundColor: '#ffffff',
    ...premiumShadow('#0f172a', 'xs'),
  },
  slidingThemePillNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    ...premiumShadow('#000000', 'xs'),
  },
  themeSegment: {
    position: 'relative',
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
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
    fontSize: 10,
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
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 2,
    paddingVertical: 2,
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
  langPickerMobile: {
    paddingHorizontal: 2,
    paddingVertical: 2,
    gap: 1,
  },
  slidingLangPill: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    width: '30%',
    borderRadius: RADIUS.pill,
    zIndex: 0,
  },
  slidingLangPillDay: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    ...premiumShadow('rgba(16,185,129,0.15)', 'xs'),
  },
  slidingLangPillNight: {
    backgroundColor: 'rgba(16,185,129,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.45)',
  },
  langSegment: {
    position: 'relative',
    zIndex: 1,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langOption: {
    fontSize: 10.5,
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
    fontSize: 9.5,
  },
  langDividerDay: {
    color: '#cbd5e1',
  },
  langDividerNight: {
    color: '#475569',
  },

  // Icon Button
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
  cartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  cartBadgeText: { color: '#fff', fontSize: 8.5, fontFamily: FONT.extraBold },

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
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5.5,
  },
  loginBtnTextBox: { flexDirection: 'column' },
  loginBtnText: { fontSize: 12, fontFamily: FONT.bold, lineHeight: 15 },
  loginBtnTextDay: { color: '#059669' },
  loginBtnTextNight: { color: '#34d399' },
  loginBtnSubText: { fontSize: 8.5, fontFamily: FONT.semiBold, letterSpacing: 0.3 },
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
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 110,
    maxWidth: 165,
  },
  userAvatarCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarInitials: { color: '#047857', fontSize: 12, fontFamily: FONT.extraBold },
  userBtnTextBox: { flex: 1, justifyContent: 'center' },
  userBtnName: { color: '#ffffff', fontSize: 11.5, fontFamily: FONT.bold, lineHeight: 13 },
  dashboardCueRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dashboardCueText: { color: '#a7f3d0', fontSize: 9, fontFamily: FONT.bold, letterSpacing: 0.3 },

  // ── Farmer Helpline Modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 9999,
  },
  helplineModalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 22,
    padding: 20,
    zIndex: 10000,
  },
  helplineModalCardDay: {
    backgroundColor: '#ffffff',
    ...premiumShadow('rgba(0,0,0,0.2)', 'xl'),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  helplineModalCardNight: {
    backgroundColor: '#0f172a',
    ...premiumShadow('rgba(0,0,0,0.7)', 'xl'),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalHeaderIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: FONT.extraBold,
  },
  modalTitleDay: { color: '#0f172a' },
  modalTitleNight: { color: '#f8fafc' },
  liveTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
  },
  liveTagDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10b981',
  },
  liveTagText: {
    color: '#059669',
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.5,
  },
  modalSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    marginTop: 2,
  },
  modalSubDay: { color: '#64748b' },
  modalSubNight: { color: '#94a3b8' },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnDay: { backgroundColor: '#f1f5f9' },
  modalCloseBtnNight: { backgroundColor: 'rgba(255,255,255,0.08)' },
  modalActionsGrid: {
    gap: 10,
    marginBottom: 14,
  },
  modalActionCardWhatsApp: {
    borderRadius: 15,
    overflow: 'hidden',
    ...premiumShadow('rgba(37,211,102,0.25)', 'md'),
  },
  modalActionCardCall: {
    borderRadius: 15,
    overflow: 'hidden',
    ...premiumShadow('rgba(5,150,105,0.25)', 'md'),
  },
  modalActionCardApp: {
    borderRadius: 15,
    overflow: 'hidden',
    ...premiumShadow('rgba(2,132,199,0.25)', 'md'),
  },
  modalActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
  },
  modalActionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionTitle: {
    fontSize: 14.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  modalActionDesc: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 2,
    lineHeight: 14,
  },
  modalActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    marginTop: 5,
  },
  modalActionPillText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.3,
  },
  modalInfoFooter: {
    borderRadius: 12,
    padding: 9,
    gap: 5,
    borderWidth: 1,
  },
  modalInfoFooterDay: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  modalInfoFooterNight: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalInfoText: {
    fontSize: 10.5,
    fontFamily: FONT.semiBold,
  },
  modalInfoTextDay: { color: '#475569' },
  modalInfoTextNight: { color: '#cbd5e1' },
});
