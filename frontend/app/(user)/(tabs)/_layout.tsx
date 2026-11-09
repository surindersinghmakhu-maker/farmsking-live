import { Tabs, useRouter, usePathname } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, StyleSheet, Text, TouchableOpacity, useWindowDimensions, ScrollView, Animated, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { AnimatedPurpleBottomBar } from '@/components/ui/AnimatedPurpleBottomBar';
import { RoleThemes, UserRole } from '@/constants/Colors';
import { ROLE_TABS, TabName, getTabsForRole, RoleTabItem } from '@/constants/RoleTabs';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { useRole } from '@/src/store/role-context';
import { useAuth } from '@/src/store/auth-context';
import { useLanguage } from '@/src/store/language-context';
import { useMyAdvisor } from '@/src/hooks/useAdvisorAssignments';
import { useFarmerProfileStatus } from '@/src/hooks/useFarmerProfile';
import { useChatUnreadCount, useGlobalChatUnreadSync } from '@/src/hooks/useChat';
import { useUnreadNotificationCount } from '@/src/hooks/useNotifications';
import { TranslationKey } from '@/src/constants/translations';
import { useCart } from '@/src/store/cart-context';
import { BrandLogo } from '@/src/components/BrandLogo';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { FloatingAgriAiChatbot } from '@/src/components/FloatingAgriAiChatbot';

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


