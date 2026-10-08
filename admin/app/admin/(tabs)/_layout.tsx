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
  SUPER_ADMIN: { tabs: ['index', 'admin_shop', 'super-users', 'super-accounts', 'admin_more'] },
  ADMIN: { tabs: ['index', 'admin_shop', 'super-users', 'super-accounts', 'admin_more'] },
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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768; // Desktop breakpoint

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

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc', flexDirection: isDesktop ? 'row' : 'column' }}>
      {/* 💻 DESKTOP PREMIUM SIDEBAR (Visible on screens >= 768px) */}
      {isDesktop && (
        <View style={desktopStyles.sidebar}>
          <View style={desktopStyles.brandLogoBox}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#00ff87', alignItems: 'center', justifyContent: 'center' }}>
              <BrandLogo size={24} iconColor="#020d06" />
            </View>
            <Text style={desktopStyles.brandTitle}>FarmsKing <Text style={{ fontSize: 10, color: '#00ff87', backgroundColor: 'rgba(0,255,135,0.2)', paddingHorizontal: 4 }}>4D</Text></Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={desktopStyles.menuNavCol}>
            {(() => {
              // Custom Flowchart structure for SUPER_ADMIN & ADMIN
              if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
                const renderItem = (title: string, iconName: keyof typeof Ionicons.glyphMap, path: string, params?: any) => {
                  // If it's a specific super-users route with a filter, check if active
                  const isSuperUsersLink = path.includes('super-users');
                  // We just highlight if we are broadly on super-users, or we could just skip perfect highlighting for deep links.
                  // For simplicity, highlight if path matches exactly or loosely
                  const isIndexActive = path === '/admin/(tabs)' && (pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index');
                  const isOtherActive = path !== '/admin/(tabs)' && pathname.includes(path.split('/').pop() || '');
                  const isActive = isIndexActive || isOtherActive;
                  
                  return (
                    <TouchableOpacity
                      key={title}
                      style={[desktopStyles.navMenuItem, isActive && !params && desktopStyles.navMenuItemActive]}
                      onPress={() => router.push(params ? { pathname: path as any, params } : (path as any))}
                    >
                      <View style={[desktopStyles.navIconWrap, isActive && !params && desktopStyles.navIconWrapActive]}>
                        <Ionicons name={iconName} size={16} color={isActive && !params ? '#020d06' : '#34d399'} />
                      </View>
                      <Text style={[desktopStyles.navMenuItemText, isActive && !params && desktopStyles.navMenuItemTextActive]}>
                        {title}
                      </Text>
                    </TouchableOpacity>
                  );
                };

                return (
                  <View style={{ gap: 16 }}>
                    <View>
                      <Text style={desktopStyles.sectionLabel}>DASHBOARD</Text>
                      {renderItem('Overview', 'home', '/admin/(tabs)')}
                      {renderItem('E-Commerce Hub', 'storefront', '/admin/(tabs)/admin_shop')}
                      {renderItem('Global Wallet', 'wallet', '/admin/(tabs)/super-accounts')}
                    </View>
                    
                    <View>
                      <Text style={desktopStyles.sectionLabel}>ADMIN APP USERS</Text>
                      {renderItem('Super Admins', 'shield-half', '/admin/(tabs)/super-users', { group: 'ADMINS', filter: 'SUPER_ADMIN' })}
                      {renderItem('Admins', 'shield-checkmark', '/admin/(tabs)/super-users', { group: 'ADMINS', filter: 'ADMIN' })}
                      {renderItem('Operators', 'print', '/admin/(tabs)/super-users', { group: 'ADMINS', filter: 'OPERATOR' })}
                      {renderItem('Technical Trainers', 'school', '/admin/(tabs)/super-users', { group: 'PARTNERS', filter: 'TECHNICAL_TRAINER' })}
                      {renderItem('Market Managers', 'briefcase', '/admin/(tabs)/super-users', { group: 'PARTNERS', filter: 'MARKET_MANAGER' })}
                    </View>

                    <View>
                      <Text style={desktopStyles.sectionLabel}>FRONTEND APP USERS</Text>
                      {renderItem('Farmers (Hero)', 'leaf', '/admin/(tabs)/super-users', { group: 'CLIENTS', filter: 'FARMER' })}
                      {renderItem('Crop Doctors', 'medical', '/admin/(tabs)/super-users', { group: 'PARTNERS', filter: 'FARM_ADVISOR' })}
                      {renderItem('Customers', 'cart', '/admin/(tabs)/super-users', { group: 'CLIENTS', filter: 'CUSTOMER' })}
                      {renderItem('Sellers', 'cube', '/admin/(tabs)/super-users', { group: 'CLIENTS', filter: 'SELLER' })}
                      {renderItem('Gardeners', 'flower', '/admin/(tabs)/super-users', { group: 'CLIENTS', filter: 'GARDENER' })}
                      {renderItem('Garden Advisors', 'sunny', '/admin/(tabs)/super-users', { group: 'PARTNERS', filter: 'GARDEN_ADVISOR' })}
                    </View>
                  </View>
                );
              }

              // Default standard tabs mapping for other roles
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
                      <Ionicons name={iconName} size={18} color={isActive ? '#059669' : '#64748b'} />
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

      {/* 📱 TABS VIEW CONTAINER (Bottom tabs hide on Desktop, show on Mobile) */}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: colors.tabBarActive,
            tabBarInactiveTintColor: colors.tabBarInactive,
            tabBarLabelStyle: { fontFamily: FONT.bold, fontSize: 10.5 },
            headerShown: false,
            tabBarButton: (props: any) => <HapticTab {...props} />,
            tabBarBackground: TabBarBackground,
            tabBarStyle: Platform.select({
              ios: {
                position: 'absolute',
                display: isDesktop ? 'none' : 'flex',
                backgroundColor: colors.tabBarBg,
                borderTopColor: colors.tabBarBorder,
              },
              default: {
                display: isDesktop ? 'none' : 'flex',
                height: 62,
                paddingBottom: 8,
                paddingTop: 6,
                maxWidth: 520,
                width: '100%',
                alignSelf: 'center',
                backgroundColor: colors.tabBarBg,
                borderTopWidth: 1,
                borderTopColor: colors.tabBarBorder,
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
        </Tabs>

      </View>
    </View>
  );
}

const desktopStyles = StyleSheet.create({
  sidebar: {
    width: 250,
    backgroundColor: '#04180d',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 255, 135, 0.22)',
    paddingVertical: 20,
    ...premiumShadow('#000000', 'md') as any,
    zIndex: 99,
  },
  brandLogoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  brandTitle: {
    fontSize: 22,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  menuNavCol: {
    paddingHorizontal: 12,
    gap: 6,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    color: 'rgba(52, 211, 153, 0.8)',
    letterSpacing: 0.5,
    marginLeft: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  navMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: 'transparent',
  },
  navMenuItemActive: {
    backgroundColor: '#00ff87',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.5)',
    ...premiumShadow('#00ff87', 'md') as any,
  },
  navIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: {
    backgroundColor: 'transparent',
  },
  navMenuItemText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
  },
  navMenuItemTextActive: {
    color: '#020d06',
    fontFamily: FONT.extraBold,
  },
  sidebarBottom: {
    paddingHorizontal: 20,
    marginTop: 'auto',
    paddingTop: 20,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,255,135,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.3)',
  },
  langSwitcherBox: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.2)',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  langBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
  },
  langBtnActive: {
    backgroundColor: '#ffffff',
    ...premiumShadow('#cbd5e1', 'sm') as any,
  },
  langBtnText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  langBtnTextActive: {
    color: '#0f172a',
  },
});
