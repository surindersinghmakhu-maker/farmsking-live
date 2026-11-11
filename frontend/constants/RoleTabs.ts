import { Ionicons } from '@expo/vector-icons';

export type TabName =
  | 'index'
  | 'shop'
  | 'ai-doctor'
  | 'admin_shop'
  | 'farm'
  | 'garden'
  | 'records'
  | 'market'
  | 'more'
  | 'admin_more'
  | 'categories'
  | 'cart'
  | 'orders'
  | 'farmers'
  | 'schedule'
  | 'chat'
  | 'referrals'
  | 'wallet'
  | 'admin-orders'
  | 'admin-products'
  | 'super-users'
  | 'super-coupons'
  | 'super-accounts'
  | 'super-settings'
  | 'super-orders'
  | 'super-audit-log'
  | 'super-crop-edit'
  | 'operator-orders'
  | 'trainer-dashboard';

export const ROLE_TABS: Record<string, { tabs: TabName[] }> = {
  FARMER: { tabs: ['index', 'farm', 'records', 'shop', 'more'] },
  GARDENER: { tabs: ['index', 'shop', 'garden', 'records', 'more'] },
  CUSTOMER: { tabs: ['shop', 'cart', 'wallet', 'more'] },
  ADVISOR: { tabs: ['index', 'shop', 'farmers', 'chat', 'wallet', 'more'] },
  FARM_ADVISOR: { tabs: ['index', 'shop', 'farmers', 'chat', 'wallet', 'more'] },
  GARDEN_ADVISOR: { tabs: ['index', 'shop', 'farmers', 'chat', 'wallet', 'more'] },
  AGENT: { tabs: ['index', 'shop', 'referrals', 'wallet', 'more'] },
  ADMIN: { tabs: ['index', 'admin_shop', 'super-users', 'super-accounts', 'admin_more'] },
  SUPER_ADMIN: { tabs: ['index', 'admin_shop', 'super-users', 'super-accounts', 'admin_more'] },
  MANAGER: { tabs: ['index', 'admin_shop', 'super-users', 'super-accounts', 'admin_more'] },
  SUPERVISOR: { tabs: ['index', 'farm', 'records', 'wallet', 'more'] },
  OPERATOR: { tabs: ['index', 'operator-orders', 'wallet', 'more'] },
  LABOUR: { tabs: ['index', 'wallet', 'more'] },
  TECHNICAL_TRAINER: { tabs: ['index', 'trainer-dashboard', 'shop', 'wallet', 'more'] },
};

export interface RoleTabItem {
  key: string;
  tabName: TabName;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
  path: string;
  color: string;
  glow: [string, string, string];
  laser: [string, string, string];
  border: string;
  shadow: string;
  isMore?: boolean;
}

