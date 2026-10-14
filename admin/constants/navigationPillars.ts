import { Ionicons } from '@expo/vector-icons';

export interface SubTabItem {
  id: string;
  title: string;
  shortTitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  path: string;
  params?: Record<string, any>;
  badge?: string;
}

export interface NavigationPillar {
  id: string;
  title: string;
  shortTitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFilled: keyof typeof Ionicons.glyphMap;
  badge: string;
  color: string;
  subTabs: SubTabItem[];
}

export const ADMIN_PILLARS: NavigationPillar[] = [
  {
    id: 'EXECUTIVE',
    title: 'EXECUTIVE HUB',
    shortTitle: 'Executive',
    icon: 'pulse-outline',
    iconFilled: 'pulse',
    badge: 'Command',
    color: '#10b981',
    subTabs: [
      {
        id: 'overview',
        title: 'Platform Overview',
        shortTitle: 'Overview',
        icon: 'home',
        path: '/admin/(tabs)',
      },
      {
        id: 'support-chat',
        title: 'Support Concierge Desk',
        shortTitle: 'Help Desk',
        icon: 'chatbubbles',
        path: '/admin/(tabs)/chat',
      },
    ],
  },
  {
    id: 'ECOMMERCE',
    title: 'COMMERCE & MARKET',
    shortTitle: 'Commerce',
    icon: 'bag-handle-outline',
    iconFilled: 'bag-handle',
    badge: '7 Tools',
    color: '#0284c7',
    subTabs: [
      {
        id: 'products',
        title: 'Product Catalog',
        shortTitle: 'Catalog',
        icon: 'cube',
        path: '/admin/(tabs)/admin-products',
      },
      {
        id: 'orders',
        title: 'Trade Orders',
        shortTitle: 'Orders',
        icon: 'receipt',
        path: '/admin/(tabs)/admin-orders',
      },
      {
        id: 'seller-directory',
        title: 'Store Sellers',
        shortTitle: 'Sellers',
        icon: 'storefront',
        path: '/admin/(tabs)/admin-sellers',
      },
      {
        id: 'trader-directory',
        title: 'Mandi Traders',
        shortTitle: 'Traders',
        icon: 'swap-horizontal',
        path: '/admin/(tabs)/super-users',
        params: { group: 'CLIENTS', filter: 'TRADER' },
      },
      {
        id: 'seller-kyc',
        title: 'Seller KYC Audit',
        shortTitle: 'KYC Audit',
        icon: 'shield-checkmark',
        path: '/admin/(tabs)/admin-sellers',
      },
      {
        id: 'coupons',
        title: 'VIP Pass & Coupons',
        shortTitle: 'Coupons',
        icon: 'ticket',
        path: '/admin/(tabs)/super-coupons',
      },
      {
        id: 'sales-analytics',
        title: 'Revenue Analytics',
        shortTitle: 'Analytics',
        icon: 'bar-chart',
        path: '/admin/(tabs)/super-orders',
      },
    ],
  },
  {
    id: 'FINANCE',
    title: 'TREASURY & VAULT',
    shortTitle: 'Treasury',
    icon: 'wallet-outline',
    iconFilled: 'wallet',
    badge: '4 Tools',
    color: '#f59e0b',
    subTabs: [
      {
        id: 'global-ledger',
        title: 'Global Balance Sheet',
        shortTitle: 'Ledger',
        icon: 'wallet',
        path: '/admin/(tabs)/super-accounts',
      },
      {
        id: 'partner-withdrawals',
        title: 'Partner Withdrawals',
        shortTitle: 'Withdrawals',
        icon: 'cash',
        path: '/admin/(tabs)/wallet',
      },
      {
        id: 'seller-payouts',
        title: 'Seller Settlements',
        shortTitle: 'Payouts',
        icon: 'card',
        path: '/admin/(tabs)/seller-payouts',
      },
      {
        id: 'memberships',
        title: 'VIP Subscription Plans',
        shortTitle: 'VIP Plans',
        icon: 'ribbon',
        path: '/admin/(tabs)/memberships',
      },
    ],
  },
  {
    id: 'FARMER_HUB',
    title: 'AGRI-ECOSYSTEM',
    shortTitle: 'Agri-Hub',
    icon: 'leaf-outline',
    iconFilled: 'leaf',
    badge: '7 Tools',
    color: '#16a34a',
    subTabs: [
      {
        id: 'farmers',
        title: 'Farmers Network',
        shortTitle: 'Farmers',
        icon: 'leaf',
        path: '/admin/(tabs)/super-users',
        params: { group: 'CLIENTS', filter: 'FARMER' },
      },
      {
        id: 'labours',
        title: 'Agricultural Workforce',
        shortTitle: 'Workforce',
        icon: 'hammer',
        path: '/admin/(tabs)/super-users',
        params: { group: 'CLIENTS', filter: 'LABOUR' },
      },
      {
        id: 'crop-doctors',
        title: 'Crop Specialists',
        shortTitle: 'Doctors',
        icon: 'medical',
        path: '/admin/(tabs)/super-users',
        params: { group: 'PARTNERS', filter: 'FARM_ADVISOR' },
      },
      {
        id: 'crop-intelligence',
        title: 'Crop Intelligence Engine',
        shortTitle: 'Engine',
        icon: 'trending-up',
        path: '/admin/(tabs)/crop-intelligence',
      },
      {
        id: 'ai-scanner',
        title: 'AI Plant Diagnostics',
        shortTitle: 'AI Scanner',
        icon: 'scan',
        path: '/admin/(tabs)/crop-disease-scanner',
      },
      {
        id: 'satellite-map',
        title: 'Satellite Farm Radar',
        shortTitle: 'Radar',
        icon: 'planet',
        path: '/admin/(tabs)/satellite-map',
      },
      {
        id: 'crop-master',
        title: 'Crop Master Registry',
        shortTitle: 'Registry',
        icon: 'create',
        path: '/admin/(tabs)/super-crop-edit',
      },
    ],
  },
  {
    id: 'GARDENER_HUB',
    title: 'GARDEN CARE',
    shortTitle: 'Garden Care',
    icon: 'flower-outline',
    iconFilled: 'flower',
    badge: '7 Tools',
    color: '#ec4899',
    subTabs: [
      {
        id: 'garden-system',
        title: 'Garden Care System',
        shortTitle: 'Garden System',
        icon: 'flower',
        path: '/admin/(tabs)/garden',
      },
      {
        id: 'plant-doses',
        title: 'Plant Nutrition & Spray Doses',
        shortTitle: 'Plant Care',
        icon: 'nutrition',
        path: '/admin/(tabs)/dose',
      },
      {
        id: 'garden-schedule',
        title: 'Garden Maintenance Schedule',
        shortTitle: 'Schedule',
        icon: 'calendar',
        path: '/admin/(tabs)/schedule',
        params: { mode: 'GARDEN' },
      },
      {
        id: 'garden-satellite',
        title: 'Garden Landscape Radar',
        shortTitle: 'Landscape',
        icon: 'planet',
        path: '/admin/(tabs)/satellite-map',
        params: { mode: 'GARDEN' },
      },
      {
        id: 'plant-scanner',
        title: 'Plant Health & AI Scanner',
        shortTitle: 'Plant Health',
        icon: 'scan',
        path: '/admin/(tabs)/crop-disease-scanner',
      },
      {
        id: 'garden-store',
        title: 'Flora & Garden Store',
        shortTitle: 'Garden Store',
        icon: 'bag-handle',
        path: '/admin/(tabs)/admin-products',
        params: { category: 'GARDEN' },
      },
      {
        id: 'advisor-profiles',
        title: 'Advisor Credentials & KYC',
        shortTitle: 'Credentials',
        icon: 'ribbon',
        path: '/admin/(tabs)/advisor-profile',
      },
    ],
  },
  {
    id: 'DIRECTORY',
    title: 'USER DIRECTORY',
    shortTitle: 'Directory',
    icon: 'people-outline',
    iconFilled: 'people',
    badge: 'Directory',
    color: '#8b5cf6',
    subTabs: [
      {
        id: 'all-users',
        title: 'Platform User Directory',
        shortTitle: 'All Users',
        icon: 'people',
        path: '/admin/(tabs)/super-users',
      },
      {
        id: 'farmers',
        title: 'Farmers Network',
        shortTitle: 'Farmers',
        icon: 'leaf',
        path: '/admin/(tabs)/super-users',
        params: { group: 'CLIENTS', filter: 'FARMER' },
      },
      {
        id: 'traders',
        title: 'Mandi Traders & Buyers',
        shortTitle: 'Traders',
        icon: 'swap-horizontal',
        path: '/admin/(tabs)/super-users',
        params: { group: 'CLIENTS', filter: 'TRADER' },
      },
      {
        id: 'gardeners',
        title: 'Gardeners & Nursery',
        shortTitle: 'Gardeners',
        icon: 'flower',
        path: '/admin/(tabs)/super-users',
        params: { group: 'CLIENTS', filter: 'GARDENER' },
      },
      {
        id: 'crop-doctors',
        title: 'Crop Doctors & Advisors',
        shortTitle: 'Advisors',
        icon: 'medical',
        path: '/admin/(tabs)/super-users',
        params: { group: 'PARTNERS', filter: 'FARM_ADVISOR' },
      },
      {
        id: 'business-partners',
        title: 'Strategic Alliances',
        shortTitle: 'Partners',
        icon: 'briefcase',
        path: '/admin/(tabs)/super-users',
        params: { group: 'PARTNERS', filter: 'BUSINESS_PARTNER' },
      },
      {
        id: 'customers',
        title: 'Shopping Customers',
        shortTitle: 'Customers',
        icon: 'cart',
        path: '/admin/(tabs)/super-users',
        params: { group: 'CLIENTS', filter: 'CUSTOMER' },
      },
    ],
  },
  {
    id: 'STAFF_HUB',
    title: 'OPERATIONS & STAFF',
    shortTitle: 'Operations',
    icon: 'shield-checkmark-outline',
    iconFilled: 'shield-checkmark',
    badge: 'Internal',
    color: '#6366f1',
    subTabs: [
      {
        id: 'admin-council',
        title: 'Super Admin Council',
        shortTitle: 'Admins',
        icon: 'shield-half',
        path: '/admin/(tabs)/super-users',
        params: { group: 'ADMINS', filter: 'SUPER_ADMIN' },
      },
      {
        id: 'managers',
        title: 'Operations Managers',
        shortTitle: 'Managers',
        icon: 'person-circle',
        path: '/admin/(tabs)/super-users',
        params: { group: 'ADMINS', filter: 'MANAGER' },
      },
      {
        id: 'operators',
        title: 'Dispatch & Orders Desk',
        shortTitle: 'Dispatch',
        icon: 'print',
        path: '/admin/(tabs)/operator-orders',
      },
      {
        id: 'trainers',
        title: 'Technical Trainers Desk',
        shortTitle: 'Trainers',
        icon: 'school',
        path: '/admin/(tabs)/trainer-dashboard',
      },
      {
        id: 'staff-roster',
        title: 'Staff Permissions & Roles',
        shortTitle: 'Permissions',
        icon: 'key',
        path: '/admin/(tabs)/super-users',
        params: { group: 'ADMINS' },
      },
    ],
  },
  {
    id: 'SETTINGS',
    title: 'SETTINGS',
    shortTitle: 'Settings',
    icon: 'settings-outline',
    iconFilled: 'settings',
    badge: 'Config',
    color: '#64748b',
    subTabs: [
      {
        id: 'infrastructure-settings',
        title: 'Infrastructure Settings',
        shortTitle: 'Settings',
        icon: 'settings',
        path: '/admin/(tabs)/super-settings',
      },
      {
        id: 'cpanel-integrations',
        title: 'Service Integrations',
        shortTitle: 'Integrations',
        icon: 'options',
        path: '/admin/(tabs)/cpanel',
      },
      {
        id: 'audit-log',
        title: 'System Audit Trail',
        shortTitle: 'Audit Trail',
        icon: 'time',
        path: '/admin/(tabs)/super-audit-log',
      },
      {
        id: 'more-tools',
        title: 'Central Hub & Guides',
        shortTitle: 'Central Hub',
        icon: 'grid',
        path: '/admin/(tabs)/admin_more',
      },
    ],
  },
];

