import { Tabs, useRouter, usePathname, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, StyleSheet, Text, TouchableOpacity, useWindowDimensions, ScrollView, Animated, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { AnimatedPurpleBottomBar } from '@/components/ui/AnimatedPurpleBottomBar';
import { RoleThemes, UserRole } from '@/constants/Colors';
import { FONT, RADIUS, THEME_4D, neonGlow, premiumShadow } from '@/constants/theme';
import { useRole } from '@/src/store/role-context';
import { useAuth } from '@/src/store/auth-context';
import { useLanguage } from '@/src/store/language-context';
import { useMyAdvisor } from '@/src/hooks/useAdvisorAssignments';
import { useFarmerProfileStatus } from '@/src/hooks/useFarmerProfile';
import { useChatUnreadCount, useGlobalChatUnreadSync } from '@/src/hooks/useChat';
import { TranslationKey } from '@/src/constants/translations';
import { useCart } from '@/src/store/cart-context';
import { BrandLogo } from '@/src/components/BrandLogo';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { FloatingAgriAiChatbot } from '@/src/components/FloatingAgriAiChatbot';
import { GlobalCommandSearchModal } from '@/components/GlobalCommandSearchModal';
import { AdminLiveToastNotification } from '@/components/AdminLiveToastNotification';
import { AdminHealthRadarModal } from '@/components/AdminHealthRadarModal';
import { AdminImpersonationBanner, ImpersonationTarget } from '@/components/AdminImpersonationBanner';
import { MobilePillarsMenuModal } from '@/components/MobilePillarsMenuModal';
import { ADMIN_PILLARS, detectPillarFromRoute, NavigationPillar, SubTabItem } from '@/constants/navigationPillars';

import { Ionicons } from '@expo/vector-icons';
import { PortalGuard } from '@/src/portals/PortalGuard';
import { UniversalCommandPalette } from '@/src/portals/UniversalCommandPalette';

const theme = RoleThemes.FARMER;

const CHAT_CAPABLE_ROLES = new Set(['FARMER', 'GARDENER', 'ADVISOR', 'ADMIN', 'SUPER_ADMIN']);

/** Small red dot overlaid on a tab icon when there's an unread chat message. */
function TabIconWithUnreadDot({ children, showDot }: { children: React.ReactNode; showDot: boolean }) {
  return (
    <View>
      {children}
      {showDot ? <View style={badgeStyles.dot} /> : null}
    </View>
  );
}

/** Cart item-count badge overlaid on the cart tab icon. */
function TabIconWithCartCount({ children, count }: { children: React.ReactNode; count: number }) {
  return (
    <View>
      {children}
      {count > 0 ? (
        <View style={badgeStyles.countBadge}>
          <Text style={badgeStyles.countBadgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      ) : null}
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  dot: {
    position: 'absolute',
    top: -1,
    right: -3,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#fb7185',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  countBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    paddingHorizontal: 2,
    backgroundColor: '#fb7185',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: FONT.bold,
    lineHeight: 11,
  },
});

type TabName =
  | 'index' | 'shop' | 'admin_shop' | 'farm' | 'records' | 'market' | 'more' | 'admin_more'
  | 'categories' | 'cart' | 'orders'
  | 'farmers' | 'schedule' | 'chat'
  | 'referrals' | 'wallet'
  | 'admin-orders' | 'admin-products'
  | 'super-users' | 'super-coupons' | 'super-accounts' | 'cpanel' | 'super-settings'
  | 'super-orders' | 'super-audit-log' | 'super-crop-edit'
  | 'operator-orders' | 'trainer-dashboard' | 'garden';

const ROLE_TABS: Record<string, { tabs: TabName[] }> = {
  SUPER_ADMIN: { tabs: ['index', 'admin-products', 'super-users', 'super-accounts', 'admin_more'] },
  ADMIN: { tabs: ['index', 'admin-products', 'super-users', 'super-accounts', 'admin_more'] },
  OPERATOR: { tabs: ['index', 'operator-orders', 'admin_more'] },
  TECHNICAL_TRAINER: { tabs: ['index', 'super-users', 'admin_more'] },
  MARKET_MANAGER: { tabs: ['index', 'super-coupons', 'super-accounts', 'admin_more'] },
};

const TAB_META: Record<Exclude<TabName, 'index' | 'more' | 'admin_more'>, { key: TranslationKey; title: string; icon: keyof typeof Ionicons.glyphMap; iconFilled: keyof typeof Ionicons.glyphMap }> = {
  shop: { key: 'tabCustomerHome', title: 'Store', icon: 'bag-outline', iconFilled: 'bag' },
  admin_shop: { key: 'agristoreHub' as any, title: 'E-Commerce', icon: 'storefront-outline', iconFilled: 'storefront' },
  farm: { key: 'tabCrops', title: 'Crops', icon: 'leaf-outline', iconFilled: 'leaf' },
  records: { key: 'tabRecords', title: 'Accounts', icon: 'document-text-outline', iconFilled: 'document-text' },
  market: { key: 'tabMyAdvisor', title: 'Crop Doctor', icon: 'school-outline', iconFilled: 'school' },
  categories: { key: 'tabCategories', title: 'Categories', icon: 'grid-outline', iconFilled: 'grid' },
  cart: { key: 'tabCart', title: 'Cart', icon: 'cart-outline', iconFilled: 'cart' },
  orders: { key: 'tabOrders', title: 'Orders', icon: 'receipt-outline', iconFilled: 'receipt' },
  farmers: { key: 'tabFarms', title: 'Farms', icon: 'leaf-outline', iconFilled: 'leaf' },
  schedule: { key: 'tabSchedule', title: 'Schedule', icon: 'calendar-outline', iconFilled: 'calendar' },
  chat: { key: 'tabChat', title: 'Chat', icon: 'chatbubble-outline', iconFilled: 'chatbubble' },
  referrals: { key: 'tabReferrals', title: 'Referrals', icon: 'people-outline', iconFilled: 'people' },
  wallet: { key: 'tabMyBusiness', title: 'Wallet', icon: 'wallet-outline', iconFilled: 'wallet' },
  'admin-orders': { key: 'tabOrders', title: 'Orders', icon: 'receipt-outline', iconFilled: 'receipt' },
  'admin-products': { key: 'tabMarket' as any, title: 'Market', icon: 'storefront-outline', iconFilled: 'storefront' },
  'super-users': { key: 'tabUsers', title: 'Users', icon: 'people-outline', iconFilled: 'people' },
  'super-coupons': { key: 'tabCoupons', title: 'Coupons', icon: 'ticket-outline', iconFilled: 'ticket' },
  'super-accounts': { key: 'tabAccounts', title: 'Finance', icon: 'cash-outline', iconFilled: 'cash' },
  cpanel: { key: 'tabFeatures', title: 'C-Panel', icon: 'options-outline', iconFilled: 'options' },
  'super-settings': { key: 'tabSettings' as any, title: 'Settings', icon: 'settings-outline', iconFilled: 'settings' },
  'super-orders': { key: 'superSaleManagement', title: 'Sale / Order Management', icon: 'receipt-outline', iconFilled: 'receipt' },
  'super-audit-log': { key: 'superAuditLog', title: 'Audit Log', icon: 'time-outline', iconFilled: 'time' },
  'super-crop-edit': { key: 'tabCrops', title: 'Edit Crop', icon: 'leaf-outline', iconFilled: 'leaf' },
  'operator-orders': { key: 'tabFulfillment', title: 'Fulfillment', icon: 'cube-outline', iconFilled: 'cube' },
  'trainer-dashboard': { key: 'tabFarms', title: 'Trainer', icon: 'school-outline', iconFilled: 'school' },
  garden: { key: 'tabFarms', title: 'Garden Care', icon: 'flower-outline', iconFilled: 'flower' },
};

const ALL_TABS: TabName[] = [
  'index', 'shop', 'admin_shop', 'farm', 'records', 'market',
  'categories', 'cart', 'orders',
  'farmers', 'schedule', 'chat',
  'referrals', 'wallet',
  'admin-orders', 'admin-products',
  'super-users', 'super-coupons', 'super-accounts', 'cpanel', 'super-settings',
  'super-orders', 'super-audit-log', 'super-crop-edit',
  'operator-orders', 'trainer-dashboard', 'garden',
  'more', 'admin_more',
];

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const localParams = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768; // Desktop breakpoint

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHealthRadarOpen, setIsHealthRadarOpen] = useState(false);
  const [isPillarsMenuOpen, setIsPillarsMenuOpen] = useState(false);
  const [impersonationTarget, setImpersonationTarget] = useState<ImpersonationTarget | null>(null);
  const [selectedPillarId, setSelectedPillarId] = useState<string>(() =>
    detectPillarFromRoute(pathname, localParams)
  );

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const tabLayouts = useRef<{ [key: string]: { x: number; width: number } }>({});
  const slideAnim = useRef(new Animated.Value(0)).current;
  const widthAnim = useRef(new Animated.Value(0)).current;
  const trailAnim = useRef(new Animated.Value(0)).current;

  const triggerTabsAnimation = () => {
    fadeAnim.setValue(0.35);
    Animated.spring(fadeAnim, {
      toValue: 1,
      friction: 6,
      tension: 70,
      useNativeDriver: true,
    }).start();
  };

  // Keep active pillar synchronized with URL changes (Deep-linking & Back/Forward browser navigation)
  useEffect(() => {
    const matchingPillar = detectPillarFromRoute(pathname, localParams, selectedPillarId);
    if (matchingPillar && matchingPillar !== selectedPillarId) {
      setSelectedPillarId(matchingPillar);
      triggerTabsAnimation();
    }
  }, [pathname, localParams]);

  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true);
    const handleOpenHealthRadar = () => setIsHealthRadarOpen(true);
    const handleOpenPillarsMenu = () => setIsPillarsMenuOpen(true);
    const handleStartImpersonation = (e: any) => {
      if (e.detail) {
        setImpersonationTarget(e.detail);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('open-command-search', handleOpenSearch);
      window.addEventListener('admin-open-health-radar', handleOpenHealthRadar);
      window.addEventListener('admin-open-pillars-menu', handleOpenPillarsMenu);
      window.addEventListener('admin-start-impersonation', handleStartImpersonation);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('open-command-search', handleOpenSearch);
        window.removeEventListener('admin-open-health-radar', handleOpenHealthRadar);
        window.removeEventListener('admin-open-pillars-menu', handleOpenPillarsMenu);
        window.removeEventListener('admin-start-impersonation', handleStartImpersonation);
      }
    };
  }, []);

  const { role } = useRole();
  const { t, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const { colors, themeMode, setThemeMode } = useExecutiveTheme();
  const config = ROLE_TABS[role] || ROLE_TABS.OPERATOR;
  const visible = new Set(config ? config.tabs : ['index', 'admin_more']);

  const isChatCapable = !!user && CHAT_CAPABLE_ROLES.has(user.role);
  useGlobalChatUnreadSync(isChatCapable);
  const { data: chatUnreadData } = useChatUnreadCount(isChatCapable);
  const hasUnreadChat = (chatUnreadData?.count ?? 0) > 0;
  const { itemCount: cartItemCount } = useCart();

  const getHomeTitle = (userRole: UserRole): string => {
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') return 'Overview';
    return t('tabHome', 'Home');
  };

  const getTabTitle = (name: TabName): string => {
    if (name === 'index') return getHomeTitle(role);
    if (name === 'more' || name === 'admin_more') return t('tabMore', 'More');
    if (name === 'farmers') return role === 'GARDEN_ADVISOR' ? t('tabGardens', 'Gardens') : t('tabFarmers', 'Farmers');
    if ((name === 'shop' || name === 'admin_shop') && (role === 'ADMIN' || role === 'SUPER_ADMIN')) return 'E-Commerce';
    if (name === 'admin-products') return 'Market';
    const meta = TAB_META[name as Exclude<TabName, 'index' | 'more' | 'admin_more'>];
    return meta ? t(meta.key, meta.title) : name;
  };

  const getTabIcon = (name: TabName, focused: boolean): keyof typeof Ionicons.glyphMap => {
    if (name === 'index') {
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') return focused ? 'analytics' : 'analytics-outline';
      return focused ? 'home' : 'home-outline';
    }
    if (name === 'more' || name === 'admin_more') return focused ? 'grid' : 'grid-outline';
    if (name === 'farmers') return focused ? 'leaf' : 'leaf-outline';
    if (name === 'admin-products') return focused ? 'storefront' : 'storefront-outline';
    const meta = TAB_META[name as Exclude<TabName, 'index' | 'more' | 'admin_more'>];
    return meta ? (focused ? meta.iconFilled : meta.icon) : 'square-outline';
  };

  const handleNavigate = (tabName: TabName) => {
    if (tabName === 'index') {
      router.push('/admin/(tabs)' as any);
    } else {
      router.push(`/admin/(tabs)/${tabName}` as any);
    }
  };

  const activePillar = ADMIN_PILLARS.find((p) => p.id === selectedPillarId) || ADMIN_PILLARS[0];

  const activeSubTab = activePillar.subTabs.find((tab) => {
    const isIndexActive = tab.path === '/admin/(tabs)' && (pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index');
    const isOtherActive = tab.path !== '/admin/(tabs)' && pathname.includes(tab.path.split('/').pop() || '');
    const currentFilter = localParams?.filter || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('filter') : undefined);
    const isFilterMatch = !tab.params?.filter || (currentFilter === tab.params.filter);
    return (isIndexActive || isOtherActive) && isFilterMatch;
  }) || activePillar.subTabs[0];

  useEffect(() => {
    if (activeSubTab && tabLayouts.current[activeSubTab.id]) {
      const { x, width: w } = tabLayouts.current[activeSubTab.id];
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: x,
          tension: 75,
          friction: 9,
          useNativeDriver: false,
        }),
        Animated.spring(widthAnim, {
          toValue: w,
          tension: 75,
          friction: 9,
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.timing(trailAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: false,
          }),
          Animated.timing(trailAnim, {
            toValue: 0,
            duration: 450,
            useNativeDriver: false,
          }),
        ]),
      ]).start();
    }
  }, [activeSubTab?.id, selectedPillarId, pathname, localParams]);

  const handleTabLayout = (tabId: string, layout: { x: number; width: number }) => {
    tabLayouts.current[tabId] = layout;
    if (activeSubTab?.id === tabId) {
      slideAnim.setValue(layout.x);
      widthAnim.setValue(layout.width);
    }
  };

  const handleSelectPillar = (pillar: NavigationPillar) => {
    setSelectedPillarId(pillar.id);
    triggerTabsAnimation();

    if (pillar.subTabs && pillar.subTabs.length > 0) {
      const firstTab = pillar.subTabs[0];
      const isAlreadyOnFirstTab =
        (firstTab.path === pathname || (firstTab.path === '/admin/(tabs)' && (pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index'))) &&
        (!firstTab.params?.filter || localParams?.filter === firstTab.params.filter);

      if (!isAlreadyOnFirstTab) {
        if (firstTab.params) {
          router.setParams(firstTab.params);
          const queryString = new URLSearchParams(firstTab.params as Record<string, string>).toString();
          router.push(`${firstTab.path}?${queryString}` as any);
        } else {
          router.push(firstTab.path as any);
        }
      }
    }
  };

  const handleSelectSubTab = (tab: SubTabItem) => {
    if (tab.params) {
      router.setParams(tab.params);
      const queryString = new URLSearchParams(tab.params as Record<string, string>).toString();
      router.push(`${tab.path}?${queryString}` as any);
    } else {
      router.push(tab.path as any);
    }
  };

  const isLight = themeMode === 'LIGHT';
  const isDarkTheme = themeMode === 'DARK';

  return (
    <PortalGuard portalId="ADMIN_HQ">
      <View style={[layoutStyles.rootContainer, { backgroundColor: colors.bg, flexDirection: isDesktop ? 'row' : 'column' }]}>
      {/* 💻 DESKTOP 2-TIER EXECUTIVE SIDEBAR (Visible on screens >= 768px) */}
      {isDesktop && (
        <View
          style={[
            desktopStyles.sidebar,
            {
              backgroundColor: isLight ? '#ffffff' : isDarkTheme ? '#0b1329' : '#020b06',
              borderRightColor: isLight ? 'rgba(22, 163, 74, 0.18)' : isDarkTheme ? 'rgba(56, 189, 248, 0.2)' : 'rgba(0, 255, 135, 0.18)',
              shadowColor: colors.shadowColor,
            },
          ]}
        >
          {/* Brand Logo & Platform Title */}
          <View style={desktopStyles.brandLogoBox}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: isLight ? '#16a34a' : isDarkTheme ? '#38bdf8' : '#00ff87',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: colors.shadowColor,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
              }}
            >
              <BrandLogo size={22} iconColor={isLight ? '#ffffff' : isDarkTheme ? '#020617' : '#020d06'} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[desktopStyles.brandTitle, isLight && { color: '#0f172a' }]}>
                FarmsKing{' '}
                <Text
                  style={[
                    desktopStyles.brandBadgeText,
                    isLight && {
                      color: '#16a34a',
                      backgroundColor: 'rgba(22, 163, 74, 0.12)',
                      borderColor: 'rgba(234, 179, 8, 0.4)',
                    },
                    isDarkTheme && {
                      color: '#38bdf8',
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      borderColor: 'rgba(56, 189, 248, 0.4)',
                    },
                  ]}
                >
                  4D
                </Text>
              </Text>
              <Text
                style={[
                  desktopStyles.brandSubtitle,
                  isLight && { color: '#d97706' },
                  isDarkTheme && { color: '#94a3b8' },
                ]}
              >
                Executive Hub
              </Text>
            </View>
          </View>

          {/* Section Heading */}
          <Text
            style={[
              desktopStyles.sidebarSectionTitle,
              isLight && { color: '#16a34a' },
              isDarkTheme && { color: '#38bdf8' },
            ]}
          >
            COMMAND HUBS
          </Text>

          {/* Navigation Pillars List (Effective Prominent Buttons) */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={desktopStyles.menuNavCol}>
            {(() => {
              if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
                return (
                  <>
                    {ADMIN_PILLARS.map((pillar) => {
                  const isActive = selectedPillarId === pillar.id;
                  return (
                    <Pressable
                      key={pillar.id}
                      onPress={() => handleSelectPillar(pillar)}
                      style={({ hovered, pressed }: any) => [
                        desktopStyles.pillarCard,
                        isLight && {
                          backgroundColor: '#f8fafc',
                          borderColor: 'rgba(22, 163, 74, 0.12)',
                        },
                        isDarkTheme && {
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          borderColor: 'rgba(56, 189, 248, 0.15)',
                        },
                        isActive && (
                          isLight
                            ? {
                                backgroundColor: '#f0fdf4',
                                borderColor: '#16a34a',
                                shadowColor: '#16a34a',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.15,
                                shadowRadius: 8,
                                elevation: 3,
                              }
                            : isDarkTheme
                            ? {
                                backgroundColor: 'rgba(56, 189, 248, 0.16)',
                                borderColor: '#38bdf8',
                                shadowColor: '#38bdf8',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.25,
                                shadowRadius: 10,
                                elevation: 3,
                              }
                            : desktopStyles.pillarCardActive
                        ),
                        hovered && !isActive && (
                          isLight
                            ? { backgroundColor: '#f1f5f9', borderColor: 'rgba(22, 163, 74, 0.3)' }
                            : desktopStyles.pillarCardHover
                        ),
                        pressed && { transform: [{ scale: 0.98 }] },
                      ]}
                    >
                      {/* Active Left Indicator Bar */}
                      {isActive && (
                        <View
                          style={[
                            desktopStyles.pillarActiveBar,
                            isLight && { backgroundColor: '#16a34a' },
                            isDarkTheme && { backgroundColor: '#38bdf8' },
                          ]}
                        />
                      )}

                      <View
                        style={[
                          desktopStyles.pillarIconWrap,
                          isActive && desktopStyles.pillarIconWrapActive,
                          isLight && !isActive && {
                            backgroundColor: 'rgba(22, 163, 74, 0.08)',
                            borderColor: 'rgba(22, 163, 74, 0.15)',
                          },
                          isLight && isActive && {
                            backgroundColor: '#16a34a',
                            borderColor: '#16a34a',
                          },
                          isDarkTheme && isActive && {
                            backgroundColor: '#38bdf8',
                            borderColor: '#38bdf8',
                          },
                        ]}
                      >
                        <Ionicons
                          name={isActive ? pillar.iconFilled : pillar.icon}
                          size={18}
                          color={
                            isActive
                              ? (isLight ? '#ffffff' : isDarkTheme ? '#020617' : '#ffffff')
                              : (pillar.color || (isLight ? '#16a34a' : '#059669'))
                          }
                        />
                      </View>

                      <View style={desktopStyles.pillarContentCol}>
                        <Text
                          style={[
                            desktopStyles.pillarTitle,
                            isLight && { color: '#334155' },
                            isActive && desktopStyles.pillarTitleActive,
                            isLight && isActive && { color: '#16a34a' },
                            isDarkTheme && isActive && { color: '#38bdf8' },
                          ]}
                          numberOfLines={1}
                        >
                          {pillar.title}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <View
                            style={[
                              desktopStyles.pillarBadge,
                              isLight && {
                                backgroundColor: 'rgba(22, 163, 74, 0.08)',
                                borderColor: 'rgba(234, 179, 8, 0.25)',
                              },
                              isActive && desktopStyles.pillarBadgeActive,
                              isLight && isActive && {
                                backgroundColor: 'rgba(22, 163, 74, 0.15)',
                                borderColor: 'rgba(234, 179, 8, 0.5)',
                              },
                              isDarkTheme && isActive && {
                                backgroundColor: 'rgba(56, 189, 248, 0.25)',
                                borderColor: '#38bdf8',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                desktopStyles.pillarBadgeText,
                                isLight && { color: '#64748b' },
                                isActive && desktopStyles.pillarBadgeTextActive,
                                isLight && isActive && { color: '#16a34a' },
                                isDarkTheme && isActive && { color: '#38bdf8' },
                              ]}
                            >
                              {pillar.badge}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Ionicons
                        name={isActive ? 'chevron-forward' : 'chevron-forward-outline'}
                        size={15}
                        color={isActive ? (isLight ? '#16a34a' : isDarkTheme ? '#38bdf8' : '#10b981') : (isLight ? '#94a3b8' : '#64748b')}
                      />
                    </Pressable>
                  );
                })}
              </>
            );
          }

              // Default standard tabs mapping for non-admin roles
              return config.tabs.map((tabName) => {
                const isIndexActive = tabName === 'index' && (pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index');
                const isOtherActive = tabName !== 'index' && pathname.includes(tabName);
                const isActive = isIndexActive || isOtherActive;
                const title = getTabTitle(tabName);
                const iconName = getTabIcon(tabName, isActive);

                return (
                  <TouchableOpacity
                    key={tabName}
                    style={[
                      desktopStyles.navMenuItem,
                      isLight && {
                        backgroundColor: '#f8fafc',
                        borderColor: 'rgba(22, 163, 74, 0.12)',
                      },
                      isDarkTheme && {
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        borderColor: 'rgba(56, 189, 248, 0.15)',
                      },
                      isActive && (
                        isLight
                          ? { backgroundColor: '#f0fdf4', borderColor: '#16a34a' }
                          : isDarkTheme
                          ? { backgroundColor: 'rgba(56, 189, 248, 0.16)', borderColor: '#38bdf8' }
                          : desktopStyles.navMenuItemActive
                      ),
                    ]}
                    onPress={() => handleNavigate(tabName)}
                  >
                    <View
                      style={[
                        desktopStyles.navIconWrap,
                        isActive && desktopStyles.navIconWrapActive,
                        isLight && isActive && { backgroundColor: '#16a34a', borderColor: '#16a34a' },
                        isDarkTheme && isActive && { backgroundColor: '#38bdf8', borderColor: '#38bdf8' },
                      ]}
                    >
                      <Ionicons
                        name={iconName}
                        size={18}
                        color={isActive ? '#ffffff' : (isLight ? '#64748b' : '#64748b')}
                      />
                    </View>
                    <Text
                      style={[
                        desktopStyles.navMenuItemText,
                        isLight && { color: '#334155' },
                        isActive && desktopStyles.navMenuItemTextActive,
                        isLight && isActive && { color: '#16a34a' },
                        isDarkTheme && isActive && { color: '#38bdf8' },
                      ]}
                    >
                      {title}
                    </Text>
                  </TouchableOpacity>
                );
              });
            })()}
          </ScrollView>

          {/* Bottom Actions in Sidebar */}
          <View
            style={[
              desktopStyles.sidebarBottom,
              isLight && { borderTopColor: 'rgba(22, 163, 74, 0.15)' },
              isDarkTheme && { borderTopColor: 'rgba(56, 189, 248, 0.15)' },
            ]}
          >
            {(() => {
              const isSellerRole = (role as string) === 'SELLER' || (user?.role as string) === 'SELLER' || Boolean((user as any)?.isSeller);
              if (!isSellerRole) return null;
              return (
                <TouchableOpacity
                  style={[
                    desktopStyles.headerActionBtn,
                    { marginBottom: 12 },
                    isLight && {
                      backgroundColor: '#f0fdf4',
                      borderColor: 'rgba(22, 163, 74, 0.3)',
                    },
                    isDarkTheme && {
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      borderColor: 'rgba(56, 189, 248, 0.3)',
                    },
                  ]}
                  onPress={() => router.push('/seller-dashboard')}
                >
                  <Ionicons name="storefront-outline" size={16} color={isDarkTheme ? '#38bdf8' : '#16a34a'} />
                  <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: isDarkTheme ? '#38bdf8' : '#16a34a' }}>
                    🏪 Seller Hub
                  </Text>
                </TouchableOpacity>
              );
            })()}



            {/* 🎨 2-WAY THEME SELECTOR: Light (Default) · Dark (Parrot & Gold) */}
            <View
              style={[
                desktopStyles.themeSwitcherBox,
                isLight && desktopStyles.themeSwitcherBoxLight,
                isDarkTheme && desktopStyles.themeSwitcherBoxDark,
              ]}
            >
              <TouchableOpacity
                style={[
                  desktopStyles.themeBtn,
                  themeMode === 'LIGHT' && desktopStyles.themeBtnActiveLight,
                ]}
                onPress={() => setThemeMode('LIGHT')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={themeMode === 'LIGHT' ? 'sunny' : 'sunny-outline'}
                  size={12}
                  color={themeMode === 'LIGHT' ? '#16a34a' : isLight ? '#64748b' : '#94a3b8'}
                />
                <Text
                  style={[
                    desktopStyles.themeBtnText,
                    isLight && { color: '#64748b' },
                    themeMode === 'LIGHT' && desktopStyles.themeBtnTextActiveLight,
                  ]}
                >
                  Light
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  desktopStyles.themeBtn,
                  themeMode === 'DARK' && desktopStyles.themeBtnActiveMedium,
                ]}
                onPress={() => setThemeMode('DARK')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={themeMode === 'DARK' ? 'leaf' : 'leaf-outline'}
                  size={12}
                  color={themeMode === 'DARK' ? '#22c55e' : isLight ? '#64748b' : '#94a3b8'}
                />
                <Text
                  style={[
                    desktopStyles.themeBtnText,
                    isLight && { color: '#64748b' },
                    themeMode === 'DARK' && desktopStyles.themeBtnTextActiveMedium,
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={[
        {
          flex: 1,
          backgroundColor: colors.bg,
          overflow: 'hidden' as any,
          width: '100%',
          height: '100%',
          ...(Platform.OS === 'web' ? { height: '100dvh' as any, maxHeight: '100dvh' as any } : {}),
        },
      ]}>
        {/* 📱 DEDICATED MOBILE EXECUTIVE APP HEADER (Visible on Mobile < 768px) */}
        {!isDesktop && (
          <View
            style={[
              mobileStyles.mobileTopBar,
              {
                backgroundColor: isLight ? '#ffffff' : isDarkTheme ? '#0b1329' : '#020b06',
                borderBottomColor: isLight ? 'rgba(22, 163, 74, 0.18)' : isDarkTheme ? 'rgba(56, 189, 248, 0.2)' : 'rgba(0, 255, 135, 0.18)',
                shadowColor: colors.shadowColor,
              },
            ]}
          >
            {/* Left: FarmsKing Logo + Title */}
            <TouchableOpacity
              style={mobileStyles.brandBox}
              onPress={() => router.push('/admin/(tabs)')}
              activeOpacity={0.8}
            >
              <View
                style={[
                  mobileStyles.logoSquircle,
                  {
                    backgroundColor: isLight ? '#16a34a' : isDarkTheme ? '#38bdf8' : '#00ff87',
                  },
                ]}
              >
                <BrandLogo size={18} iconColor={isLight ? '#ffffff' : isDarkTheme ? '#020617' : '#020d06'} />
              </View>
              <View style={{ marginLeft: 7 }}>
                <Text style={[mobileStyles.brandTitle, isLight && { color: '#0f172a' }]}>
                  FarmsKing{' '}
                  <Text
                    style={[
                      mobileStyles.brandBadge,
                      isLight && {
                        color: '#16a34a',
                        backgroundColor: 'rgba(22, 163, 74, 0.12)',
                        borderColor: 'rgba(234, 179, 8, 0.4)',
                      },
                      isDarkTheme && {
                        color: '#38bdf8',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        borderColor: 'rgba(56, 189, 248, 0.4)',
                      },
                    ]}
                  >
                    4D
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>

            {/* Center: Domain Pillar Selector Button (Global on mobile for admins) */}
            {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
              <TouchableOpacity
                style={[
                  mobileStyles.pillarSelectorPill,
                  isLight && {
                    backgroundColor: '#f0fdf4',
                    borderColor: '#16a34a',
                  },
                  isDarkTheme && {
                    backgroundColor: 'rgba(56, 189, 248, 0.14)',
                    borderColor: '#38bdf8',
                  },
                ]}
                onPress={() => setIsPillarsMenuOpen(true)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={activePillar.iconFilled || activePillar.icon}
                  size={13}
                  color={isLight ? '#16a34a' : isDarkTheme ? '#38bdf8' : '#00ff87'}
                />
                <Text
                  style={[
                    mobileStyles.pillarSelectorText,
                    isLight && { color: '#16a34a' },
                    isDarkTheme && { color: '#38bdf8' },
                  ]}
                  numberOfLines={1}
                >
                  {activePillar.shortTitle || activePillar.title}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={12}
                  color={isLight ? '#16a34a' : isDarkTheme ? '#38bdf8' : '#00ff87'}
                />
              </TouchableOpacity>
            )}

            {/* Right: Actions Group (Quick Search, Health Radar, Light/Dark Toggle) */}
            <View style={mobileStyles.actionsGroup}>
              <TouchableOpacity
                style={[
                  mobileStyles.actionBtn,
                  isLight && { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },
                  isDarkTheme && { backgroundColor: 'rgba(255, 255, 255, 0.06)', borderColor: 'rgba(56, 189, 248, 0.25)' },
                ]}
                onPress={() => setIsSearchOpen(true)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="search" size={15} color={isLight ? '#16a34a' : isDarkTheme ? '#38bdf8' : '#00ff87'} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  mobileStyles.actionBtn,
                  isLight && { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },
                  isDarkTheme && { backgroundColor: 'rgba(255, 255, 255, 0.06)', borderColor: 'rgba(56, 189, 248, 0.25)' },
                ]}
                onPress={() => setIsHealthRadarOpen(true)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View
                  style={[
                    mobileStyles.radarDot,
                    isLight && { backgroundColor: '#16a34a' },
                    isDarkTheme && { backgroundColor: '#38bdf8' },
                  ]}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  mobileStyles.actionBtn,
                  isLight && { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },
                  isDarkTheme && { backgroundColor: 'rgba(255, 255, 255, 0.06)', borderColor: 'rgba(56, 189, 248, 0.25)' },
                ]}
                onPress={() => setThemeMode(isLight ? 'DARK' : 'LIGHT')}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={isLight ? 'sunny' : 'moon'}
                  size={15}
                  color={isLight ? '#d97706' : isDarkTheme ? '#38bdf8' : '#00ff87'}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 💻 TOP WORKSPACE SUB-TABS HEADER BAR (Visible on Desktop & Mobile for Admins) */}
        {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
          <View
            style={[
              desktopStyles.topTabsHeaderBar,
              !isDesktop && { height: 42, paddingVertical: 2, paddingHorizontal: 6 },
              {
                backgroundColor: isLight ? '#ffffff' : isDarkTheme ? '#0b1329' : '#03140a',
                borderBottomColor: isLight ? 'rgba(22, 163, 74, 0.18)' : isDarkTheme ? 'rgba(56, 189, 248, 0.2)' : 'rgba(0, 255, 135, 0.2)',
                shadowColor: colors.shadowColor,
              },
            ]}
          >
            <View style={desktopStyles.topTabsHeaderInner}>
              {/* Clean Segmented Sub-Tabs Navigation */}
              <View style={desktopStyles.topTabsAnimatedContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[desktopStyles.topTabsScrollContent, !isDesktop && { paddingHorizontal: 4, gap: 4 }]}
                >
                  <View
                    style={[
                      desktopStyles.segmentedTabContainer,
                      !isDesktop && { padding: 2 },
                      isLight && {
                        backgroundColor: '#f1f5f9',
                        borderColor: 'rgba(22, 163, 74, 0.2)',
                      },
                      isDarkTheme && {
                        borderColor: 'rgba(56, 189, 248, 0.25)',
                      },
                    ]}
                  >
                    {activePillar.subTabs.map((tab) => {
                      const isActive = activeSubTab?.id === tab.id;

                      return (
                        <Pressable
                          key={tab.id}
                          onPress={() => handleSelectSubTab(tab)}
                          style={({ hovered, pressed }: any) => [
                            desktopStyles.segmentedTabItem,
                            !isDesktop && { paddingHorizontal: 10, paddingVertical: 5 },
                            isActive && (
                              isLight
                                ? {
                                    backgroundColor: '#16a34a',
                                    shadowColor: '#16a34a',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 5,
                                    elevation: 3,
                                  }
                                : isDarkTheme
                                ? {
                                    backgroundColor: '#38bdf8',
                                    shadowColor: '#38bdf8',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 5,
                                    elevation: 3,
                                  }
                                : desktopStyles.segmentedTabItemActive
                            ),
                            hovered && !isActive && (
                              isLight
                                ? { backgroundColor: '#e2e8f0' }
                                : desktopStyles.segmentedTabItemHover
                            ),
                            pressed && { transform: [{ scale: 0.98 }] },
                          ]}
                        >
                          <Ionicons
                            name={tab.icon}
                            size={isDesktop ? 14.5 : 13}
                            color={
                              isActive
                                ? (isLight ? '#ffffff' : isDarkTheme ? '#020617' : '#020d06')
                                : (isLight ? '#64748b' : '#94a3b8')
                            }
                          />
                          <Text
                            style={[
                              desktopStyles.segmentedTabText,
                              !isDesktop && { fontSize: 11 },
                              isActive
                                ? (isLight ? { color: '#ffffff', fontFamily: FONT.bold } : isDarkTheme ? { color: '#020617', fontFamily: FONT.bold } : desktopStyles.segmentedTabTextActive)
                                : (isLight ? { color: '#64748b', fontFamily: FONT.medium } : desktopStyles.segmentedTabTextInactive),
                            ]}
                            numberOfLines={1}
                          >
                            {isDesktop ? tab.title : (tab.shortTitle || tab.title)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              {/* 🟢 Live Infrastructure Health Pulse (Visible on Desktop) */}
              {isDesktop && (
                <TouchableOpacity
                  style={[
                    desktopStyles.healthRadarTriggerBtn,
                    isLight && {
                      backgroundColor: '#f0fdf4',
                      borderColor: 'rgba(22, 163, 74, 0.3)',
                    },
                    isDarkTheme && {
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      borderColor: 'rgba(56, 189, 248, 0.3)',
                    },
                  ]}
                  onPress={() => setIsHealthRadarOpen(true)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      desktopStyles.healthRadarDot,
                      isLight && { backgroundColor: '#16a34a' },
                      isDarkTheme && { backgroundColor: '#38bdf8' },
                    ]}
                  />
                  <Text
                    style={[
                      desktopStyles.healthRadarText,
                      isLight && { color: '#16a34a' },
                      isDarkTheme && { color: '#38bdf8' },
                    ]}
                  >
                    99.9% Uptime
                  </Text>
                </TouchableOpacity>
              )}

              {/* Spotlight Command Search Trigger Button (Visible on Desktop) */}
              {isDesktop && (
                <TouchableOpacity
                  style={[
                    desktopStyles.spotlightTriggerBtn,
                    isLight && {
                      backgroundColor: '#ffffff',
                      borderColor: 'rgba(22, 163, 74, 0.25)',
                    },
                    isDarkTheme && {
                      backgroundColor: 'rgba(56, 189, 248, 0.08)',
                      borderColor: 'rgba(56, 189, 248, 0.3)',
                    },
                  ]}
                  onPress={() => setIsSearchOpen(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="search" size={13} color={isLight ? '#16a34a' : isDarkTheme ? '#38bdf8' : '#059669'} />
                  <Text style={[desktopStyles.spotlightTriggerText, isLight && { color: '#475569' }]}>Quick Search</Text>
                  <View
                    style={[
                      desktopStyles.kbdBadge,
                      isLight && {
                        backgroundColor: '#f1f5f9',
                        borderColor: '#cbd5e1',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        desktopStyles.kbdText,
                        isLight && { color: '#16a34a' },
                        isDarkTheme && { color: '#38bdf8' },
                      ]}
                    >
                      Ctrl K
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* 👁️ Shopify-Style Safe Executive Impersonation Banner */}
        <AdminImpersonationBanner
          target={impersonationTarget}
          onExit={() => setImpersonationTarget(null)}
        />


        {/* Tabs fills all remaining vertical space after the top sub-tabs header bar.
             The AnimatedPurpleBottomBar auto-hides on desktop (isDesktop check inside it).
             contentStyle gives each screen:
               - flex:1 so it fills all available height
               - paddingBottom on mobile so content clears the 64px floating tab bar
             On desktop paddingBottom is 0 (sidebar navigation, no tab bar). */}
        <Tabs
          tabBar={(props: any) => <AnimatedPurpleBottomBar {...props} />}
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            sceneStyle: {
              flex: 1,
              // Mobile: reserve space at bottom for the floating tab bar (height 64-76 + safe area)
              paddingBottom: isDesktop ? 0 : (Platform.OS === 'ios' ? 84 : 70),
            },
          }}
        >
          {ALL_TABS.map((name) => {
            const isShown = visible.has(name);
            if (name === 'index') {
              const isOverview = role === 'ADMIN' || role === 'SUPER_ADMIN';
              return (
                <Tabs.Screen
                  key={name}
                  name="index"
                  options={{
                    title: getHomeTitle(role),
                    tabBarLabel: getHomeTitle(role),
                    href: isShown ? undefined : null,
                    tabBarIcon: ({ color, focused }) => (
                      <Ionicons
                        size={23}
                        name={isOverview ? (focused ? 'analytics' : 'analytics-outline') : (focused ? 'home' : 'home-outline')}
                        color={color}
                      />
                    ),
                  }}
                />
              );
            }
            if (name === 'more') {
              return (
                <Tabs.Screen
                  key={name}
                  name="more"
                  options={{
                    title: t('tabMore', 'More'),
                    href: isShown ? undefined : null,
                    tabBarIcon: ({ color, focused }) => (
                      <Ionicons size={23} name={focused ? 'grid' : 'grid-outline'} color={color} />
                    ),
                  }}
                />
              );
            }
            if (name === 'admin_more') {
              return (
                <Tabs.Screen
                  key={name}
                  name="admin_more"
                  options={{
                    title: t('tabMore', 'More'),
                    href: isShown ? undefined : null,
                    tabBarIcon: ({ color, focused }) => (
                      <Ionicons size={23} name={focused ? 'grid' : 'grid-outline'} color={color} />
                    ),
                  }}
                />
              );
            }
            if (name === 'farmers') {
              const isGardenAdvisor = role === 'GARDEN_ADVISOR';
              return (
                <Tabs.Screen
                  key={name}
                  name="farmers"
                  options={{
                    title: isGardenAdvisor ? t('tabGardens', 'Gardens') : t('tabFarmers', 'Farmers'),
                    href: isShown ? undefined : null,
                    tabBarIcon: ({ color, focused }) => (
                      <TabIconWithUnreadDot showDot={hasUnreadChat}>
                        <Ionicons size={23} name={focused ? 'leaf' : 'leaf-outline'} color={color} />
                      </TabIconWithUnreadDot>
                    ),
                  }}
                />
              );
            }
            const meta = TAB_META[name];
            const showUnreadDot = hasUnreadChat && (name === 'market' || name === 'chat');
            if (name === 'cart') {
              return (
                <Tabs.Screen
                  key={name}
                  name={name}
                  options={{
                    title: t(meta.key, meta.title),
                    href: isShown ? undefined : null,
                    tabBarIcon: ({ color, focused }) => (
                      <TabIconWithCartCount count={cartItemCount}>
                        <Ionicons size={23} name={focused ? meta.iconFilled : meta.icon} color={color} />
                      </TabIconWithCartCount>
                    ),
                  }}
                />
              );
            }
            if (name === 'admin-products') {
              return (
                <Tabs.Screen
                  key={name}
                  name="admin-products"
                  options={{
                    title: 'Market',
                    tabBarLabel: 'Market',
                    href: isShown ? undefined : null,
                    tabBarIcon: ({ color, focused }) => (
                      <Ionicons size={23} name={focused ? 'storefront' : 'storefront-outline'} color={color} />
                    ),
                  }}
                />
              );
            }
            return (
              <Tabs.Screen
                key={name}
                name={name}
                options={{
                  title: t(meta.key, meta.title),
                  href: isShown ? undefined : null,
                  tabBarIcon: ({ color, focused }) => (
                    <TabIconWithUnreadDot showDot={showUnreadDot}>
                      <Ionicons size={23} name={focused ? meta.iconFilled : meta.icon} color={color} />
                    </TabIconWithUnreadDot>
                  ),
                }}
              />
            );
          })}

          {/* Hidden tool screens — accessed via More tab, navigation shortcuts, and direct links */}
          <Tabs.Screen
            name="crop-disease-scanner"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="satellite-map"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="memberships"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="coupons"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="crop-intelligence"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="dose"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="advisor-profile"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="farmer-profile-setup"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="admin-sellers"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="seller-payouts"
            options={{
              href: null,
            }}
          />
        </Tabs>

        {/* 🌟 SUPER PREMIUM MODALS & TOAST NOTIFICATIONS */}
        <GlobalCommandSearchModal
          visible={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onOpenHealthRadar={() => setIsHealthRadarOpen(true)}
          onStartImpersonation={(target) => setImpersonationTarget(target)}
        />
        <AdminHealthRadarModal
          visible={isHealthRadarOpen}
          onClose={() => setIsHealthRadarOpen(false)}
        />
        <MobilePillarsMenuModal
          visible={isPillarsMenuOpen}
          onClose={() => setIsPillarsMenuOpen(false)}
          activePillarId={selectedPillarId}
        />
        <AdminLiveToastNotification />
      </View>
    </View>
    <UniversalCommandPalette activePortalId="ADMIN_HQ" />
  </PortalGuard>
);
}

const desktopStyles = StyleSheet.create({
  sidebar: {
    width: 260,
    backgroundColor: '#020b06',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 255, 135, 0.18)',
    paddingVertical: 18,
    shadowColor: '#00ff87',
    shadowOffset: { width: 3, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    zIndex: 99,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(20px)' } as any) : {}),
  },
  brandLogoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 10,
  },
  brandTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#6ee7b7',
    marginTop: 1,
  },
  brandBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.4)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  sidebarSectionTitle: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
    letterSpacing: 1.2,
    marginLeft: 16,
    marginBottom: 8,
  },
  menuNavCol: {
    paddingHorizontal: 8,
    gap: 3,
    paddingBottom: 10,
  },
  pillarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.16)',
    marginBottom: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  pillarCardActive: {
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
    borderColor: '#00ff87',
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  pillarCardHover: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(0, 255, 135, 0.35)',
  },
  pillarActiveBar: {
    position: 'absolute',
    left: 0,
    top: 5,
    bottom: 5,
    width: 3,
    backgroundColor: '#00ff87',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  pillarIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarIconWrapActive: {
    backgroundColor: '#00ff87',
    borderColor: '#00ff87',
  },
  pillarContentCol: {
    flex: 1,
    marginLeft: 8,
  },
  pillarTitle: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
    letterSpacing: 0.1,
  },
  pillarTitleActive: {
    color: '#00ff87',
    fontFamily: FONT.extraBold,
  },
  pillarBadge: {
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
  },
  pillarBadgeActive: {
    backgroundColor: 'rgba(0, 255, 135, 0.25)',
    borderColor: '#00ff87',
  },
  pillarBadgeText: {
    fontSize: 8.5,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  pillarBadgeTextActive: {
    color: '#00ff87',
    fontFamily: FONT.extraBold,
  },
  settingsBottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
    marginBottom: 8,
  },
  settingsBottomBtnText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
  },
  settingsBottomBadge: {
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
  },
  settingsBottomBadgeText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
  navMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.16)',
  },
  navMenuItemActive: {
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
    borderWidth: 1,
    borderColor: '#00ff87',
    shadowColor: '#00ff87',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  navIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: {
    backgroundColor: '#00ff87',
    borderColor: '#00ff87',
  },
  navMenuItemText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
  },
  navMenuItemTextActive: {
    color: '#00ff87',
    fontFamily: FONT.extraBold,
  },
  sidebarBottom: {
    paddingHorizontal: 14,
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 255, 135, 0.15)',
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
  },
  themeSwitcherBox: {
    flexDirection: 'row',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeSwitcherBoxLight: {
    backgroundColor: '#f1f5f9',
    borderColor: 'rgba(22, 163, 74, 0.25)',
  },
  themeSwitcherBoxDark: {
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeBtnActiveLight: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.5)',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  themeBtnActiveMedium: {
    backgroundColor: 'rgba(0, 255, 135, 0.22)',
    borderWidth: 1,
    borderColor: '#00ff87',
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  themeBtnActiveDark: {
    backgroundColor: 'rgba(56, 189, 248, 0.22)',
    borderWidth: 1,
    borderColor: '#38bdf8',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  themeBtnText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#94a3b8',
    letterSpacing: 0.1,
  },
  themeBtnTextActiveLight: {
    color: '#16a34a',
    fontFamily: FONT.extraBold,
  },
  themeBtnTextActiveMedium: {
    color: '#00ff87',
    fontFamily: FONT.extraBold,
  },
  themeBtnTextActiveDark: {
    color: '#38bdf8',
    fontFamily: FONT.extraBold,
  },
  topTabsHeaderBar: {
    backgroundColor: '#03140a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 135, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 90,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(20px)' } as any) : {}),
  },
  topTabsHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  topTabsAnimatedContainer: {
    flex: 1,
    minWidth: 0,
  },
  topTabsScrollContent: {
    alignItems: 'center',
    paddingRight: 16,
  },
  segmentedTabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
    padding: 3,
    gap: 3,
  },
  segmentedTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: 'transparent',
  },
  segmentedTabItemActive: {
    backgroundColor: '#00ff87',
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  segmentedTabItemHover: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  segmentedTabText: {
    fontSize: 12,
    letterSpacing: 0.1,
  },
  segmentedTabTextInactive: {
    color: '#94a3b8',
    fontFamily: FONT.medium,
  },
  segmentedTabTextActive: {
    color: '#020d06',
    fontFamily: FONT.bold,
  },
  spotlightTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    flexShrink: 0,
  },
  spotlightTriggerText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  kbdBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  kbdText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
  healthRadarTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: RADIUS.pill,
    flexShrink: 0,
  },
  healthRadarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00ff87',
  },
  healthRadarText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
});

const layoutStyles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden' as any,
    ...(Platform.OS === 'web'
      ? {
          height: '100dvh' as any,
          maxHeight: '100dvh' as any,
        }
      : {}),
  },
});

const mobileStyles = StyleSheet.create({
  mobileTopBar: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 135, 0.18)',
    zIndex: 95,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(20px)' } as any) : {}),
  },
  brandBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoSquircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  brandTitle: {
    fontSize: 13.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  brandBadge: {
    fontSize: 8,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.4)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  pillarSelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.35)',
    maxWidth: 135,
  },
  pillarSelectorText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#00ff87',
    letterSpacing: 0.1,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00ff87',
  },
});