const TAB_META: Record<Exclude<TabName, 'index' | 'more' | 'admin_more'>, { key: TranslationKey; title: string; icon: keyof typeof Ionicons.glyphMap; iconFilled: keyof typeof Ionicons.glyphMap }> = {
  shop: { key: 'tabCustomerHome', title: 'Store', icon: 'bag-outline', iconFilled: 'bag' },
  'ai-doctor': { key: 'tabMyAdvisor' as any, title: 'AI Doctor', icon: 'sparkles-outline', iconFilled: 'sparkles' },
  admin_shop: { key: 'agristoreHub' as any, title: 'E-Commerce', icon: 'storefront-outline', iconFilled: 'storefront' },
  farm: { key: 'tabCrops', title: 'Crops', icon: 'leaf-outline', iconFilled: 'leaf' },
  garden: { key: 'tabGardens' as any, title: 'Gardens', icon: 'flower-outline', iconFilled: 'flower' },
  records: { key: 'tabRecords', title: 'Accounts', icon: 'document-text-outline', iconFilled: 'document-text' },
  categories: { key: 'tabCategories', title: 'Categories', icon: 'grid-outline', iconFilled: 'grid' },
  market: { key: 'tabMarket' as any, title: 'Market', icon: 'cart-outline', iconFilled: 'cart' },
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
  'index', 'ai-doctor', 'admin_shop', 'farm', 'garden', 'records',
  'categories', 'cart', 'orders',
  'farmers', 'schedule', 'chat',
  'referrals', 'wallet',
  'admin-orders', 'admin-products',
  'super-users', 'super-coupons', 'super-accounts', 'super-settings',
  'super-orders', 'super-audit-log', 'super-crop-edit',
  'operator-orders', 'trainer-dashboard',
  'shop',
  'more', 'admin_more',
];

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768; // Desktop breakpoint

  const { role } = useRole();
  const { t, language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const { data: unreadNotifData } = useUnreadNotificationCount();
  const unreadNotifCount = unreadNotifData?.count ?? 0;
  const { colors, toggleThemeMode, isDark } = useExecutiveTheme();

  // Instant smooth splash handoff: dismiss splash as soon as the dashboard has finished compositing & painting
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if ((window as any).__dismissFarmsKingSplash) {
            (window as any).__dismissFarmsKingSplash();
          }
        });
      });
    }
  }, []);
  const config = ROLE_TABS[role] || ROLE_TABS.FARMER;
  const visible = new Set(config ? config.tabs : ['index', 'farm', 'records', 'shop', 'more']);

  const roleTabs = getTabsForRole(role);

  // Robust tab identification by exact route matching
  const getActiveTabKey = (): string => {
    const isHome =
      pathname === '/' ||
      pathname === '/(user)/(tabs)' ||
      pathname === '/(user)/(tabs)/index' ||
      pathname === '/(tabs)' ||
      pathname === '/(tabs)/index' ||
      pathname === '';
    if (isHome) {
      const homeTab = roleTabs.find((t) => t.tabName === 'index');
      return homeTab ? homeTab.tabName : roleTabs[0]?.tabName || 'index';
    }
    const segments = pathname.replace(/^\/+|\/+$/g, '').split('/');
    // Check specific matches first
    const matched = roleTabs.find((t) => {
      if (t.tabName === 'index') return false;
      return (
        segments.includes(t.tabName) ||
        pathname === `/${t.tabName}` ||
        pathname.startsWith(`/${t.tabName}/`) ||
        pathname.includes(`/(tabs)/${t.tabName}`)
      );
    });
    return matched ? matched.tabName : roleTabs[0]?.tabName || 'index';
  };

  const activeTabKey = getActiveTabKey();
  const activeIndex = Math.max(0, roleTabs.findIndex((t) => t.tabName === activeTabKey));
  const currentTab = roleTabs[activeIndex] || roleTabs[0];

  // Robust direct-pixel tab gliding animation (ISO 4D executive standard, zero desync)
  const tabLayouts = useRef<{ [key: string]: { x: number; width: number } }>({});
  const slideAnim = useRef(new Animated.Value(0)).current;
  const widthAnim = useRef(new Animated.Value(0)).current;
  const pillOpacity = useRef(new Animated.Value(0)).current;
  const [layoutVersion, setLayoutVersion] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const triggerTabsAnimation = () => {
    fadeAnim.setValue(0.35);
    Animated.spring(fadeAnim, {
      toValue: 1,
      friction: 6,
      tension: 70,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const animatePillToKey = (key: string, immediate = false) => {
    const layout = tabLayouts.current[key];
    if (layout && layout.width > 0) {
      if (immediate) {
        slideAnim.setValue(layout.x);
        widthAnim.setValue(layout.width);
        pillOpacity.setValue(1);
      } else {
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: layout.x,
            tension: 80,
            friction: 9,
            useNativeDriver: false,
          }),
          Animated.spring(widthAnim, {
            toValue: layout.width,
            tension: 80,
            friction: 9,
            useNativeDriver: false,
          }),
          Animated.timing(pillOpacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: false,
          }),
        ]).start();
      }
    }
  };

  useEffect(() => {
    animatePillToKey(activeTabKey);
    triggerTabsAnimation();
  }, [activeTabKey, pathname, layoutVersion, role]);

  const handleTabPress = (tabItem: RoleTabItem) => {
    animatePillToKey(tabItem.tabName);
    triggerTabsAnimation();
    router.push(tabItem.path as any);
  };

  const handleNavLayout = (key: string, e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    if (w > 0) {
      tabLayouts.current[key] = { x, width: w };
      setLayoutVersion((v) => v + 1);
      if (key === activeTabKey) {
        slideAnim.setValue(x);
        widthAnim.setValue(w);
        pillOpacity.setValue(1);
      }
    }
  };

  const getTabColor = (tabItem: RoleTabItem, isActive: boolean) => {
    if (isActive) {
      if (isDark) return tabItem.color;
      switch (tabItem.tabName) {
        case 'index':
        case 'farm':
          return '#15803d';
        case 'records':
          return '#0284c7';
        case 'shop':
          return '#c2410c';
        case 'more':
        case 'admin_more':
          return '#7e22ce';
        default:
          return '#15803d';
      }
    }
    return isDark ? '#94a3b8' : '#0f172a';
  };

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
    if (name === 'more') return t('tabMore', 'More');
    if (name === 'farmers') return role === 'GARDEN_ADVISOR' ? t('tabGardens', 'Gardens') : t('tabFarmers', 'Farmers');
    if (name === 'farm') return t('tabCrops', 'Crops');
    if (name === 'records') return t('tabRecords', 'Accounts');
    if (name === 'shop') return (role === 'ADMIN' || role === 'SUPER_ADMIN') ? t('agristoreHub', 'E-Commerce') : t('tabStore', 'Store');
    if (name === 'admin_shop') return t('agristoreHub', 'E-Commerce');
    if (name === 'ai-doctor') return t('cropDoctor', 'AI Doctor');
    const meta = (TAB_META as any)[name];
    return meta ? t(meta.key, meta.title) : name;
  };

  const getTabIcon = (name: TabName, focused: boolean): keyof typeof Ionicons.glyphMap => {
    if (name === 'index') return focused ? 'home' : 'home-outline';
    if (name === 'more') return focused ? 'grid' : 'grid-outline';
    if (name === 'farmers') return focused ? 'leaf' : 'leaf-outline';
    const meta = (TAB_META as any)[name];
    return meta ? (focused ? meta.iconFilled : meta.icon) : 'square-outline';
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* 💻 DESKTOP TOP NAVIGATION HEADER MENU (Visible on screens >= 768px) */}
      {isDesktop && (
        <View style={[desktopStyles.headerBar, { backgroundColor: colors.headerBg, borderBottomColor: colors.cardBorder }]}>
          <View style={desktopStyles.headerLeft}>
            <TouchableOpacity
              style={[
                desktopStyles.brandLogoBox,
                isDark && desktopStyles.brandLogoNightPill,
              ]}
              activeOpacity={0.8}
              onPress={() => router.push(role === 'CUSTOMER' ? ('/(user)/(tabs)/shop' as any) : ('/(user)/(tabs)' as any))}
            >
              <BrandLogo
                height={36}
                width={124}
                useHdQuality={true}
                dark={isDark}
                resizeMode="contain"
                style={[
                  isDark && Platform.OS === 'web' ? ({
                    filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.4)) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))',
                  } as any) : {},
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* Desktop Links Menu with 4D Continuous Gliding Spring Pill */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={desktopStyles.menuNavRow}>
            <View style={desktopStyles.menuNavWrapper}>
              {Boolean(tabLayouts.current[currentTab?.tabName]) && (
                <Animated.View
                  style={[
                    desktopStyles.desktopGlidingPill,
                    {
                      left: slideAnim,
                      width: widthAnim,
                      opacity: pillOpacity,
                      borderColor: currentTab?.border || '#00ff87',
                      shadowColor: currentTab?.shadow || '#00ff87',
                    },
                  ]}
                  pointerEvents="none"
                >
                  <LinearGradient
                    colors={currentTab?.glow as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <LinearGradient
                    colors={currentTab?.laser as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={desktopStyles.desktopLaserBar}
                  />
                </Animated.View>
              )}

              {roleTabs.map((tab, idx) => {
                const isActive = tab.tabName === activeTabKey || idx === activeIndex;
                const tabColor = getTabColor(tab, isActive);

                return (
                  <TouchableOpacity
                    key={tab.key}
                    onLayout={(e) => handleNavLayout(tab.tabName, e)}
                    style={[
                      desktopStyles.navMenuItem,
                      isActive && desktopStyles.navMenuItemActiveZ,
                    ]}
                    onPress={() => handleTabPress(tab)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isActive ? tab.icon : tab.iconOutline}
                      size={17}
                      color={tabColor}
                    />
                    <Text
                      style={[
                        desktopStyles.navMenuItemText,
                        { color: tabColor },
                        isActive && { color: tabColor, fontFamily: FONT.extraBold },
                        !isDark && !isActive && { color: '#0f172a', fontWeight: '700' },
                      ]}
                    >
                      {getTabTitle(tab.tabName)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Right Header Actions */}
          <View style={desktopStyles.headerRight}>
            {(() => {
              const isSellerRole = role === ('SELLER' as any) || user?.role === ('SELLER' as any) || Boolean((user as any)?.isSeller);
              if (!isSellerRole) return null;
              return (
                <TouchableOpacity
                  style={[
                    desktopStyles.headerActionBtn,
                    { backgroundColor: '#059669', borderStyle: 'solid' },
                  ]}
                  onPress={() => router.push('/seller-dashboard')}
                >
                  <Ionicons
                    name="storefront-outline"
                    size={16}
                    color="#ffffff"
                  />
                  <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#ffffff' }}>
                    🏪 Seller Hub
                  </Text>
                </TouchableOpacity>
              );
            })()}

            {/* Notification Bell */}
            <TouchableOpacity
              style={[
                desktopStyles.headerIconBtn,
                isDark ? desktopStyles.headerIconBtnDark : desktopStyles.headerIconBtnLight,
              ]}
              activeOpacity={0.75}
              onPress={() => router.push('/notifications' as never)}
            >
              <Ionicons name="notifications-outline" size={18} color={isDark ? '#ffffff' : '#0f172a'} />
              {unreadNotifCount > 0 ? (
                <View style={desktopStyles.notifDot}>
                  {unreadNotifCount <= 9 ? <Text style={desktopStyles.notifDotText}>{unreadNotifCount}</Text> : null}
                </View>
              ) : null}
            </TouchableOpacity>

            {/* ☀️ / 🌙 Desktop Light / Dark Toggle */}
            <TouchableOpacity
              style={[
                desktopStyles.themeToggleBtn,
                isDark ? desktopStyles.themeToggleBtnDark : desktopStyles.themeToggleBtnLight,
              ]}
              activeOpacity={0.8}
              onPress={toggleThemeMode}
            >
              <Ionicons
                name={isDark ? 'sunny' : 'moon'}
                size={14}
                color={isDark ? '#f59e0b' : '#0f172a'}
              />
              <Text
                style={[
                  desktopStyles.themeToggleBtnText,
                  { color: isDark ? '#ffffff' : '#0f172a' },
                ]}
              >
                {isDark ? 'Light' : 'Dark'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 📱 MOBILE TOP HEADER BAR (Always visible at top of every tab on mobile with PC-view styled theme button) */}
      {!isDesktop && (
        <View style={[desktopStyles.headerBar, { height: 52, paddingHorizontal: 12, backgroundColor: colors.headerBg, borderBottomColor: colors.cardBorder, borderBottomWidth: 1 }]}>
          <View style={desktopStyles.headerLeft}>
            <TouchableOpacity
              style={[
                desktopStyles.brandLogoBox,
                isDark && desktopStyles.brandLogoNightPill,
              ]}
              activeOpacity={0.8}
              onPress={() => router.push(role === 'CUSTOMER' ? ('/(user)/(tabs)/shop' as any) : ('/(user)/(tabs)' as any))}
            >
              <BrandLogo
                height={28}
                width={96}
                useHdQuality={true}
                dark={isDark}
                resizeMode="contain"
                style={[
                  isDark && Platform.OS === 'web' ? ({
                    filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.4)) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))',
                  } as any) : {},
                ]}
              />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {/* Notification Bell */}
            <TouchableOpacity
              style={[
                desktopStyles.headerIconBtn,
                isDark ? desktopStyles.headerIconBtnDark : desktopStyles.headerIconBtnLight,
                { width: 32, height: 32 },
              ]}
              activeOpacity={0.75}
              onPress={() => router.push('/notifications' as never)}
            >
              <Ionicons name="notifications-outline" size={17} color={isDark ? '#ffffff' : '#0f172a'} />
              {unreadNotifCount > 0 ? (
                <View style={desktopStyles.notifDot}>
                  {unreadNotifCount <= 9 ? <Text style={desktopStyles.notifDotText}>{unreadNotifCount}</Text> : null}
                </View>
              ) : null}
            </TouchableOpacity>

            {/* ☀️ / 🌙 PC-View Style Light / Dark Toggle */}
            <TouchableOpacity
              style={[
                desktopStyles.themeToggleBtn,
                isDark ? desktopStyles.themeToggleBtnDark : desktopStyles.themeToggleBtnLight,
                { paddingHorizontal: 9, paddingVertical: 5 },
              ]}
              activeOpacity={0.8}
              onPress={toggleThemeMode}
            >
              <Ionicons
                name={isDark ? 'sunny' : 'moon'}
                size={14}
                color={isDark ? '#f59e0b' : '#0f172a'}
              />
              <Text
                style={[
                  desktopStyles.themeToggleBtnText,
                  { color: isDark ? '#ffffff' : '#0f172a' },
                ]}
              >
                {isDark ? 'Light' : 'Dark'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 📱 TABS VIEW CONTAINER (Animated 4D Smooth Motion on tab switch) */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <Tabs
          tabBar={(props: any) => (
            <AnimatedPurpleBottomBar
              {...props}
              allowedTabs={config.tabs}
              onTabPressTrigger={triggerTabsAnimation}
            />
          )}
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            sceneStyle: {
              flex: 1,
              paddingBottom: isDesktop ? 0 : (Platform.OS === 'ios' ? 70 : 60),
            },
          }}>
          {(() => {
            const tabOrder = [
              ...config.tabs,
              ...ALL_TABS.filter((t) => !config.tabs.includes(t)),
            ];
            return tabOrder.map((name) => {
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
                    title: getTabTitle(name),
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
                  title: getTabTitle(name),
                  href: isShown ? undefined : null,
                  tabBarIcon: ({ color, focused }) => (
                    <TabIconWithUnreadDot showDot={showUnreadDot}>
                      <Ionicons size={23} name={focused ? meta.iconFilled : meta.icon} color={color} />
                    </TabIconWithUnreadDot>
                  ),
                }}
              />
            );
          });
        })()}

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
          <Tabs.Screen name="garden-vip-cards" options={{ href: null }} />
          
          {/* Explicitly hide auto-discovered screens that shouldn't be main tabs */}
          <Tabs.Screen name="market" options={{ href: null }} />
          <Tabs.Screen name="garden/expenses" options={{ href: null }} />
          <Tabs.Screen name="garden/[id]" options={{ href: null }} />
          <Tabs.Screen name="garden/advisors" options={{ href: null }} />
          <Tabs.Screen name="garden/report-issue" options={{ href: null }} />
        </Tabs>

      </Animated.View>
    </View>
  );
}