/**
 * Automatically detects the active pillar ID given the current URL pathname and query params.
 * FULLY AUDITED — covers all 40 tabs in admin/(tabs)/.
 */
export function detectPillarFromRoute(
  pathname: string,
  searchParams?: Record<string, any>,
  currentPillarId?: string
): string {
  if (!pathname) return currentPillarId || 'EXECUTIVE';

  // Extract filter & group with web browser query string fallback
  let activeFilter = searchParams?.filter;
  let activeGroup = searchParams?.group;

  if (typeof window !== 'undefined' && (!activeFilter || !activeGroup)) {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (!activeFilter) activeFilter = urlParams.get('filter') || undefined;
      if (!activeGroup) activeGroup = urlParams.get('group') || undefined;
    } catch {
      // safe fallback
    }
  }

  // 1. Finance & Wallet routes
  if (
    pathname.includes('super-accounts') ||
    pathname.endsWith('/wallet') || pathname.includes('/wallet?') || pathname.includes('/(tabs)/wallet') ||
    pathname.includes('seller-payouts') ||
    pathname.includes('memberships')
  ) {
    return 'FINANCE';
  }

  // 2. E-Commerce routes
  if (
    pathname.includes('admin-products') ||
    pathname.includes('admin-orders') ||
    pathname.includes('admin-sellers') ||
    pathname.includes('admin_shop') ||
    pathname.includes('super-coupons') ||
    pathname.includes('super-orders') ||
    pathname.endsWith('/coupons') || pathname.includes('/coupons?') ||
    pathname.endsWith('/orders') || pathname.includes('/orders?') ||
    pathname.endsWith('/cart') || pathname.includes('/cart?') ||
    pathname.endsWith('/categories') || pathname.includes('/categories?') ||
    pathname.endsWith('/shop') || pathname.includes('/shop?') ||
    (pathname.includes('super-users') && (activeGroup === 'ECOMMERCE' || activeFilter === 'SELLER' || activeFilter === 'TRADER'))
  ) {
    return 'ECOMMERCE';
  }

  // 3. Garden Care & Horticulture routes
  let activeMode = searchParams?.mode;
  if (typeof window !== 'undefined' && !activeMode) {
    try {
      activeMode = new URLSearchParams(window.location.search).get('mode') || undefined;
    } catch {}
  }

  if (
    pathname.includes('garden') ||
    pathname.includes('dose') ||
    pathname.includes('advisor-profile') ||
    activeMode === 'GARDEN'
  ) {
    return 'GARDENER_HUB';
  }

  // 4. Farmer & Crop Doctor routes
  if (
    pathname.includes('crop-disease-scanner') ||
    pathname.includes('satellite-map') ||
    pathname.includes('super-crop-edit') ||
    pathname.includes('crop-intelligence') ||
    pathname.includes('farmer-profile') ||
    pathname.endsWith('/farmers') || pathname.includes('/farmers?') ||
    pathname.endsWith('/farm') || pathname.includes('/farm?') ||
    pathname.endsWith('/schedule') || pathname.includes('/schedule?') ||
    pathname.endsWith('/market') || pathname.includes('/market?') ||
    pathname.endsWith('/referrals') || pathname.includes('/referrals?') ||
    pathname.endsWith('/records') || pathname.includes('/records?') ||
    (pathname.includes('super-users') && (activeFilter === 'FARMER' || activeFilter === 'LABOUR' || activeFilter === 'FARM_ADVISOR' || (activeGroup === 'CLIENTS' && activeFilter !== 'TRADER' && activeFilter !== 'GARDENER')))
  ) {
    return 'FARMER_HUB';
  }

  // 5. Staff & Internal Operations routes
  if (
    pathname.includes('trainer-dashboard') ||
    pathname.includes('operator-orders') ||
    (pathname.includes('super-users') && (activeFilter === 'MANAGER' || activeFilter === 'TECHNICAL_TRAINER' || activeFilter === 'SUPER_ADMIN' || activeFilter === 'ADMIN' || activeFilter === 'OPERATOR' || activeGroup === 'ADMINS'))
  ) {
    return 'STAFF_HUB';
  }

  // 6. User Directory routes
  if (
    currentPillarId === 'DIRECTORY' && pathname.includes('super-users')
  ) {
    return 'DIRECTORY';
  }

  // 7. Settings & Configuration routes
  if (
    pathname.includes('super-settings') ||
    pathname.includes('cpanel') ||
    pathname.includes('super-audit-log') ||
    pathname.includes('admin_more')
  ) {
    return 'SETTINGS';
  }

  // 8. For shared routes like super-users with no explicit filter:
  // If user is currently on Directory, E-Commerce, Farmer Hub, Garden Hub, or Staff Hub, preserve their active pillar!
  if (pathname.includes('super-users')) {
    if (currentPillarId && ['DIRECTORY', 'ECOMMERCE', 'FARMER_HUB', 'GARDENER_HUB', 'STAFF_HUB'].includes(currentPillarId)) {
      return currentPillarId;
    }
    return 'DIRECTORY';
  }

  // 9. Overview & Chat defaults to EXECUTIVE
  return 'EXECUTIVE';
}
