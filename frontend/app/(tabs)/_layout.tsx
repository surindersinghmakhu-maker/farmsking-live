import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { RoleThemes, UserRole } from '@/constants/Colors';
import { FONT, premiumShadow } from '@/constants/theme';
import { useRole } from '@/src/store/role-context';

import { Ionicons } from '@expo/vector-icons';

const theme = RoleThemes.FARMER;

type TabName =
  | 'index' | 'farm' | 'records' | 'market' | 'more'
  | 'categories' | 'cart' | 'orders'
  | 'farmers' | 'schedule' | 'chat'
  | 'referrals' | 'wallet'
  | 'admin-orders' | 'admin-products' | 'admin-users';

/** Which tabs are visible, in order, per role. The Home tab's label comes from RoleThemes[role].name. */
const ROLE_TABS: Record<UserRole, { tabs: TabName[] }> = {
  FARMER: { tabs: ['index', 'farm', 'records', 'market', 'more'] },
  GARDENER: { tabs: ['index', 'farm', 'records', 'market', 'more'] },
  CUSTOMER: { tabs: ['index', 'categories', 'cart', 'orders', 'more'] },
  FARM_ADVISOR: { tabs: ['index', 'farmers', 'schedule', 'chat', 'more'] },
  GARDEN_ADVISOR: { tabs: ['index', 'farmers', 'schedule', 'chat', 'more'] },
  BUSINESS_PARTNER: { tabs: ['index', 'referrals', 'wallet', 'more'] },
  ADMIN: { tabs: ['index', 'admin-orders', 'admin-products', 'admin-users', 'more'] },
};

const TAB_META: Record<Exclude<TabName, 'index' | 'more'>, { title: string; icon: keyof typeof Ionicons.glyphMap; iconFilled: keyof typeof Ionicons.glyphMap }> = {
  farm: { title: 'Crops', icon: 'leaf-outline', iconFilled: 'leaf' },
  records: { title: 'Records', icon: 'document-text-outline', iconFilled: 'document-text' },
  market: { title: 'My Advisor', icon: 'school-outline', iconFilled: 'school' },
  categories: { title: 'Categories', icon: 'grid-outline', iconFilled: 'grid' },
  cart: { title: 'Cart', icon: 'cart-outline', iconFilled: 'cart' },
  orders: { title: 'Orders', icon: 'receipt-outline', iconFilled: 'receipt' },
  farmers: { title: 'Farmers', icon: 'people-outline', iconFilled: 'people' },
  schedule: { title: 'Schedule', icon: 'calendar-outline', iconFilled: 'calendar' },
  chat: { title: 'Chat', icon: 'chatbubble-outline', iconFilled: 'chatbubble' },
  referrals: { title: 'Referrals', icon: 'people-outline', iconFilled: 'people' },
  wallet: { title: 'Wallet', icon: 'wallet-outline', iconFilled: 'wallet' },
  'admin-orders': { title: 'Orders', icon: 'receipt-outline', iconFilled: 'receipt' },
  'admin-products': { title: 'Products', icon: 'cube-outline', iconFilled: 'cube' },
  'admin-users': { title: 'Users', icon: 'people-outline', iconFilled: 'people' },
};

const ALL_TABS: TabName[] = [
  'index', 'farm', 'records', 'market',
  'categories', 'cart', 'orders',
  'farmers', 'schedule', 'chat',
  'referrals', 'wallet',
  'admin-orders', 'admin-products', 'admin-users',
  'more',
];

export default function TabLayout() {
  const { role } = useRole();
  const config = ROLE_TABS[role];
  const visible = new Set(config.tabs);

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
                title: RoleThemes[role].name,
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
                title: role === 'CUSTOMER' ? 'Account' : 'More',
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
                title: isGardenAdvisor ? 'Gardeners' : 'Farmers',
                href: isShown ? undefined : null,
                tabBarIcon: ({ color, focused }) => (
                  <Ionicons size={23} name={focused ? 'people' : 'people-outline'} color={color} />
                ),
              }}
            />
          );
        }
        const meta = TAB_META[name];
        return (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title: meta.title,
              href: isShown ? undefined : null,
              tabBarIcon: ({ color, focused }) => (
                <Ionicons size={23} name={focused ? meta.iconFilled : meta.icon} color={color} />
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
}
