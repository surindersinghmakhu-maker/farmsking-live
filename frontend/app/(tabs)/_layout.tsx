import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { RoleThemes, UserRole } from '@/constants/Colors';
import { FONT, premiumShadow } from '@/constants/theme';
import { useRole } from '@/src/store/role-context';
import { useAuth } from '@/src/store/auth-context';
import { useLanguage } from '@/src/store/language-context';
import { useMyAdvisor } from '@/src/hooks/useAdvisorAssignments';
import { useFarmerProfileStatus } from '@/src/hooks/useFarmerProfile';
import { useChatUnreadCount, useGlobalChatUnreadSync } from '@/src/hooks/useChat';
import { TranslationKey } from '@/src/constants/translations';
import { useCart } from '@/src/store/cart-context';

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
  | 'index' | 'farm' | 'records' | 'market' | 'more'
  | 'categories' | 'cart' | 'orders'
  | 'farmers' | 'schedule' | 'chat'
  | 'referrals' | 'wallet'
  | 'admin-orders' | 'admin-products'
  | 'super-users' | 'super-coupons' | 'super-accounts' | 'super-settings'
  | 'super-orders' | 'super-audit-log' | 'super-crop-edit'
  | 'operator-orders';

const ROLE_TABS: Record<UserRole, { tabs: TabName[] }> = {
  FARMER: { tabs: ['index', 'farm', 'records', 'market', 'more'] },
  GARDENER: { tabs: ['index', 'farm', 'records', 'market', 'more'] },
  CUSTOMER: { tabs: ['index', 'categories', 'cart', 'orders', 'more'] },
  FARM_ADVISOR: { tabs: ['index', 'farmers', 'schedule', 'chat', 'more'] },
  GARDEN_ADVISOR: { tabs: ['index', 'farmers', 'schedule', 'chat', 'more'] },
  BUSINESS_PARTNER: { tabs: ['index', 'referrals', 'wallet', 'more'] },
  ADMIN: { tabs: ['index', 'super-users', 'super-coupons', 'super-accounts', 'admin-orders', 'more'] },
  SUPER_ADMIN: { tabs: ['index', 'super-users', 'super-coupons', 'super-accounts', 'more'] },
  OPERATOR: { tabs: ['index', 'operator-orders', 'more'] },
};

const TAB_META: Record<Exclude<TabName, 'index' | 'more'>, { key: TranslationKey; title: string; icon: keyof typeof Ionicons.glyphMap; iconFilled: keyof typeof Ionicons.glyphMap }> = {
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
  'super-coupons': { key: 'tabCoupons', title: 'Coupons', icon: 'pricetag-outline', iconFilled: 'pricetag' },
  'super-accounts': { key: 'tabAccounts', title: 'Accounts', icon: 'wallet-outline', iconFilled: 'wallet' },
  'super-settings': { key: 'tabSettings', title: 'Settings', icon: 'settings-outline', iconFilled: 'settings' },
  'super-orders': { key: 'superSaleManagement', title: 'Sale / Order Management', icon: 'receipt-outline', iconFilled: 'receipt' },
  'super-audit-log': { key: 'superAuditLog', title: 'Audit Log', icon: 'time-outline', iconFilled: 'time' },
  'super-crop-edit': { key: 'tabCrops', title: 'Edit Crop', icon: 'leaf-outline', iconFilled: 'leaf' },
  'operator-orders': { key: 'tabFulfillment', title: 'Fulfillment', icon: 'cube-outline', iconFilled: 'cube' },
};

const ALL_TABS: TabName[] = [
  'index', 'farm', 'records', 'market',
  'categories', 'cart', 'orders',
  'farmers', 'schedule', 'chat',
  'referrals', 'wallet',
  'admin-orders', 'admin-products',
  'super-users', 'super-coupons', 'super-accounts', 'super-settings',
  'super-orders', 'super-audit-log', 'super-crop-edit',
  'operator-orders',
  'more',
];

function useFarmerProfileCompletionGate() {
  const router = useRouter();
  const { user } = useAuth();
  const isFarmer = user?.role === 'FARMER';

  const { data: advisorAssignment } = useMyAdvisor();
  const { data: profileStatus } = useFarmerProfileStatus(isFarmer);

  const hasPrompted = useRef(false);

  useEffect(() => {
    if (!isFarmer || hasPrompted.current) return;
    if (advisorAssignment?.status === 'ACTIVE' && profileStatus && !profileStatus.profileComplete) {
      hasPrompted.current = true;
      router.push('/farmer-profile-setup' as never);
    }
  }, [isFarmer, advisorAssignment, profileStatus, router]);
}

export default function TabLayout() {
  const { role } = useRole();
  const { t } = useLanguage();
  const { user } = useAuth();
  const config = ROLE_TABS[role];
  const visible = new Set(config.tabs);

  useFarmerProfileCompletionGate();

  const isChatCapable = !!user && CHAT_CAPABLE_ROLES.has(user.role);
  useGlobalChatUnreadSync(isChatCapable);
  const { data: chatUnreadData } = useChatUnreadCount(isChatCapable);
  const hasUnreadChat = (chatUnreadData?.count ?? 0) > 0;
  const { itemCount: cartItemCount } = useCart();

  const getHomeTitle = (userRole: UserRole): string => {
    switch (userRole) {
      case 'FARMER': return t('tabFarmerHome', 'Kisaan Home');
      case 'GARDENER': return t('tabGardenerHome', 'Gardener Home');
      case 'CUSTOMER': return t('tabCustomerHome', 'Customer Home');
      case 'FARM_ADVISOR':
      case 'GARDEN_ADVISOR': return t('tabAdvisorHome', 'Advisor Home');
      case 'BUSINESS_PARTNER': return t('tabPartnerHome', 'Partner Home');
      case 'ADMIN': return t('tabAdminHome', 'Admin Home');
      case 'SUPER_ADMIN': return t('tabSuperAdminHome', 'Super Admin');
      case 'OPERATOR': return t('tabOperatorHome', 'Operator Home');
      default: return t('tabHome', 'Home');
    }
  };

  return (
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
          },
          default: {
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
    </Tabs>
  );
}
