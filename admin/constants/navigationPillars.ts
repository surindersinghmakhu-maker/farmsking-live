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
    title: 'EXECUTIVE DASHBOARD',
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
        title: 'Farmer Support Live Desk',
        shortTitle: 'Help Desk',
        icon: 'chatbubbles',
        path: '/admin/(tabs)/chat',
      },
    ],
  },
  {
    id: 'ECOMMERCE',
    title: 'E-COMMERCE & STORE',
    shortTitle: 'E-Commerce',
    icon: 'bag-handle-outline',
    iconFilled: 'bag-handle',
    badge: '7 Tools',
    color: '#0284c7',
    subTabs: [
      {
        id: 'products',
        title: 'Products Catalog',
        shortTitle: 'Products',
        icon: 'cube',
        path: '/admin/(tabs)/admin-products',
      },
      {
        id: 'orders',
        title: 'Store Orders',
        shortTitle: 'Orders',
        icon: 'receipt',
        path: '/admin/(tabs)/admin-orders',
      },
      {
        id: 'seller-directory',
        title: 'Store Sellers',
        shortTitle: 'Sellers',
        icon: 'storefront',
        path: '/admin/(tabs)/super-users',
        params: { group: 'ECOMMERCE', filter: 'SELLER' },
      },
      {
        id: 'trader-directory',
        title: 'Mandi Traders & Buyers',
        shortTitle: 'Traders',
        icon: 'swap-horizontal',
        path: '/admin/(tabs)/super-users',
        params: { group: 'ECOMMERCE', filter: 'TRADER' },
      },
      {
        id: 'seller-kyc',
        title: 'Seller KYC Approvals',
        shortTitle: 'Seller KYC',
        icon: 'shield-checkmark',
        path: '/admin/(tabs)/admin-sellers',
      },
      {
        id: 'coupons',
        title: 'Coupons & VIP Passes',
        shortTitle: 'Coupons',
        icon: 'ticket',
        path: '/admin/(tabs)/super-coupons',
      },
      {
        id: 'sales-analytics',
        title: 'Sales Analytics',
        shortTitle: 'Analytics',
        icon: 'bar-chart',
        path: '/admin/(tabs)/super-orders',
      },
    ],
  },
  {
    id: 'FINANCE',
    title: 'FINANCE & WALLET',
    shortTitle: 'Finance',
    icon: 'wallet-outline',
    iconFilled: 'wallet',
    badge: '4 Tools',
    color: '#f59e0b',
    subTabs: [
      {
        id: 'global-ledger',
        title: 'Global Ledger & Balance',
        shortTitle: 'Ledger',
        icon: 'wallet',
        path: '/admin/(tabs)/super-accounts',
      },
      {
        id: 'partner-withdrawals',
        title: 'Partner Wallet & Withdrawals',
        shortTitle: 'Withdrawals',
        icon: 'cash',
        path: '/admin/(tabs)/wallet',
      },
      {
        id: 'seller-payouts',
        title: 'Seller Payouts & Settlement',
        shortTitle: 'Payouts',
        icon: 'card',
        path: '/admin/(tabs)/seller-payouts',
      },
      {
        id: 'memberships',
        title: 'Farmer Plan Subscriptions',
        shortTitle: 'Plans',
        icon: 'ribbon',
        path: '/admin/(tabs)/memberships',
      },
    ],
  },
  {
    id: 'FARMER_HUB',
    title: 'FARMER & CROP DOCTOR',
    shortTitle: 'Farmer Hub',
    icon: 'leaf-outline',
    iconFilled: 'leaf',
    badge: '9 Tools',
    color: '#16a34a',
    subTabs: [
      {
        id: 'farmers',
        title: 'Farmers Directory',
        shortTitle: 'Farmers',
        icon: 'leaf',
        path: '/admin/(tabs)/super-users',
        params: { group: 'CLIENTS', filter: 'FARMER' },
      },
      {
        id: 'supervisors',
        title: 'Supervisors (Single Farmer)',
        shortTitle: 'Supervisors',
        icon: 'key',
        path: '/admin/(tabs)/super-users',
        params: { group: 'CLIENTS', filter: 'SUPERVISOR' },
      },
      {
        id: 'labours',
        title: 'Labour Workers (Multi-Farmer)',
        shortTitle: 'Labourers',
        icon: 'hammer',
        path: '/admin/(tabs)/super-users',
        params: { group: 'CLIENTS', filter: 'LABOUR' },
      },
      {
        id: 'crop-doctors',
        title: 'Crop Doctors (Farmers)',
        shortTitle: 'Crop Doctors',
        icon: 'medical',
        path: '/admin/(tabs)/super-users',
        params: { group: 'PARTNERS', filter: 'FARM_ADVISOR' },
      },
      {
        id: 'crop-intelligence',
        title: 'Crop Engine (Demand & Sowing)',
        shortTitle: 'Crop Engine',
        icon: 'trending-up',
        path: '/admin/(tabs)/crop-intelligence',
      },
      {
        id: 'ai-scanner',
        title: 'AI Disease Diagnostic Scanner',
        shortTitle: 'AI Scanner',
        icon: 'scan',
        path: '/admin/(tabs)/crop-disease-scanner',
      },
      {
        id: 'satellite-map',
        title: 'High-Res Satellite Farm Radar',
        shortTitle: 'Satellite Radar',
        icon: 'planet',
        path: '/admin/(tabs)/satellite-map',
      },
      {
        id: 'farmer-profile',
        title: 'Farmer Profile & Spray Tank',
        shortTitle: 'Farmer Setup',
        icon: 'person-circle',
        path: '/admin/(tabs)/farmer-profile-setup',
      },
      {
        id: 'crop-master',
        title: 'Crop Master Data',
        shortTitle: 'Crops Master',
        icon: 'create',
        path: '/admin/(tabs)/super-crop-edit',
      },
    ],
  },
  {
    id: 'GARDENER_HUB',
    title: 'GARDENER & ADVISOR',
    shortTitle: 'Garden Hub',
    icon: 'flower-outline',
    iconFilled: 'flower',
    badge: '5 Tools',
    color: '#ec4899',
    subTabs: [
      {
        id: 'gardeners',
        title: 'Gardeners Directory',
        shortTitle: 'Gardeners',
        icon: 'flower',
        path: '/admin/(tabs)/super-users',
        params: { group: 'CLIENTS', filter: 'GARDENER' },
      },
      {
        id: 'garden-advisors',
        title: 'Garden Advisors (Gardeners)',
        shortTitle: 'Garden Advisors',
        icon: 'sunny',
        path: '/admin/(tabs)/super-users',
        params: { group: 'PARTNERS', filter: 'GARDEN_ADVISOR' },
      },
      {
        id: 'plant-doses',
        title: 'Plant Care Doses & Protocols',
        shortTitle: 'Plant Doses',
        icon: 'nutrition',
        path: '/admin/(tabs)/dose',
      },
      {
        id: 'advisor-profiles',
        title: 'Advisor Profiles & Certificates',
        shortTitle: 'Advisor Certs',
        icon: 'ribbon',
        path: '/admin/(tabs)/advisor-profile',
      },
      {
        id: 'garden-store',
        title: 'Garden Plants & Tools Store',
        shortTitle: 'Garden Store',
        icon: 'bag-handle',
        path: '/admin/(tabs)/admin-products',
        params: { category: 'GARDEN' },
      },
    ],
  },
  {
    id: 'STAFF_HUB',
    title: 'STAFF & OPERATIONS',
    shortTitle: 'Staff Hub',
    icon: 'people-outline',
    iconFilled: 'people',
    badge: '5 Roles',
    color: '#6366f1',
    subTabs: [
      {
        id: 'managers',
        title: 'System Managers',
        shortTitle: 'Managers',
        icon: 'person-circle',
        path: '/admin/(tabs)/super-users',
        params: { group: 'ADMINS', filter: 'MANAGER' },
      },
      {
        id: 'trainers',
        title: 'Technical Trainers',
        shortTitle: 'Trainers',
        icon: 'school',
        path: '/admin/(tabs)/super-users',
        params: { group: 'ADMINS', filter: 'TECHNICAL_TRAINER' },
      },
      {
        id: 'operators',
        title: 'Operators & Orders',
        shortTitle: 'Operators',
        icon: 'print',
        path: '/admin/(tabs)/operator-orders',
      },
      {
        id: 'business-partners',
        title: 'Business Partners',
        shortTitle: 'Partners',
        icon: 'briefcase',
        path: '/admin/(tabs)/super-users',
        params: { group: 'PARTNERS', filter: 'BUSINESS_PARTNER' },
      },
      {
        id: 'all-users',
        title: 'All Admins & Super Admins',
        shortTitle: 'Admins',
        icon: 'people',
        path: '/admin/(tabs)/super-users',
        params: { group: 'ADMINS', filter: 'SUPER_ADMIN' },
      },
    ],
  },
  {
    id: 'SETTINGS',
    title: 'SETTINGS',
    shortTitle: 'Settings',
    icon: 'settings-outline',
    iconFilled: 'settings',
    badge: 'C-Panel',
    color: '#64748b',
    subTabs: [
      {
        id: 'settings',
        title: 'Platform Settings & Toggles',
        shortTitle: 'Settings',
        icon: 'settings',
        path: '/admin/(tabs)/super-settings',
      },
      {
        id: 'audit-log',
        title: 'System Audit Log',
        shortTitle: 'Audit Log',
        icon: 'time',
        path: '/admin/(tabs)/super-audit-log',
      },
      {
        id: 'more-tools',
        title: 'Admin Master Hub & Guides',
        shortTitle: 'Master Hub',
        icon: 'grid',
        path: '/admin/(tabs)/admin_more',
      },
    ],
  },
];

