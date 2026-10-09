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
import { GlobalCommandSearchModal } from '@/components/GlobalCommandSearchModal';
import { AdminLiveToastNotification } from '@/components/AdminLiveToastNotification';

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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768; // Desktop breakpoint

  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({
    EXECUTIVE: true,
    ECOMMERCE: true,
    FARMER_HUB: true,
    GARDENER_HUB: true,
    STAFF_HUB: true,
    SYSTEM: true,
  });

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  React.useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true);
    if (typeof window !== 'undefined') {
      window.addEventListener('open-command-search', handleOpenSearch);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('open-command-search', handleOpenSearch);
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

                const renderAccordionGroup = (
                  groupKey: string,
                  groupTitle: string,
                  groupIcon: keyof typeof Ionicons.glyphMap,
                  countBadge: string,
                  childrenItems: React.ReactNode
                ) => {
                  const isOpen = openGroups[groupKey] ?? true;
                  return (
                    <View key={groupKey} style={desktopStyles.accordionGroupContainer}>
                      <TouchableOpacity
                        style={[
                          desktopStyles.accordionGroupHeader,
                          isOpen && desktopStyles.accordionGroupHeaderOpen
                        ]}
                        activeOpacity={0.8}
                        onPress={() => toggleGroup(groupKey)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                          <Ionicons name={groupIcon} size={16} color="#00ff87" />
                          <Text style={[desktopStyles.accordionGroupTitle, isOpen && { color: '#00ff87' }]} numberOfLines={1}>
                            {groupTitle}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          {countBadge ? (
                            <View style={desktopStyles.accordionBadge}>
                              <Text style={desktopStyles.accordionBadgeText}>{countBadge}</Text>
                            </View>
                          ) : null}
                          <Ionicons
                            name={isOpen ? 'chevron-down' : 'chevron-forward'}
                            size={14}
                            color={isOpen ? '#00ff87' : '#94a3b8'}
                          />
                        </View>
                      </TouchableOpacity>
                      {isOpen ? (
                        <View style={desktopStyles.accordionSubMenuWrapper}>
                          {childrenItems}
                        </View>
                      ) : null}
                    </View>
                  );
                };

                return (
                  <View style={{ gap: 12 }}>
                    {renderAccordionGroup(
                      'EXECUTIVE',
                      'EXECUTIVE DASHBOARD',
                      'pulse',
                      '2 Apps',
                      <>
                        {renderItem('Overview', 'home', '/admin/(tabs)')}
                        {renderItem('Global Wallet & Ledger', 'wallet', '/admin/(tabs)/super-accounts')}
                      </>
                    )}

                    {renderAccordionGroup(
                      'ECOMMERCE',
                      'E-COMMERCE & MARKETPLACE',
                      'bag-handle',
                      '6 Tools',
                      <>
                        {renderItem('Products Catalog', 'cube', '/admin/(tabs)/admin-products')}
                        {renderItem('Store Orders', 'receipt', '/admin/(tabs)/admin-orders')}
                        {renderItem('Seller KYC Approvals', 'shield-checkmark', '/admin-sellers')}
                        {renderItem('Seller Payouts', 'cash', '/seller-payouts')}
                        {renderItem('Coupons & VIP Passes', 'ticket', '/admin/(tabs)/super-coupons')}
                        {renderItem('Sales Analytics', 'bar-chart', '/admin/(tabs)/super-orders')}
                      </>
                    )}

                    {renderAccordionGroup(
                      'FARMER_HUB',
                      'FARMER & CROP DOCTOR HUB',
                      'leaf',
                      '4 Hubs',
                      <>
                        {renderItem('Farmers Directory', 'leaf', '/admin/(tabs)/super-users', { group: 'CLIENTS', filter: 'FARMER' })}
                        {renderItem('Crop Doctors (Farmers Only)', 'medical', '/admin/(tabs)/super-users', { group: 'PARTNERS', filter: 'FARM_ADVISOR' })}
                        {renderItem('AI Disease Scanner', 'scan', '/admin/(tabs)/crop-disease-scanner')}
                        {renderItem('Crop Master Data', 'create', '/admin/(tabs)/super-crop-edit')}
                      </>
                    )}

                    {renderAccordionGroup(
                      'GARDENER_HUB',
                      'GARDENER & ADVISOR HUB',
                      'flower',
                      '3 Hubs',
                      <>
                        {renderItem('Gardeners Directory', 'flower', '/admin/(tabs)/super-users', { group: 'CLIENTS', filter: 'GARDENER' })}
                        {renderItem('Garden Advisors (Gardeners Only)', 'sunny', '/admin/(tabs)/super-users', { group: 'PARTNERS', filter: 'GARDEN_ADVISOR' })}
                        {renderItem('Plant Care Doses', 'nutrition', '/dose')}
                      </>
                    )}

                    {renderAccordionGroup(
                      'STAFF_HUB',
                      'STAFF & USER MANAGEMENT',
                      'people',
                      '4 Roles',
                      <>
                        {renderItem('Technical Trainers', 'school', '/admin/(tabs)/trainer-dashboard')}
                        {renderItem('Operators & Fulfillment', 'print', '/admin/(tabs)/operator-orders')}
                        {renderItem('Market Managers', 'briefcase', '/admin/(tabs)/super-users', { group: 'PARTNERS', filter: 'MARKET_MANAGER' })}
                        {renderItem('All Users & Roles', 'people', '/admin/(tabs)/super-users')}
                      </>
                    )}

                    {renderAccordionGroup(
                      'SYSTEM',
                      'SYSTEM & C-PANEL',
                      'options',
                      '2 Logs',
                      <>
                        {renderItem('C-Panel Settings', 'options', '/admin/(tabs)/super-settings')}
                        {renderItem('System Audit Log', 'time', '/admin/(tabs)/super-audit-log')}
                      </>
                    )}
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
        {/* 💻 TOP WORKSPACE SUB-TABS HEADER BAR (Visible on Desktop for Admins) */}
        {isDesktop && (role === 'SUPER_ADMIN' || role === 'ADMIN') && (
          <View style={desktopStyles.topTabsHeaderBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={desktopStyles.topTabsScrollContent}>
              {(() => {
                // Determine ecosystem context & sub-tabs based on current route
                let subTabs: { title: string; icon: keyof typeof Ionicons.glyphMap; path: string; params?: any }[] = [];
                let ecosystemTitle = 'EXECUTIVE WORKSPACE';

                if (pathname.includes('admin-products') || pathname.includes('admin-orders') || pathname.includes('admin-sellers') || pathname.includes('seller-payouts') || pathname.includes('super-coupons') || pathname.includes('super-orders')) {
                  ecosystemTitle = '🛒 E-COMMERCE SUITE';
                  subTabs = [
                    { title: 'Products Catalog', icon: 'cube', path: '/admin/(tabs)/admin-products' },
                    { title: 'Store Orders', icon: 'receipt', path: '/admin/(tabs)/admin-orders' },
                    { title: 'Seller KYC Approvals', icon: 'shield-checkmark', path: '/admin-sellers' },
                    { title: 'Seller Payouts', icon: 'cash', path: '/seller-payouts' },
                    { title: 'Coupons & VIP Passes', icon: 'ticket', path: '/admin/(tabs)/super-coupons' },
                    { title: 'Sales Analytics', icon: 'bar-chart', path: '/admin/(tabs)/super-orders' },
                  ];
                } else if (pathname.includes('crop-disease-scanner') || pathname.includes('super-crop-edit') || (pathname.includes('super-users') && (pathname.includes('FARMER') || pathname.includes('FARM_ADVISOR')))) {
                  ecosystemTitle = '🌾 FARMER & CROP DOCTOR SUITE';
                  subTabs = [
                    { title: 'Farmers Directory', icon: 'leaf', path: '/admin/(tabs)/super-users', params: { group: 'CLIENTS', filter: 'FARMER' } },
                    { title: 'Crop Doctors (Farmer Only)', icon: 'medical', path: '/admin/(tabs)/super-users', params: { group: 'PARTNERS', filter: 'FARM_ADVISOR' } },
                    { title: 'AI Disease Diagnostic Scanner', icon: 'scan', path: '/admin/(tabs)/crop-disease-scanner' },
                    { title: 'Crop Master Data', icon: 'create', path: '/admin/(tabs)/super-crop-edit' },
                  ];
                } else if (pathname.includes('dose') || (pathname.includes('super-users') && (pathname.includes('GARDENER') || pathname.includes('GARDEN_ADVISOR')))) {
                  ecosystemTitle = '🪴 GARDENER & ADVISOR SUITE';
                  subTabs = [
                    { title: 'Gardeners Directory', icon: 'flower', path: '/admin/(tabs)/super-users', params: { group: 'CLIENTS', filter: 'GARDENER' } },
                    { title: 'Garden Advisors (Gardener Only)', icon: 'sunny', path: '/admin/(tabs)/super-users', params: { group: 'PARTNERS', filter: 'GARDEN_ADVISOR' } },
                    { title: 'Plant Care Doses & Protocols', icon: 'nutrition', path: '/dose' },
                  ];
                } else if (pathname.includes('trainer-dashboard') || pathname.includes('operator-orders') || (pathname.includes('super-users') && pathname.includes('MARKET_MANAGER'))) {
                  ecosystemTitle = '👥 STAFF & FIELD OPERATIONS';
                  subTabs = [
                    { title: 'Technical Trainers', icon: 'school', path: '/admin/(tabs)/trainer-dashboard' },
                    { title: 'Operators & Fulfillment', icon: 'print', path: '/admin/(tabs)/operator-orders' },
                    { title: 'Market Managers', icon: 'briefcase', path: '/admin/(tabs)/super-users', params: { group: 'PARTNERS', filter: 'MARKET_MANAGER' } },
                    { title: 'All System Users', icon: 'people', path: '/admin/(tabs)/super-users' },
                  ];
                } else if (pathname.includes('super-settings') || pathname.includes('super-audit-log')) {
                  ecosystemTitle = '⚙️ SYSTEM SECURITY & C-PANEL';
                  subTabs = [
                    { title: 'C-Panel Settings', icon: 'options', path: '/admin/(tabs)/super-settings' },
                    { title: 'System Audit Log', icon: 'time', path: '/admin/(tabs)/super-audit-log' },
                  ];
                } else {
                  ecosystemTitle = '📊 EXECUTIVE COMMAND CENTER';
                  subTabs = [
                    { title: 'Platform Overview', icon: 'home', path: '/admin/(tabs)' },
                    { title: 'Global Wallet & Ledger', icon: 'wallet', path: '/admin/(tabs)/super-accounts' },
                  ];
                }

                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Text style={desktopStyles.topEcosystemLabel}>{ecosystemTitle}</Text>
                      <View style={{ width: 1, height: 20, backgroundColor: 'rgba(0,255,135,0.2)' }} />
                      {subTabs.map((tab) => {
                        const isIndexActive = tab.path === '/admin/(tabs)' && (pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index');
                        const isOtherActive = tab.path !== '/admin/(tabs)' && pathname.includes(tab.path.split('/').pop() || '');
                        const isActive = isIndexActive || isOtherActive;

                        return (
                          <TouchableOpacity
                            key={tab.title}
                            style={[desktopStyles.topSubTabPill, isActive && !tab.params && desktopStyles.topSubTabPillActive]}
                            onPress={() => router.push(tab.params ? { pathname: tab.path as any, params: tab.params } : (tab.path as any))}
                          >
                            <Ionicons name={tab.icon} size={15} color={isActive && !tab.params ? '#020d06' : '#00ff87'} />
                            <Text style={[desktopStyles.topSubTabPillText, isActive && !tab.params && desktopStyles.topSubTabPillTextActive]}>
                              {tab.title}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Spotlight Command Search Trigger Button */}
                    <TouchableOpacity
                      style={desktopStyles.spotlightTriggerBtn}
                      onPress={() => setIsSearchOpen(true)}
                    >
                      <Ionicons name="search" size={14} color="#00ff87" />
                      <Text style={desktopStyles.spotlightTriggerText}>Quick Search...</Text>
                      <View style={desktopStyles.kbdBadge}>
                        <Text style={desktopStyles.kbdText}>Ctrl K</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })()}
            </ScrollView>
          </View>
        )}

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

        {/* 🌟 SUPER PREMIUM MODALS & TOAST NOTIFICATIONS */}
        <GlobalCommandSearchModal visible={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        <AdminLiveToastNotification />

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
  accordionGroupContainer: {
    marginBottom: 6,
  },
  accordionGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
  },
  accordionGroupHeaderOpen: {
    backgroundColor: 'rgba(6, 36, 19, 0.95)',
    borderColor: 'rgba(0, 255, 135, 0.45)',
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  accordionGroupTitle: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.4,
    flex: 1,
  },
  accordionBadge: {
    backgroundColor: 'rgba(0, 255, 135, 0.18)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.4)',
  },
  accordionBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
  },
  accordionSubMenuWrapper: {
    marginTop: 6,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(0, 255, 135, 0.25)',
    marginLeft: 10,
    gap: 2,
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
  topTabsHeaderBar: {
    backgroundColor: '#03140a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 135, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    zIndex: 90,
    ...premiumShadow('#000000', 'sm') as any,
  },
  topTabsScrollContent: {
    alignItems: 'center',
    paddingRight: 24,
  },
  topEcosystemLabel: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
    letterSpacing: 0.8,
  },
  topSubTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  topSubTabPillActive: {
    backgroundColor: '#00ff87',
    borderColor: '#00ff87',
    ...premiumShadow('#00ff87', 'md') as any,
  },
  topSubTabPillText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#34d399',
  },
  topSubTabPillTextActive: {
    color: '#020d06',
    fontFamily: FONT.extraBold,
  },
  spotlightTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    marginLeft: 16,
  },
  spotlightTriggerText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  kbdBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  kbdText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
});
