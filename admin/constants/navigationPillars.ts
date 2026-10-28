import { Ionicons } from '@expo/vector-icons';

export interface SubTabItem {
  id: string;
  title: string;
  shortTitle?: string;
  description?: string;
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
 * FarmsKing Executive Master Domain Pillars Architecture.
 * Balanced 4-6 items per hub. Zero duplicates, no isolated form links, pure domain focus.
 */
export const ADMIN_PILLARS: NavigationPillar[] = [
  {
    id: 'EXECUTIVE',
    title: 'Dashboard',
    shortTitle: 'Dashboard',
    icon: 'speedometer-outline',
    iconFilled: 'speedometer',
    badge: 'Dashboard HQ',
    color: '#10b981',
    subTabs: [
      {
        id: 'overview',
        title: 'Executive Dashboard',
        shortTitle: 'Dashboard',
        description: 'Real-time revenue, active orders & telemetry',
        icon: 'home',
        path: '/admin/(tabs)',
      },
      {
        id: 'support-chat',
        title: 'Live Help Desk',
        shortTitle: 'Help Desk',
        description: 'Concierge chat with farmers, doctors & sellers',
        icon: 'chatbubbles',
        path: '/admin/(tabs)/chat',
      },
      {
        id: 'audit-log',
        title: 'Security Audit Trail',
        shortTitle: 'Audit Trail',
        description: 'Admin activity trail, logins & security logs',
        icon: 'shield-checkmark',
        path: '/admin/(tabs)/super-audit-log',
      },
      {
        id: 'notifications',
        title: 'System Broadcasts',
        shortTitle: 'Alerts',
        description: 'Critical announcements & real-time alerts',
        icon: 'notifications',
        path: '/notifications',
      },
      {
        id: 'admin-profile',
        title: 'Admin Account & Security',
        shortTitle: 'Profile',
        description: 'Personal credentials & security settings',
        icon: 'person-circle',
        path: '/profile',
      },
    ],
  },
  {
    id: 'COMMERCE',
    title: 'Market',
    shortTitle: 'Market',
    icon: 'storefront-outline',
    iconFilled: 'storefront',
    badge: 'Store & Sellers',
    color: '#0284c7',
    subTabs: [
      {
        id: 'products',
        title: 'Products & Stock',
        shortTitle: 'Products',
        description: 'Manage store products, prices & inventory',
        icon: 'cube',
        path: '/admin/(tabs)/admin-products',
      },
      {
        id: 'orders',
        title: 'Order Status',
        shortTitle: 'Order Status',
        description: 'Customer purchases, packaging & tracking status',
        icon: 'receipt',
        path: '/admin/(tabs)/admin-orders',
      },
      {
        id: 'market-offers',
        title: 'Offers & Deals',
        shortTitle: 'Offers & Deals',
        description: 'Flash sale deals, promotional banners & store offers',
        icon: 'pricetag',
        path: '/admin/(tabs)/admin-offers',
      },
      {
        id: 'seller-payouts',
        title: 'Seller Payments',
        shortTitle: 'Seller Payments',
        description: 'Merchant sales settlements, GST TCS & net payouts',
        icon: 'card',
        path: '/admin/(tabs)/seller-payouts',
      },
      {
        id: 'seller-directory',
        title: 'Sellers',
        shortTitle: 'Sellers',
        description: 'Review merchant licenses, GSTIN & store approval',
        icon: 'ribbon',
        path: '/admin/(tabs)/admin-sellers',
      },
    ],
  },
  {
    id: 'ECOSYSTEM',
    title: 'Farm & Garden',
    shortTitle: 'Farm & Garden',
    icon: 'leaf-outline',
    iconFilled: 'leaf',
    badge: 'Crops & Care',
    color: '#16a34a',
    subTabs: [
      {
        id: 'ai-scanner',
        title: 'AI Plant Diagnostics',
        shortTitle: 'AI Scanner',
        description: 'Neural crop disease detection & scan logs',
        icon: 'scan',
        path: '/admin/(tabs)/crop-disease-scanner',
      },
      {
        id: 'satellite-map',
        title: 'Satellite Farm Radar',
        shortTitle: 'Radar',
        description: 'ISRO high-resolution vegetation & soil maps',
        icon: 'planet',
        path: '/admin/(tabs)/satellite-map',
      },
      {
        id: 'crop-intelligence',
        title: 'Crop Intelligence Engine',
        shortTitle: 'Intelligence',
        description: 'Mandi prices, seasonal advice & yield forecasts',
        icon: 'trending-up',
        path: '/admin/(tabs)/crop-intelligence',
      },
      {
        id: 'plant-doses',
        title: 'Plant Nutrition & Doses',
        shortTitle: 'Plant Doses',
        description: 'Stage-wise fertilizer & pesticide schedules',
        icon: 'nutrition',
        path: '/admin/(tabs)/dose',
      },
      {
        id: 'garden-system',
        title: 'Urban Garden Care',
        shortTitle: 'Garden Care',
        description: 'Balcony plant stages, care logs & garden tools',
        icon: 'flower',
        path: '/admin/(tabs)/garden',
      },
      {
        id: 'crop-master',
        title: 'Crop Master Registry',
        shortTitle: 'Crop Registry',
        description: 'Seed varieties, crop life cycles & agronomy data',
        icon: 'create',
        path: '/admin/(tabs)/super-crop-edit',
      },
    ],
  },
  {
    id: 'FINANCE',
    title: 'Finance',
    shortTitle: 'Finance',
    icon: 'cash-outline',
    iconFilled: 'cash',
    badge: 'Treasury & Wallets',
    color: '#059669',
    subTabs: [
      {
        id: 'treasury-overview',
        title: 'Treasury & Revenue',
        shortTitle: 'Treasury',
        description: 'Financial balance sheets, UPI transfers & escrow',
        icon: 'cash',
        path: '/admin/(tabs)/super-accounts',
      },
      {
        id: 'payout-approvals',
        title: 'Payout Approvals',
        shortTitle: 'Payouts',
        description: 'Review and approve vendor UPI & bank withdrawals',
        icon: 'checkmark-circle',
        path: '/admin/(tabs)/super-accounts',
        params: { tab: 'REQUESTS' },
      },
      {
        id: 'user-wallets',
        title: 'User & Partner Wallets',
        shortTitle: 'Wallets',
        description: 'Manage customer, merchant & partner wallet balances',
        icon: 'wallet',
        path: '/admin/(tabs)/super-accounts',
        params: { tab: 'WALLETS' },
      },
      {
        id: 'partner-ledgers',
        title: 'Partner Statements',
        shortTitle: 'Ledgers',
        description: 'Vendor, advisor & staff payout statements',
        icon: 'briefcase',
        path: '/admin/(tabs)/super-accounts',
        params: { tab: 'PARTNERS' },
      },
      {
        id: 'coupons',
        title: 'Coupons & VIP Passes',
        shortTitle: 'Coupons',
        description: 'Discount vouchers, promo codes & memberships',
        icon: 'ticket',
        path: '/admin/(tabs)/super-coupons',
      },
      {
        id: 'admin-wallet',
        title: 'Platform Treasury Wallet',
        shortTitle: 'My Wallet',
        description: 'Platform treasury ledger & bonus reward management',
        icon: 'card',
        path: '/admin/(tabs)/wallet',
      },
    ],
  },
  {
    id: 'USERS',
    title: 'Users',
    shortTitle: 'Users',
    icon: 'people-outline',
    iconFilled: 'people',
    badge: 'Users Directory',
    color: '#6366f1',
    subTabs: [
      {
        id: 'all-users',
        title: 'All Users Directory',
        shortTitle: 'All Users',
        description: 'Unified search & management for all accounts',
        icon: 'people',
        path: '/admin/(tabs)/super-users',
      },
      {
        id: 'farmers',
        title: 'Farmers & Growers',
        shortTitle: 'Farmers',
        description: 'Verified growers, acreage & landholders',
        icon: 'leaf',
        path: '/admin/(tabs)/super-users',
        params: { group: 'CLIENTS', filter: 'FARMER' },
      },
      {
        id: 'merchants',
        title: 'Store Merchants & Traders',
        shortTitle: 'Merchants',
        description: 'Wholesale buyers, grain traders & store owners',
        icon: 'storefront',
        path: '/admin/(tabs)/super-users',
        params: { group: 'CLIENTS', filter: 'TRADER' },
      },
      {
        id: 'staff',
        title: 'Team Staff & Operators',
        shortTitle: 'Team Staff',
        description: 'Platform managers, fulfillment operators & staff',
        icon: 'shield-half',
        path: '/admin/(tabs)/super-users',
        params: { group: 'ADMINS' },
      },
    ],
  },
  {
    id: 'PLATFORM',
    title: 'Setting',
    shortTitle: 'Setting',
    icon: 'settings-outline',
    iconFilled: 'settings',
    badge: 'Settings & Setup',
    color: '#8b5cf6',
    subTabs: [
      {
        id: 'settings-about',
        title: 'About',
        shortTitle: 'About',
        description: 'Company information, platform architecture, statutory details and legal compliance',
        icon: 'information-circle-outline',
        path: '/admin/(tabs)/new-settings',
        params: { tab: 'ABOUT', pillar: 'PLATFORM' },
      },
      {
        id: 'settings-entity',
        title: 'FK Setting',
        shortTitle: 'FK Setting',
        description: 'Corporate registry, registered address, directors, branding, tax/GST and master rules',
        icon: 'settings-outline',
        path: '/admin/(tabs)/new-settings',
        params: { tab: 'ENTITY_SETUP', pillar: 'PLATFORM' },
      },
      {
        id: 'platform-tools',
        title: 'Platform Tools & Services',
        shortTitle: 'Tools & Services',
        description: 'Third-party API providers, credentials, and live telemetry toggles',
        icon: 'hardware-chip-outline',
        path: '/admin/(tabs)/super-settings',
        params: { pillar: 'PLATFORM' },
      },
      {
        id: 'cpanel-integrations',
        title: 'Store & Company Rules',
        shortTitle: 'Store Rules',
        description: 'Marketplace commission, social links, CIN & legal branding',
        icon: 'options',
        path: '/admin/(tabs)/cpanel',
        params: { pillar: 'PLATFORM' },
      },
    ],
  },
];

/**
 * Normalizes legacy pillar IDs into the modern master hub IDs
 */
export function normalizePillarId(pillarId?: string): string {
  if (!pillarId) return 'EXECUTIVE';
  switch (pillarId) {
    case 'NEW_SETTINGS':
    case 'NEW-SETTINGS':
    case 'SETTINGS':
    case 'UTILITIES':
    case 'TOOLS':
    case 'OTHER':
    case 'PLATFORM':
      return 'PLATFORM';
    case 'NEW_FINANCE':
    case 'NEW-FINANCE':
    case 'FINANCE':
    case 'ACCOUNTS':
    case 'TREASURY':
    case 'WALLET':
      return 'FINANCE';
    case 'FARMERS':
    case 'FARMER':
    case 'FARMER_HUB':
    case 'GARDENER_HUB':
    case 'ECOSYSTEM':
    case 'FARM':
    case 'GARDEN':
      return 'ECOSYSTEM';
    case 'ECOMMERCE':
    case 'COMMERCE':
    case 'MARKET':
      return 'COMMERCE';
    case 'DIRECTORY':
    case 'STAFF_HUB':
    case 'USERS':
      return 'USERS';
    case 'SETTINGS':
    case 'UTILITIES':
    case 'TOOLS':
    case 'OTHER':
    case 'PLATFORM':
      return 'PLATFORM';
    case 'EXECUTIVE':
    default:
      return 'EXECUTIVE';
  }
}

/**
 * Automatically detects the active pillar ID given the current URL pathname and query params.
 * User Directory (super-users) is strictly and exclusively routed to USERS unless in FARMERS pillar.
 */
export function detectPillarFromRoute(
  pathname: string,
  searchParams?: Record<string, any>,
  currentPillarId?: string
): string {
  if (!pathname) return normalizePillarId(currentPillarId);

  // Check URL query search params on web as fallback
  const webPillar =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('pillar')
      : undefined;
  const webFilter =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('filter')
      : undefined;

  const effectivePillar = searchParams?.pillar || webPillar;
  const effectiveFilter = searchParams?.filter || webFilter;

  // 0. Setting routes (all settings consolidate under PLATFORM)
  if (
    pathname.includes('new-settings') ||
    pathname.includes('super-settings') ||
    pathname.includes('cpanel') ||
    effectivePillar === 'PLATFORM' ||
    effectivePillar === 'NEW_SETTINGS' ||
    effectivePillar === 'SETTINGS'
  ) {
    return 'PLATFORM';
  }

  // 0.1 Finance routes
  if (
    pathname.includes('new-finance') ||
    effectivePillar === 'NEW_FINANCE' ||
    effectivePillar === 'NEW-FINANCE'
  ) {
    return 'FINANCE';
  }

  // 1. Executive Command routes
  if (
    pathname === '/admin/(tabs)' ||
    pathname === '/(tabs)' ||
    pathname === '/' ||
    pathname.includes('/chat') ||
    pathname.includes('super-audit-log') ||
    (pathname === '/notifications' || pathname.endsWith('/notifications')) ||
    (pathname === '/profile' || pathname.endsWith('/profile'))
  ) {
    return 'EXECUTIVE';
  }

  // 2. Finance & Treasury routes (strictly money, wallets, payouts, and coupons)
  if (
    pathname.includes('super-accounts') ||
    pathname.includes('super-coupons') ||
    pathname.endsWith('/coupons') ||
    pathname.includes('memberships') ||
    pathname.endsWith('/wallet') ||
    pathname.includes('/wallet?') ||
    pathname.includes('/(tabs)/wallet')
  ) {
    return 'FINANCE';
  }

  // 3. User Directory routes (super-users & onboarding EXCLUSIVELY here)
  if (
    pathname.includes('super-users') ||
    pathname.includes('staff-profile') ||
    pathname.includes('farmer-profile') ||
    pathname.includes('advisor-profile')
  ) {
    return 'USERS';
  }

  // 4. Commerce & Orders routes (strictly store and seller operations)
  if (
    pathname.includes('admin-products') ||
    pathname.includes('admin-orders') ||
    pathname.includes('operator-orders') ||
    pathname.includes('admin-sellers') ||
    pathname.includes('admin-offers') ||
    pathname.includes('seller-payouts') ||
    pathname.includes('admin_shop') ||
    pathname.includes('super-orders') ||
    pathname.includes('order-tracking') ||
    pathname.includes('public-store') ||
    pathname.endsWith('/orders') ||
    pathname.endsWith('/cart') ||
    pathname.endsWith('/categories') ||
    pathname.endsWith('/shop')
  ) {
    return 'COMMERCE';
  }

  // 5. Farm & Garden routes (Agri-Ecosystem, diagnostics, radar, intelligence, doses, garden)
  if (
    pathname.includes('crop-disease-scanner') ||
    pathname.includes('satellite-map') ||
    pathname.includes('crop-intelligence') ||
    pathname.includes('dose') ||
    pathname.includes('garden') ||
    pathname.includes('super-crop-edit') ||
    pathname.includes('market') ||
    pathname.endsWith('/farm') ||
    pathname.endsWith('/schedule') ||
    pathname.endsWith('/records')
  ) {
    return 'ECOSYSTEM';
  }

  // 6. System Operations & Platform Tools routes (settings, cpanel, ops hub)
  if (
    pathname.includes('super-settings') ||
    pathname.includes('cpanel') ||
    pathname.includes('admin_more') ||
    pathname.includes('notification-settings') ||
    pathname.includes('seo') ||
    pathname.includes('support') ||
    pathname.includes('contact-us') ||
    pathname.includes('privacy-policy') ||
    pathname.includes('seller-dashboard')
  ) {
    return 'PLATFORM';
  }

  return normalizePillarId(currentPillarId);
}