/**
 * Automatically detects the active pillar ID given the current URL pathname and query params
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
    pathname.includes('wallet') ||
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
    pathname.includes('super-coupons') ||
    pathname.includes('super-orders') ||
    pathname.includes('shop') ||
    (pathname.includes('super-users') && (activeGroup === 'ECOMMERCE' || activeFilter === 'SELLER' || activeFilter === 'TRADER'))
  ) {
    return 'ECOMMERCE';
  }

  // 3. Farmer & Crop Doctor routes
  if (
    pathname.includes('crop-disease-scanner') ||
    pathname.includes('satellite-map') ||
    pathname.includes('super-crop-edit') ||
    pathname.includes('crop-intelligence') ||
    pathname.includes('farmer-profile') ||
    (pathname.includes('super-users') && (activeFilter === 'FARMER' || activeFilter === 'SUPERVISOR' || activeFilter === 'LABOUR' || activeFilter === 'FARM_ADVISOR' || activeGroup === 'CLIENTS'))
  ) {
    return 'FARMER_HUB';
  }

  // 4. Gardener & Advisor routes
  if (
    pathname.includes('dose') ||
    pathname.includes('advisor-profile') ||
    (pathname.includes('super-users') && (activeFilter === 'GARDENER' || activeFilter === 'GARDEN_ADVISOR'))
  ) {
    return 'GARDENER_HUB';
  }

  // 5. Staff & Operations routes
  if (
    pathname.includes('trainer-dashboard') ||
    pathname.includes('operator-orders') ||
    (pathname.includes('super-users') && (activeFilter === 'MANAGER' || activeFilter === 'TECHNICAL_TRAINER' || activeFilter === 'BUSINESS_PARTNER' || activeFilter === 'SUPER_ADMIN' || activeFilter === 'ADMIN' || activeFilter === 'OPERATOR' || activeGroup === 'ADMINS'))
  ) {
    return 'STAFF_HUB';
  }

  // 6. Settings / C-Panel routes
  if (
    pathname.includes('super-settings') ||
    pathname.includes('super-audit-log') ||
    pathname.includes('admin_more')
  ) {
    return 'SETTINGS';
  }

  // 7. For shared routes like super-users with no explicit filter:
  // If user is currently on E-Commerce, Farmer Hub, Garden Hub, or Staff Hub, preserve their active pillar!
  if (pathname.includes('super-users')) {
    if (currentPillarId && ['ECOMMERCE', 'FARMER_HUB', 'GARDENER_HUB', 'STAFF_HUB'].includes(currentPillarId)) {
      return currentPillarId;
    }
    // FarmsKing is farmer-first by default
    return 'FARMER_HUB';
  }

  // 8. Overview & Chat defaults to EXECUTIVE
  return 'EXECUTIVE';
}
