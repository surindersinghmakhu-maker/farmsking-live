import { Tabs, useRouter, usePathname } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Platform, View, StyleSheet, Text, TouchableOpacity, useWindowDimensions, ScrollView } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { RoleThemes, UserRole } from '@/constants/Colors';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { useRole } from '@/src/store/role-context';
import { useAuth } from '@/src/store/auth-context';
import { useLanguage } from '@/src/store/language-context';
import { useMyAdvisor } from '@/src/hooks/useAdvisorAssignments';
import { useFarmerProfileStatus } from '@/src/hooks/useFarmerProfile';
import { useChatUnreadCount, useGlobalChatUnreadSync } from '@/src/hooks/useChat';
import { TranslationKey } from '@/src/constants/translations';
import { useCart } from '@/src/store/cart-context';
import { BrandLogo } from '@/src/components/BrandLogo';

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
  | 'index' | 'shop' | 'farm' | 'records' | 'market' | 'more'
  | 'categories' | 'cart' | 'orders'
  | 'farmers' | 'schedule' | 'chat'
  | 'referrals' | 'wallet'
  | 'admin-orders' | 'admin-products'
  | 'super-users' | 'super-coupons' | 'super-accounts' | 'super-settings'
  | 'super-orders' | 'super-audit-log' | 'super-crop-edit'
  | 'operator-orders';

const ROLE_TABS: Record<UserRole, { tabs: TabName[] }> = {
  FARMER: { tabs: ['index', 'shop', 'farm', 'records', 'market', 'more'] },
  GARDENER: { tabs: ['index', 'shop', 'farm', 'records', 'market', 'more'] },
  CUSTOMER: { tabs: ['shop', 'more'] },
  FARM_ADVISOR: { tabs: ['index', 'shop', 'farmers', 'schedule', 'chat', 'more'] },
  GARDEN_ADVISOR: { tabs: ['index', 'shop', 'farmers', 'schedule', 'chat', 'more'] },
  BUSINESS_PARTNER: { tabs: ['index', 'shop', 'referrals', 'wallet', 'more'] },
  ADMIN: { tabs: ['index', 'shop', 'super-users', 'super-settings', 'super-coupons', 'super-accounts', 'more'] },
  SUPER_ADMIN: { tabs: ['index', 'shop', 'super-users', 'super-coupons', 'super-accounts', 'super-settings', 'more'] },
  OPERATOR: { tabs: ['index', 'shop', 'operator-orders', 'more'] },
  LABOUR: { tabs: ['index', 'shop', 'more'] },
};

const TAB_META: Record<Exclude<TabName, 'index' | 'more'>, { key: TranslationKey; title: string; icon: keyof typeof Ionicons.glyphMap; iconFilled: keyof typeof Ionicons.glyphMap }> = {
  shop: { key: 'tabCustomerHome', title: 'Store', icon: 'bag-outline', iconFilled: 'bag' },
  farm: { key: 'tabCrops', title: 'Crops', icon: 'leaf-outline', iconFilled: 'leaf' },
  records: { key: 'tabRecords', title: 'Accounts', icon: 'document-text-outline', iconFilled: 'document-text' },
  market: { key: 'tabMyAdvisor', title: 'My Advisor', icon: 'school-outline', iconFilled: 'school' },
  categories: { key: 'tabCategories', title: 'Categories', icon: 'grid-outline', iconFilled: 'grid' },
  cart: { key: 'tabCart', title: 'Cart', icon: 'cart-outline', iconFilled: 'cart' },
  orders: { key: 'tabOrders', title: 'Orders', icon: 'receipt-outline', iconFilled: 'receipt' },
  farmers: { key: 'tabFarms', title: 'Farms', icon: 'leaf-outline', iconFilled: 'leaf' },
  schedule: { key: 'tabSchedule', title: 'Schedule', icon: 'calendar-outline', iconFilled: 'calendar' },
  chat: { key: 'tabChat', title: 'Chat', icon: 'chatbubble-outline', iconFilled: 'chatbubble' },
  referrals: { key: 'tabReferrals', title: 'Referrals', icon: 'people-outline', iconFilled: 'people' },
  wallet: { key: 'tabMyBusiness', title: 'My Business', icon: 'wallet-outline', iconFilled: 'wallet' },
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
};

