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

/**
 * Clean, consolidated 4-Hub architecture for FarmsKing Executive Admin.
 * Replaces the overcrowded 8-pillar menu with 4 streamlined, intuitive domains.
 */
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
      {
        id: 'audit-log',
        title: 'System Audit Trail',
        shortTitle: 'Audit Trail',
        icon: 'time',
        path: '/admin/(tabs)/super-audit-log',
      },
      {
        id: 'central-hub',
        title: 'Central Hub & Guides',
        shortTitle: 'Central Hub',
        icon: 'grid',
        path: '/admin/(tabs)/admin_more',
      },
    ],
  },
  {
    id: 'COMMERCE',
    title: 'COMMERCE & TREASURY',
    shortTitle: 'Commerce',
    icon: 'bag-handle-outline',
    iconFilled: 'bag-handle',
    badge: 'Trade & Vault',
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
        title: 'Store Sellers & KYC',
        shortTitle: 'Sellers',
        icon: 'storefront',
        path: '/admin/(tabs)/admin-sellers',
      },
      {
        id: 'global-ledger',
        title: 'Global Balance Sheet',
        shortTitle: 'Ledger',
        icon: 'wallet',
        path: '/admin/(tabs)/super-accounts',
      },
      {
        id: 'seller-payouts',
        title: 'Settlements & Payouts',
        shortTitle: 'Payouts',
        icon: 'card',
        path: '/admin/(tabs)/seller-payouts',
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
        id: 'coupons',
        title: 'VIP Pass & Coupons',
        shortTitle: 'Coupons',
        icon: 'ticket',
        path: '/admin/(tabs)/super-coupons',
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
    id: 'ECOSYSTEM',
    title: 'AGRI-ECOSYSTEM',
    shortTitle: 'Agri-Hub',
    icon: 'leaf-outline',
    iconFilled: 'leaf',
    badge: 'Farm & Garden',
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
        id: 'garden-system',
        title: 'Garden Care System',
        shortTitle: 'Garden Care',
        icon: 'flower',
        path: '/admin/(tabs)/garden',
      },
      {
        id: 'crop-doctors',
        title: 'Crop Specialists & Doctors',
        shortTitle: 'Doctors',
        icon: 'medical',
        path: '/admin/(tabs)/super-users',
        params: { group: 'PARTNERS', filter: 'FARM_ADVISOR' },
      },
      {
        id: 'satellite-map',
        title: 'Satellite Farm Radar',
        shortTitle: 'Radar',
        icon: 'planet',
        path: '/admin/(tabs)/satellite-map',
      },
      {
        id: 'ai-scanner',
        title: 'AI Plant Diagnostics',
        shortTitle: 'AI Scanner',
        icon: 'scan',
        path: '/admin/(tabs)/crop-disease-scanner',
      },
      {
        id: 'crop-intelligence',
        title: 'Crop Intelligence Engine',
        shortTitle: 'Engine',
        icon: 'trending-up',
        path: '/admin/(tabs)/crop-intelligence',
      },
      {
        id: 'plant-doses',
        title: 'Plant Nutrition & Doses',
        shortTitle: 'Plant Care',
        icon: 'nutrition',
        path: '/admin/(tabs)/dose',
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
    id: 'PLATFORM',
    title: 'PLATFORM & DIRECTORY',
    shortTitle: 'Platform',
    icon: 'settings-outline',
    iconFilled: 'settings',
    badge: 'Control',
    color: '#6366f1',
    subTabs: [
      {
        id: 'all-users',
        title: 'Platform User Directory',
        shortTitle: 'Directory',
        icon: 'people',
        path: '/admin/(tabs)/super-users',
      },
      {
        id: 'admin-council',
        title: 'Super Admin Council',
        shortTitle: 'Council',
        icon: 'shield-half',
        path: '/admin/(tabs)/super-users',
        params: { group: 'ADMINS', filter: 'SUPER_ADMIN' },
      },
      {
        id: 'staff-roster',
        title: 'Staff Permissions & Roles',
        shortTitle: 'Permissions',
        icon: 'key',
        path: '/admin/(tabs)/super-users',
        params: { group: 'ADMINS' },
      },
      {
        id: 'operators',
        title: 'Dispatch & Orders Desk',
        shortTitle: 'Dispatch',
        icon: 'print',
        path: '/admin/(tabs)/operator-orders',
      },
      {
        id: 'infrastructure-settings',
        title: 'Infrastructure Settings',
        shortTitle: 'Settings',
        icon: 'settings',
        path: '/admin/(tabs)/super-settings',
      },
      {
        id: 'cpanel-integrations',
        title: 'Service Integrations & C-Panel',
        shortTitle: 'C-Panel',
        icon: 'options',
        path: '/admin/(tabs)/cpanel',
      },
      {
        id: 'labours',
        title: 'Agricultural Workforce',
        shortTitle: 'Workforce',
        icon: 'hammer',
        path: '/admin/(tabs)/super-users',
        params: { group: 'CLIENTS', filter: 'LABOUR' },
      },
    ],
  },
];

