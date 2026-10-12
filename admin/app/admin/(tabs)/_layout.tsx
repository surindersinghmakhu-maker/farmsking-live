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
  | 'index' | 'shop' | 'admin_shop' | 'farm' | 'garden' | 'records' | 'market' | 'more' | 'admin_more'
  | 'categories' | 'cart' | 'orders'
  | 'farmers' | 'schedule' | 'chat'
  | 'referrals' | 'wallet'
  | 'admin-orders' | 'admin-products'
  | 'super-users' | 'super-coupons' | 'super-accounts' | 'super-settings'
  | 'super-orders' | 'super-audit-log' | 'super-crop-edit'
  | 'operator-orders' | 'trainer-dashboard';

const ROLE_TABS: Record<string, { tabs: TabName[] }> = {
  SUPER_ADMIN: { tabs: ['index', 'admin-products', 'super-users', 'super-accounts', 'admin_more'] },
  ADMIN: { tabs: ['index', 'admin-products', 'super-users', 'super-accounts', 'admin_more'] },
  OPERATOR: { tabs: ['index', 'operator-orders', 'admin_more'] },
  TECHNICAL_TRAINER: { tabs: ['index', 'trainer-dashboard', 'super-users', 'admin_more'] },
  MARKET_MANAGER: { tabs: ['index', 'super-coupons', 'super-accounts', 'admin_more'] },
};

const TAB_META: Record<Exclude<TabName, 'index' | 'more' | 'admin_more'>, { key: TranslationKey; title: string; icon: keyof typeof Ionicons.glyphMap; iconFilled: keyof typeof Ionicons.glyphMap }> = {
  shop: { key: 'tabCustomerHome', title: 'Store', icon: 'bag-outline', iconFilled: 'bag' },
  admin_shop: { key: 'agristoreHub' as any, title: 'E-Commerce', icon: 'storefront-outline', iconFilled: 'storefront' },
  farm: { key: 'tabCrops', title: 'Crops', icon: 'leaf-outline', iconFilled: 'leaf' },
  garden: { key: 'tabCrops', title: 'Garden', icon: 'leaf-outline', iconFilled: 'leaf' },
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
  'admin-products': { key: 'tabProducts', title: 'Products', icon: 'cube-outline', iconFilled: 'cube' },
  'super-users': { key: 'tabUsers', title: 'Users', icon: 'people-outline', iconFilled: 'people' },
  'super-coupons': { key: 'tabCoupons', title: 'Farmers', icon: 'people-outline', iconFilled: 'people' },
  'super-accounts': { key: 'tabAccounts', title: 'Finance', icon: 'cash-outline', iconFilled: 'cash' },
  'super-settings': { key: 'tabFeatures', title: 'C-Panel', icon: 'options-outline', iconFilled: 'options' },
  'super-orders': { key: 'superSaleManagement', title: 'Sale / Order Management', icon: 'receipt-outline', iconFilled: 'receipt' },
  'super-audit-log': { key: 'superAuditLog', title: 'Audit Log', icon: 'time-outline', iconFilled: 'time' },
  'super-crop-edit': { key: 'tabCrops', title: 'Edit Crop', icon: 'leaf-outline', iconFilled: 'leaf' },
  'operator-orders': { key: 'tabFulfillment', title: 'Fulfillment', icon: 'cube-outline', iconFilled: 'cube' },
  'trainer-dashboard': { key: 'tabFarms', title: 'Trainer', icon: 'school-outline', iconFilled: 'school' },
};