const ALL_TABS: TabName[] = [
  'index', 'shop', 'farm', 'records', 'market',
  'categories', 'cart', 'orders',
  'farmers', 'schedule', 'chat',
  'referrals', 'wallet',
  'admin-orders', 'admin-products',
  'super-users', 'super-coupons', 'super-accounts', 'super-settings',
  'super-orders', 'super-audit-log', 'super-crop-edit',
  'operator-orders',
  'more',
];

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768; // Desktop breakpoint

  const { role } = useRole();
  const { t, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const config = ROLE_TABS[role];
  const visible = new Set(config.tabs);

  const isChatCapable = !!user && CHAT_CAPABLE_ROLES.has(user.role);
  useGlobalChatUnreadSync(isChatCapable);
  const { data: chatUnreadData } = useChatUnreadCount(isChatCapable);
  const hasUnreadChat = (chatUnreadData?.count ?? 0) > 0;
  const { itemCount: cartItemCount } = useCart();

  const getHomeTitle = (userRole: UserRole): string => {
    switch (userRole) {
      case 'FARMER': return t('tabFarmerHome', 'Kisaan Home');
      case 'GARDENER': return t('tabGardenerHome', 'Gardener Home');
      case 'CUSTOMER': return t('tabCustomerHome', 'Store');
      case 'FARM_ADVISOR':
      case 'GARDEN_ADVISOR': return t('tabAdvisorHome', 'Advisor Home');
      case 'BUSINESS_PARTNER': return t('tabPartnerHome', 'Partner Home');
      case 'ADMIN': return t('tabAdminHome', 'Admin Home');
      case 'SUPER_ADMIN': return t('tabSuperAdminHome', 'Super Admin');
      case 'OPERATOR': return t('tabOperatorHome', 'Operator Home');
      default: return t('tabHome', 'Home');
    }
  };

  const getTabTitle = (name: TabName): string => {
    if (name === 'index') return getHomeTitle(role);
    if (name === 'more') return role === 'CUSTOMER' ? t('tabSettings', 'Settings') : t('tabMore', 'More');
    if (name === 'farmers') return role === 'GARDEN_ADVISOR' ? t('tabGardens', 'Gardens') : t('tabFarmers', 'Farmers');
    if (name === 'shop' && (role === 'ADMIN' || role === 'SUPER_ADMIN')) return 'AgriStore';
    const meta = TAB_META[name];
    return meta ? t(meta.key, meta.title) : name;
  };

  const getTabIcon = (name: TabName, focused: boolean): keyof typeof Ionicons.glyphMap => {
    if (name === 'index') return focused ? 'home' : 'home-outline';
    if (name === 'more') return focused ? 'grid' : 'grid-outline';
    if (name === 'farmers') return focused ? 'leaf' : 'leaf-outline';
    const meta = TAB_META[name];
    return meta ? (focused ? meta.iconFilled : meta.icon) : 'square-outline';
  };

  const handleNavigate = (tabName: TabName) => {
    if (tabName === 'index') {
      router.push('/(tabs)');
    } else {
      router.push(`/(tabs)/${tabName}` as any);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* 💻 DESKTOP TOP NAVIGATION HEADER MENU (Visible on screens >= 768px) */}
      {isDesktop && (
        <View style={desktopStyles.headerBar}>
          <View style={desktopStyles.headerLeft}>
            <TouchableOpacity style={desktopStyles.brandLogoBox} activeOpacity={0.8} onPress={() => router.push('/(tabs)')}>
              <BrandLogo size={36} useFastBundledOnly={true} />
              <Text style={desktopStyles.brandTitle}>FarmsKing</Text>
            </TouchableOpacity>
          </View>

          {/* Desktop Links Menu */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={desktopStyles.menuNavRow}>
            {config.tabs.map((tabName) => {
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
                  <Ionicons name={iconName} size={17} color={isActive ? '#38bdf8' : '#94a3b8'} />
                  <Text style={[desktopStyles.navMenuItemText, isActive && desktopStyles.navMenuItemTextActive]}>
                    {title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Right Header Actions */}
          <View style={desktopStyles.headerRight}>
            <TouchableOpacity style={desktopStyles.headerActionBtn} onPress={() => router.push('/crop-intelligence')}>
              <Ionicons name="analytics" size={18} color="#38bdf8" />
              <Text style={desktopStyles.headerActionBtnText}>Crop Engine</Text>
            </TouchableOpacity>

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

      {/* 📱 TABS VIEW CONTAINER (Bottom tabs hide on Desktop, show on Mobile) */}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: theme.primary,
            tabBarInactiveTintColor: '#94a3b8',
            tabBarLabelStyle: { fontFamily: FONT.bold, fontSize: 10.5 },
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarBackground: TabBarBackground,
            tabBarStyle: Platform.select({
              ios: {
                position: 'absolute',
                display: isDesktop ? 'none' : 'flex',
              },
              default: {
                display: isDesktop ? 'none' : 'flex',
                height: 62,
                paddingBottom: 8,
                paddingTop: 6,
                maxWidth: 520,
                width: '100%',
                alignSelf: 'center',
                backgroundColor: '#ffffff',
                borderTopWidth: 0,
                ...premiumShadow('#0f172a', 'sm'),
              },
            }),
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
                    title: role === 'CUSTOMER' ? t('tabSettings', 'Settings') : t('tabMore', 'More'),
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
                      <Ionicons size={23} name={focused ? 'leaf' : 'leaf-outline'} color={color} />
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

          {/* Hidden tool screens — accessed via More tab and Dashboard shortcuts */}
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
        </Tabs>
      </View>
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
  brandTitle: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  menuNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  navMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: 'transparent',
  },
  navMenuItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  navMenuItemText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  navMenuItemTextActive: {
    color: '#ffffff',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  langBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  langBtnActive: {
    backgroundColor: '#ffffff',
  },
  langBtnText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  langBtnTextActive: {
    color: '#0f172a',
  },
});