const desktopStyles = StyleSheet.create({
  headerBar: {
    height: 60,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    zIndex: 99,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogoNightPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  brandTitle: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  menuNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  menuNavWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 2,
    borderRadius: RADIUS.pill,
  },
  desktopGlidingPill: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1.2,
    overflow: 'hidden',
    zIndex: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
  },
  desktopLaserBar: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },
  navMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  navMenuItemActiveZ: {
    zIndex: 3,
  },
  navMenuItemText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerActionBtnText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#38bdf8',
  },
  langSwitcherBox: {
    flexDirection: 'row',
    gap: 2,
    padding: 2,
    borderRadius: RADIUS.pill,
  },
  langSwitcherBoxDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  langSwitcherBoxLight: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  langBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  langBtnActive: {
    backgroundColor: '#ffffff',
  },
  langBtnActiveDark: {
    backgroundColor: '#ffffff',
  },
  langBtnActiveLight: {
    backgroundColor: '#0f172a',
  },
  langBtnText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  langBtnTextActive: {
    color: '#0f172a',
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerIconBtnDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  headerIconBtnLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  notifDot: {
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    paddingHorizontal: 2,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    position: 'absolute',
    top: -2,
    right: -2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDotText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: FONT.bold,
    lineHeight: 11,
  },
  themeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  themeToggleBtnDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  themeToggleBtnLight: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    ...premiumShadow('rgba(0, 0, 0, 0.06)', 'sm'),
  },
  themeToggleBtnText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  logoutBtnText: {
    color: '#fca5a5',
    fontSize: 11,
    fontFamily: FONT.bold,
  },
});