export function getTabsForRole(role?: string | null): RoleTabItem[] {
  const roleKey = (role || 'FARMER').toUpperCase();
  const config = ROLE_TABS[roleKey] || ROLE_TABS.FARMER;

  return config.tabs.map((name) => {
    switch (name) {
      case 'index':
        return {
          key: 'index',
          tabName: 'index',
          label: 'Home',
          icon: 'home',
          iconOutline: 'home-outline',
          path: '/(user)/(tabs)',
          color: '#10b981',
          glow: ['rgba(16, 185, 129, 0.32)', 'rgba(5, 150, 105, 0.18)', 'rgba(16, 185, 129, 0.05)'],
          laser: ['#00ff87', '#10b981', '#059669'],
          border: 'rgba(16, 185, 129, 0.50)',
          shadow: '#10b981',
        };
      case 'farm':
        return {
          key: 'farm',
          tabName: 'farm',
          label: 'Crops',
          icon: 'leaf',
          iconOutline: 'leaf-outline',
          path: '/(user)/(tabs)/farm',
          color: '#10b981',
          glow: ['rgba(16, 185, 129, 0.32)', 'rgba(5, 150, 105, 0.18)', 'rgba(16, 185, 129, 0.05)'],
          laser: ['#00ff87', '#10b981', '#059669'],
          border: 'rgba(16, 185, 129, 0.50)',
          shadow: '#10b981',
        };
      case 'records':
        return {
          key: 'records',
          tabName: 'records',
          label: 'Accounts',
          icon: 'document-text',
          iconOutline: 'document-text-outline',
          path: '/(user)/(tabs)/records',
          color: '#38bdf8',
          glow: ['rgba(56, 189, 248, 0.32)', 'rgba(14, 165, 233, 0.18)', 'rgba(56, 189, 248, 0.05)'],
          laser: ['#38bdf8', '#0ea5e9', '#0284c7'],
          border: 'rgba(56, 189, 248, 0.50)',
          shadow: '#38bdf8',
        };
      case 'shop':
        return {
          key: 'shop',
          tabName: 'shop',
          label: roleKey === 'ADMIN' || roleKey === 'SUPER_ADMIN' ? 'E-Commerce' : 'Store',
          icon: 'bag',
          iconOutline: 'bag-outline',
          path: '/(user)/(tabs)/shop',
          color: '#f97316',
          glow: ['rgba(249, 115, 22, 0.32)', 'rgba(234, 88, 12, 0.18)', 'rgba(249, 115, 22, 0.05)'],
          laser: ['#fb923c', '#f97316', '#ea580c'],
          border: 'rgba(249, 115, 22, 0.50)',
          shadow: '#f97316',
        };
      case 'admin_shop':
        return {
          key: 'admin_shop',
          tabName: 'admin_shop',
          label: 'E-Commerce',
          icon: 'storefront',
          iconOutline: 'storefront-outline',
          path: '/(user)/(tabs)/admin_shop',
          color: '#059669',
          glow: ['rgba(5, 150, 105, 0.32)', 'rgba(4, 120, 87, 0.18)', 'rgba(5, 150, 105, 0.05)'],
          laser: ['#10b981', '#059669', '#047857'],
          border: 'rgba(5, 150, 105, 0.50)',
          shadow: '#059669',
        };
      case 'more':
      case 'admin_more':
        return {
          key: 'more',
          tabName: name,
          label: 'More',
          icon: 'grid',
          iconOutline: 'grid-outline',
          path: `/(user)/(tabs)/${name}`,
          isMore: true,
          color: '#a855f7',
          glow: ['rgba(168, 85, 247, 0.32)', 'rgba(126, 34, 206, 0.18)', 'rgba(168, 85, 247, 0.05)'],
          laser: ['#c084fc', '#a855f7', '#7e22ce'],
          border: 'rgba(168, 85, 247, 0.50)',
          shadow: '#a855f7',
        };
      case 'garden':
        return {
          key: 'garden',
          tabName: 'garden',
          label: 'Gardens',
          icon: 'flower',
          iconOutline: 'flower-outline',
          path: '/(user)/(tabs)/garden',
          color: '#e11d48',
          glow: ['rgba(225, 29, 72, 0.32)', 'rgba(190, 18, 60, 0.18)', 'rgba(225, 29, 72, 0.05)'],
          laser: ['#fb7185', '#e11d48', '#be123c'],
          border: 'rgba(225, 29, 72, 0.50)',
          shadow: '#e11d48',
        };
      case 'cart':
        return {
          key: 'cart',
          tabName: 'cart',
          label: 'Cart',
          icon: 'cart',
          iconOutline: 'cart-outline',
          path: '/(user)/(tabs)/cart',
          color: '#10b981',
          glow: ['rgba(16, 185, 129, 0.32)', 'rgba(5, 150, 105, 0.18)', 'rgba(16, 185, 129, 0.05)'],
          laser: ['#00ff87', '#10b981', '#059669'],
          border: 'rgba(16, 185, 129, 0.50)',
          shadow: '#10b981',
        };
      case 'wallet':
        return {
          key: 'wallet',
          tabName: 'wallet',
          label: 'Wallet',
          icon: 'wallet',
          iconOutline: 'wallet-outline',
          path: roleKey === 'AGENT' ? '/(partner)/(tabs)/wallet' : '/(user)/(tabs)/wallet',
          color: '#f59e0b',
          glow: ['rgba(245, 158, 11, 0.32)', 'rgba(217, 119, 6, 0.18)', 'rgba(245, 158, 11, 0.05)'],
          laser: ['#fbbf24', '#f59e0b', '#d97706'],
          border: 'rgba(245, 158, 11, 0.50)',
          shadow: '#f59e0b',
        };
      case 'farmers':
        return {
          key: 'farmers',
          tabName: 'farmers',
          label: roleKey === 'GARDEN_ADVISOR' ? 'Gardens' : 'Farmers',
          icon: 'leaf',
          iconOutline: 'leaf-outline',
          path: '/(user)/(tabs)/farmers',
          color: '#10b981',
          glow: ['rgba(16, 185, 129, 0.32)', 'rgba(5, 150, 105, 0.18)', 'rgba(16, 185, 129, 0.05)'],
          laser: ['#00ff87', '#10b981', '#059669'],
          border: 'rgba(16, 185, 129, 0.50)',
          shadow: '#10b981',
        };
      case 'chat':
        return {
          key: 'chat',
          tabName: 'chat',
          label: 'Chat',
          icon: 'chatbubble',
          iconOutline: 'chatbubble-outline',
          path: '/(user)/(tabs)/chat',
          color: '#38bdf8',
          glow: ['rgba(56, 189, 248, 0.32)', 'rgba(14, 165, 233, 0.18)', 'rgba(56, 189, 248, 0.05)'],
          laser: ['#38bdf8', '#0ea5e9', '#0284c7'],
          border: 'rgba(56, 189, 248, 0.50)',
          shadow: '#38bdf8',
        };
      case 'referrals':
        return {
          key: 'referrals',
          tabName: 'referrals',
          label: 'Referrals',
          icon: 'people',
          iconOutline: 'people-outline',
          path: '/(partner)/(tabs)/referrals',
          color: '#6366f1',
          glow: ['rgba(99, 102, 241, 0.32)', 'rgba(79, 70, 229, 0.18)', 'rgba(99, 102, 241, 0.05)'],
          laser: ['#818cf8', '#6366f1', '#4f46e5'],
          border: 'rgba(99, 102, 241, 0.50)',
          shadow: '#6366f1',
        };
      case 'super-users':
        return {
          key: 'super-users',
          tabName: 'super-users',
          label: 'Users',
          icon: 'people',
          iconOutline: 'people-outline',
          path: '/(user)/(tabs)/super-users',
          color: '#38bdf8',
          glow: ['rgba(56, 189, 248, 0.32)', 'rgba(14, 165, 233, 0.18)', 'rgba(56, 189, 248, 0.05)'],
          laser: ['#38bdf8', '#0ea5e9', '#0284c7'],
          border: 'rgba(56, 189, 248, 0.50)',
          shadow: '#38bdf8',
        };
      case 'super-accounts':
        return {
          key: 'super-accounts',
          tabName: 'super-accounts',
          label: 'Finance',
          icon: 'cash',
          iconOutline: 'cash-outline',
          path: '/(user)/(tabs)/super-accounts',
          color: '#10b981',
          glow: ['rgba(16, 185, 129, 0.32)', 'rgba(5, 150, 105, 0.18)', 'rgba(16, 185, 129, 0.05)'],
          laser: ['#00ff87', '#10b981', '#059669'],
          border: 'rgba(16, 185, 129, 0.50)',
          shadow: '#10b981',
        };
      case 'super-settings':
        return {
          key: 'super-settings',
          tabName: 'super-settings',
          label: 'C-Panel',
          icon: 'options',
          iconOutline: 'options-outline',
          path: '/(user)/(tabs)/super-settings',
          color: '#8b5cf6',
          glow: ['rgba(139, 92, 246, 0.32)', 'rgba(109, 40, 217, 0.18)', 'rgba(139, 92, 246, 0.05)'],
          laser: ['#a78bfa', '#8b5cf6', '#6d28d9'],
          border: 'rgba(139, 92, 246, 0.50)',
          shadow: '#8b5cf6',
        };
      case 'operator-orders':
        return {
          key: 'operator-orders',
          tabName: 'operator-orders',
          label: 'Fulfillment',
          icon: 'cube',
          iconOutline: 'cube-outline',
          path: '/(user)/(tabs)/operator-orders',
          color: '#0284c7',
          glow: ['rgba(2, 132, 199, 0.32)', 'rgba(3, 105, 161, 0.18)', 'rgba(2, 132, 199, 0.05)'],
          laser: ['#38bdf8', '#0284c7', '#0369a1'],
          border: 'rgba(2, 132, 199, 0.50)',
          shadow: '#0284c7',
        };
      case 'trainer-dashboard':
        return {
          key: 'trainer-dashboard',
          tabName: 'trainer-dashboard',
          label: 'Trainer',
          icon: 'school',
          iconOutline: 'school-outline',
          path: '/(user)/(tabs)/trainer-dashboard',
          color: '#8b5cf6',
          glow: ['rgba(139, 92, 246, 0.32)', 'rgba(109, 40, 217, 0.18)', 'rgba(139, 92, 246, 0.05)'],
          laser: ['#a78bfa', '#8b5cf6', '#6d28d9'],
          border: 'rgba(139, 92, 246, 0.50)',
          shadow: '#8b5cf6',
        };
      default:
        return {
          key: name,
          tabName: name,
          label: name,
          icon: 'grid',
          iconOutline: 'grid-outline',
          path: `/(user)/(tabs)/${name}`,
          color: '#94a3b8',
          glow: ['rgba(148, 163, 184, 0.32)', 'rgba(100, 116, 139, 0.18)', 'rgba(148, 163, 184, 0.05)'],
          laser: ['#cbd5e1', '#94a3b8', '#64748b'],
          border: 'rgba(148, 163, 184, 0.50)',
          shadow: '#94a3b8',
        };
    }
  });
}