const ALL_TABS: TabName[] = [
  'index', 'shop', 'admin_shop', 'farm', 'garden', 'records', 'market',
  'categories', 'cart', 'orders',
  'farmers', 'schedule', 'chat',
  'referrals', 'wallet',
  'admin-orders', 'admin-products',
  'super-users', 'super-coupons', 'super-accounts', 'super-settings',
  'super-orders', 'super-audit-log', 'super-crop-edit',
  'operator-orders', 'trainer-dashboard',
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
  const { colors } = useExecutiveTheme();
  const config = ROLE_TABS[role] || ROLE_TABS.OPERATOR;
  const visible = new Set(config ? config.tabs : ['index', 'admin_more']);

  const isChatCapable = !!user && CHAT_CAPABLE_ROLES.has(user.role);
  useGlobalChatUnreadSync(isChatCapable);
  const { data: chatUnreadData } = useChatUnreadCount(isChatCapable);
  const hasUnreadChat = (chatUnreadData?.count ?? 0) > 0;
  const { itemCount: cartItemCount } = useCart();

  const getHomeTitle = (_userRole: UserRole): string => {
    return t('tabHome', 'Home');
  };

  const getTabTitle = (name: TabName): string => {
    if (name === 'index') return getHomeTitle(role);
    if (name === 'more' || name === 'admin_more') return t('tabMore', 'More');
    if (name === 'farmers') return role === 'GARDEN_ADVISOR' ? t('tabGardens', 'Gardens') : t('tabFarmers', 'Farmers');
    if ((name === 'shop' || name === 'admin_shop') && (role === 'ADMIN' || role === 'SUPER_ADMIN')) return 'E-Commerce';
    const meta = TAB_META[name as Exclude<TabName, 'index' | 'more' | 'admin_more'>];
    return meta ? t(meta.key, meta.title) : name;
  };

  const getTabIcon = (name: TabName, focused: boolean): keyof typeof Ionicons.glyphMap => {
    if (name === 'index') return focused ? 'home' : 'home-outline';
    if (name === 'more' || name === 'admin_more') return focused ? 'grid' : 'grid-outline';
    if (name === 'farmers') return focused ? 'leaf' : 'leaf-outline';
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

  return (
    <View style={{ flex: 1, backgroundColor: '#020d06', flexDirection: isDesktop ? 'row' : 'column' }}>
      {/* 💻 DESKTOP 2-TIER EXECUTIVE SIDEBAR (Visible on screens >= 768px) */}
      {isDesktop && (
        <View style={desktopStyles.sidebar}>
          {/* Brand Logo & Platform Title */}
          <View style={desktopStyles.brandLogoBox}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#00ff87', alignItems: 'center', justifyContent: 'center' }}>
              <BrandLogo size={22} iconColor="#020d06" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={desktopStyles.brandTitle}>
                FarmsKing <Text style={desktopStyles.brandBadgeText}>4D</Text>
              </Text>
              <Text style={desktopStyles.brandSubtitle}>Executive Hub</Text>
            </View>
          </View>

          {/* Section Heading */}
          <Text style={desktopStyles.sidebarSectionTitle}>DOMAIN PILLARS</Text>

          {/* Navigation Pillars List (Effective Prominent Buttons) */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={desktopStyles.menuNavCol}>
            {(() => {
              if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
                return ADMIN_PILLARS.map((pillar) => {
                  const isActive = selectedPillarId === pillar.id;
                  return (
                    <Pressable
                      key={pillar.id}
                      onPress={() => handleSelectPillar(pillar)}
                      style={({ hovered, pressed }: any) => [
                        desktopStyles.pillarCard,
                        isActive && desktopStyles.pillarCardActive,
                        hovered && !isActive && desktopStyles.pillarCardHover,
                        pressed && { transform: [{ scale: 0.98 }] },
                      ]}
                    >
                      {/* Active Left Indicator Bar */}
                      {isActive && <View style={desktopStyles.pillarActiveBar} />}

                      <View
                        style={[
                          desktopStyles.pillarIconWrap,
                          isActive && desktopStyles.pillarIconWrapActive,
                        ]}
                      >
                        <Ionicons
                          name={isActive ? pillar.iconFilled : pillar.icon}
                          size={18}
                          color={isActive ? '#ffffff' : (pillar.color || '#059669')}
                        />
                      </View>

                      <View style={desktopStyles.pillarContentCol}>
                        <Text
                          style={[
                            desktopStyles.pillarTitle,
                            isActive && desktopStyles.pillarTitleActive,
                          ]}
                          numberOfLines={1}
                        >
                          {pillar.title}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <View style={[desktopStyles.pillarBadge, isActive && desktopStyles.pillarBadgeActive]}>
                            <Text
                              style={[
                                desktopStyles.pillarBadgeText,
                                isActive && desktopStyles.pillarBadgeTextActive,
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
                        color={isActive ? '#10b981' : '#94a3b8'}
                      />
                    </Pressable>
                  );
                });
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
                    style={[desktopStyles.navMenuItem, isActive && desktopStyles.navMenuItemActive]}
                    onPress={() => handleNavigate(tabName)}
                  >
                    <View style={[desktopStyles.navIconWrap, isActive && desktopStyles.navIconWrapActive]}>
                      <Ionicons name={iconName} size={18} color={isActive ? '#ffffff' : '#64748b'} />
                    </View>
                    <Text style={[desktopStyles.navMenuItemText, isActive && desktopStyles.navMenuItemTextActive]}>
                      {title}
                    </Text>
                  </TouchableOpacity>
                );
              });
            })()}
          </ScrollView>

          {/* Bottom Actions in Sidebar */}
          <View style={desktopStyles.sidebarBottom}>
            {(() => {
              const isSellerRole = (role as string) === 'SELLER' || (user?.role as string) === 'SELLER' || Boolean((user as any)?.isSeller);
              if (!isSellerRole) return null;
              return (
                <TouchableOpacity
                  style={[desktopStyles.headerActionBtn, { marginBottom: 12 }]}
                  onPress={() => router.push('/seller-dashboard')}
                >
                  <Ionicons name="storefront-outline" size={16} color="#059669" />
                  <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#059669' }}>
                    🏪 Seller Hub
                  </Text>
                </TouchableOpacity>
              );
            })()}

            <View style={desktopStyles.langSwitcherBox}>
              <TouchableOpacity
                style={[desktopStyles.langBtn, language === 'pa' && desktopStyles.langBtnActive]}
                onPress={() => setLanguage('pa')}
              >
                <Text style={[desktopStyles.langBtnText, language === 'pa' && desktopStyles.langBtnTextActive]}>ਪੰਜਾਬੀ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[desktopStyles.langBtn, language === 'hi' && desktopStyles.langBtnActive]}
                onPress={() => setLanguage('hi')}
              >
                <Text style={[desktopStyles.langBtnText, language === 'hi' && desktopStyles.langBtnTextActive]}>हिंदी</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[desktopStyles.langBtn, language === 'en' && desktopStyles.langBtnActive]}
                onPress={() => setLanguage('en')}
              >
                <Text style={[desktopStyles.langBtnText, language === 'en' && desktopStyles.langBtnTextActive]}>ENG</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 📱 MAIN CONTENT CANVAS CONTAINER */}
      <View style={{ flex: 1 }}>
        {/* 💻 TOP WORKSPACE SUB-TABS HEADER BAR (Visible on Desktop & Mobile for Admins) */}
        {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
          <View style={[desktopStyles.topTabsHeaderBar, !isDesktop && { height: 46, paddingVertical: 4, paddingHorizontal: 8 }]}>
            <View style={desktopStyles.topTabsHeaderInner}>
              {/* Clean Segmented Sub-Tabs Navigation */}
              <View style={desktopStyles.topTabsAnimatedContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[desktopStyles.topTabsScrollContent, !isDesktop && { paddingHorizontal: 4, gap: 4 }]}
                >
                  <View style={[desktopStyles.segmentedTabContainer, !isDesktop && { padding: 2 }]}>
                    {activePillar.subTabs.map((tab) => {
                      const isActive = activeSubTab?.id === tab.id;

                      return (
                        <Pressable
                          key={tab.id}
                          onPress={() => handleSelectSubTab(tab)}
                          style={({ hovered, pressed }: any) => [
                            desktopStyles.segmentedTabItem,
                            !isDesktop && { paddingHorizontal: 10, paddingVertical: 5 },
                            isActive && desktopStyles.segmentedTabItemActive,
                            hovered && !isActive && desktopStyles.segmentedTabItemHover,
                            pressed && { transform: [{ scale: 0.98 }] },
                          ]}
                        >
                          <Ionicons
                            name={tab.icon}
                            size={isDesktop ? 14.5 : 13}
                            color={isActive ? '#059669' : '#64748b'}
                          />
                          <Text
                            style={[
                              desktopStyles.segmentedTabText,
                              !isDesktop && { fontSize: 11 },
                              isActive ? desktopStyles.segmentedTabTextActive : desktopStyles.segmentedTabTextInactive,
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
                  style={desktopStyles.healthRadarTriggerBtn}
                  onPress={() => setIsHealthRadarOpen(true)}
                  activeOpacity={0.8}
                >
                  <View style={desktopStyles.healthRadarDot} />
                  <Text style={desktopStyles.healthRadarText}>99.9% Uptime</Text>
                </TouchableOpacity>
              )}

              {/* Spotlight Command Search Trigger Button (Visible on Desktop) */}
              {isDesktop && (
                <TouchableOpacity
                  style={desktopStyles.spotlightTriggerBtn}
                  onPress={() => setIsSearchOpen(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="search" size={13} color="#059669" />
                  <Text style={desktopStyles.spotlightTriggerText}>Quick Search</Text>
                  <View style={desktopStyles.kbdBadge}>
                    <Text style={desktopStyles.kbdText}>Ctrl K</Text>
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


        <Tabs
          tabBar={(props: any) => <AnimatedPurpleBottomBar {...props} />}
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}>
          {ALL_TABS.map((name) => {
            const isShown = visible.has(name);
            if (name === 'index') {
              return (
                <Tabs.Screen
                  key={name}
                  name="index"
                  options={{
                    title: getHomeTitle(role),
                    href: isShown ? undefined : null,
                    tabBarIcon: ({ color, focused }) => (
                      <Ionicons size={23} name={focused ? 'home' : 'home-outline'} color={color} />
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
    paddingHorizontal: 10,
    gap: 6,
    paddingBottom: 20,
  },
  pillarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.16)',
    marginBottom: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  pillarCardActive: {
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
    borderColor: '#00ff87',
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  pillarCardHover: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(0, 255, 135, 0.35)',
  },
  pillarActiveBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3.5,
    backgroundColor: '#00ff87',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  pillarIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
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
    marginLeft: 10,
  },
  pillarTitle: {
    fontSize: 12,
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
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
  },
  pillarBadgeActive: {
    backgroundColor: 'rgba(0, 255, 135, 0.25)',
    borderColor: '#00ff87',
  },
  pillarBadgeText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  pillarBadgeTextActive: {
    color: '#00ff87',
    fontFamily: FONT.extraBold,
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
  langSwitcherBox: {
    flexDirection: 'row',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  langBtn: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
  },
  langBtnActive: {
    backgroundColor: 'rgba(0, 255, 135, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.4)',
  },
  langBtnText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  langBtnTextActive: {
    color: '#00ff87',
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