/**
 * Normalizes legacy pillar IDs into the 4 modern hub IDs
 */
export function normalizePillarId(pillarId?: string): string {
  if (!pillarId) return 'EXECUTIVE';
  switch (pillarId) {
    case 'FINANCE':
    case 'ECOMMERCE':
    case 'COMMERCE':
      return 'COMMERCE';
    case 'FARMER_HUB':
    case 'GARDENER_HUB':
    case 'ECOSYSTEM':
      return 'ECOSYSTEM';
    case 'DIRECTORY':
    case 'STAFF_HUB':
    case 'SETTINGS':
    case 'PLATFORM':
      return 'PLATFORM';
    case 'EXECUTIVE':
    default:
      return 'EXECUTIVE';
  }
}

/**
 * Automatically detects the active pillar ID given the current URL pathname and query params.
 * Seamlessly maps all 40 admin routes to one of the 4 Master Hubs.
 */
export function detectPillarFromRoute(
  pathname: string,
  searchParams?: Record<string, any>,
  currentPillarId?: string
): string {
  if (!pathname) return normalizePillarId(currentPillarId);

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

  // 1. Executive Hub routes
  if (
    pathname === '/admin/(tabs)' ||
    pathname === '/(tabs)' ||
    pathname === '/' ||
    pathname.includes('/chat') ||
    pathname.includes('super-audit-log') ||
    pathname.includes('admin_more')
  ) {
    return 'EXECUTIVE';
  }

  // 2. Commerce & Treasury routes
  if (
    pathname.includes('admin-products') ||
    pathname.includes('admin-orders') ||
    pathname.includes('admin-sellers') ||
    pathname.includes('admin_shop') ||
    pathname.includes('super-coupons') ||
    pathname.includes('super-orders') ||
    pathname.includes('super-accounts') ||
    pathname.includes('seller-payouts') ||
    pathname.includes('memberships') ||
    pathname.endsWith('/wallet') ||
    pathname.includes('/wallet?') ||
    pathname.includes('/(tabs)/wallet') ||
    pathname.endsWith('/coupons') ||
    pathname.endsWith('/orders') ||
    pathname.endsWith('/cart') ||
    pathname.endsWith('/categories') ||
    pathname.endsWith('/shop') ||
    (pathname.includes('super-users') && (activeGroup === 'ECOMMERCE' || activeFilter === 'SELLER' || activeFilter === 'TRADER'))
  ) {
    return 'COMMERCE';
  }

  // 3. Agri-Ecosystem & Garden Care routes
  let activeMode = searchParams?.mode;
  if (typeof window !== 'undefined' && !activeMode) {
    try {
      activeMode = new URLSearchParams(window.location.search).get('mode') || undefined;
    } catch {}
  }

  if (
    pathname.includes('garden') ||
    pathname.includes('dose') ||
    pathname.includes('crop-disease-scanner') ||
    pathname.includes('satellite-map') ||
    pathname.includes('crop-intelligence') ||
    pathname.includes('super-crop-edit') ||
    pathname.includes('advisor-profile') ||
    pathname.includes('farmer-profile') ||
    pathname.endsWith('/farmers') ||
    pathname.endsWith('/farm') ||
    pathname.endsWith('/schedule') ||
    pathname.endsWith('/market') ||
    pathname.endsWith('/records') ||
    activeMode === 'GARDEN' ||
    (pathname.includes('super-users') && (activeFilter === 'FARMER' || activeFilter === 'FARM_ADVISOR' || activeFilter === 'GARDENER'))
  ) {
    return 'ECOSYSTEM';
  }

  // 4. Platform & Directory routes
  if (
    pathname.includes('super-settings') ||
    pathname.includes('cpanel') ||
    pathname.includes('operator-orders') ||
    pathname.includes('trainer-dashboard') ||
    (pathname.includes('super-users') && (activeGroup === 'ADMINS' || activeFilter === 'SUPER_ADMIN' || activeFilter === 'MANAGER' || activeFilter === 'LABOUR')) ||
    pathname.includes('super-users')
  ) {
    return 'PLATFORM';
  }

  return normalizePillarId(currentPillarId);
}
