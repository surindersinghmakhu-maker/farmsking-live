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
    title: 'Overview',
    shortTitle: 'Overview',
    icon: 'pulse-outline',
    iconFilled: 'pulse',
    badge: 'Overview HQ',
    color: '#10b981',
    subTabs: [
      {
        id: 'overview',
        title: 'Executive Dashboard',
        shortTitle: 'Overview',
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
    badge: 'Platform & Tools',
    color: '#8b5cf6',
    subTabs: [
      {
        id: 'api-integrations',
        title: 'API & 3rd-Party Services',
        shortTitle: 'API',
        description: 'Gateways, AI, Telecom, Weather, SMS, WhatsApp & Logistics',
        icon: 'git-network',
        path: '/admin/(tabs)/super-settings',
        params: { section: 'API' },
      },
      {
        id: 'infrastructure-settings',
        title: 'System Configuration',
        shortTitle: 'Settings',
        description: 'Maintenance flags, system caching & feature switches',
        icon: 'settings',
        path: '/admin/(tabs)/super-settings',
        params: { section: 'ALL' },
      },
      {
        id: 'cpanel-integrations',
        title: 'Store & Company Rules',
        shortTitle: 'Store Rules',
        description: 'Marketplace commission, social links, CIN & legal branding',
        icon: 'options',
        path: '/admin/(tabs)/cpanel',
      },
    ],
  },
  {
    id: 'FARMERS',
    title: 'Farmers',
    shortTitle: 'Farmers',
    icon: 'leaf-outline',
    iconFilled: 'leaf',
    badge: 'Farmers HQ',
    color: '#16a34a',
    subTabs: [
      {
        id: 'farmers-hq',
        title: 'Farmers & Doctors Command',
        shortTitle: 'HQ Command',
        description: 'Executive overview, field telemetry & doctor duty matrix',
        icon: 'speedometer',
        path: '/admin/(tabs)/farmers',
        params: { pillar: 'FARMERS' },
      },
      {
        id: 'farmers-directory',
        title: 'Farmers Directory',
        shortTitle: 'Farmers',
        description: 'Farmer profiles, land acreage, King ID & passbook',
        icon: 'people',
        path: '/admin/(tabs)/super-users',
        params: { group: 'CLIENTS', filter: 'FARMER', pillar: 'FARMERS' },
      },
      {
        id: 'doctors-directory',
        title: 'Crop Doctors Directory',
        shortTitle: 'Crop Doctors',
        description: 'Registered agronomists, qualifications, shifts & ratings',
        icon: 'medkit',
        path: '/admin/(tabs)/super-users',
        params: { group: 'PARTNERS', filter: 'ADVISOR', pillar: 'FARMERS' },
      },
      {
        id: 'doctor-dispatch',
        title: 'Doctor Dispatch & VIP Visits',
        shortTitle: 'VIP Advisory',
        description: 'Doctor consultation requests, farm visits & VIP passes',
        icon: 'calendar',
        path: '/admin/(tabs)/memberships',
        params: { pillar: 'FARMERS' },
      },
      {
        id: 'farmer-crops',
        title: 'Crop & Field Registry',
        shortTitle: 'Crops',
        description: 'Crop varieties, sowing dates, plot areas & master agronomy',
        icon: 'leaf',
        path: '/admin/(tabs)/super-crop-edit',
        params: { pillar: 'FARMERS' },
      },
      {
        id: 'farmer-disease-scanner',
        title: 'AI Crop Disease Diagnostics',
        shortTitle: 'AI Scanner',
        description: 'Neural leaf diagnosis, severity levels & remedy prescriptions',
        icon: 'scan',
        path: '/admin/(tabs)/crop-disease-scanner',
        params: { pillar: 'FARMERS' },
      },
      {
        id: 'farmer-satellite',
        title: 'Satellite Farm Radar',
        shortTitle: 'Satellite GPS',
        description: 'ISRO & Sentinel-2 vegetation health, soil moisture & GPS plots',
        icon: 'planet',
        path: '/admin/(tabs)/satellite-map',
        params: { pillar: 'FARMERS' },
      },
      {
        id: 'spray-doses',
        title: 'Plant Nutrition & Spray Doses',
        shortTitle: 'Spray Doses',
        description: 'Standard fertilizer & 20-item spray dose calculator',
        icon: 'flask',
        path: '/admin/(tabs)/dose',
        params: { pillar: 'FARMERS' },
      },
      {
        id: 'crop-intelligence',
        title: 'Crop Intelligence Engine',
        shortTitle: 'Intelligence',
        description: 'Seasonal crop calendar, sowing advisories & weather insights',
        icon: 'sparkles',
        path: '/admin/(tabs)/crop-intelligence',
        params: { pillar: 'FARMERS' },
      },
      {
        id: 'farmer-orders',
        title: 'Farmer Orders & Supplies',
        shortTitle: 'Orders',
        description: 'Seeds, fertilizers & pesticide orders and village deliveries',
        icon: 'receipt',
        path: '/admin/(tabs)/admin-orders',
        params: { pillar: 'FARMERS' },
      },
      {
        id: 'farmer-wallets',
        title: 'Farmer & Doctor Ledgers',
        shortTitle: 'Ledgers',
        description: 'Farmer cashbacks, doctor consultation fees & payout statements',
        icon: 'wallet',
        path: '/admin/(tabs)/super-accounts',
        params: { section: 'WALLETS', pillar: 'FARMERS' },
      },
      {
        id: 'farmer-mandi-broadcast',
        title: 'Mandi Rates & Alerts',
        shortTitle: 'Mandi Rates',
        description: 'Daily mandi commodity prices, weather alerts & subsidy broadcasts',
        icon: 'megaphone',
        path: '/admin/(tabs)/admin_shop',
        params: { pillar: 'FARMERS' },
      },
    ],
  },
  {
    id: 'NEW_FINANCE',
    title: 'New Finance',
    shortTitle: 'New Finance',
    icon: 'cash-outline',
    iconFilled: 'cash',
    badge: 'Treasury & Ledgers',
    color: '#059669',
    subTabs: [
      {
        id: 'new-finance-hq',
        title: 'New Finance Command HQ',
        shortTitle: 'HQ Command',
        description: 'Executive treasury balance, revenue streams & cash flow telemetry',
        icon: 'speedometer',
        path: '/admin/(tabs)/new-finance',
        params: { pillar: 'NEW_FINANCE' },
      },
      {
        id: 'new-payout-approvals',
        title: 'Payout & Withdrawal Approvals',
        shortTitle: 'Payouts',
        description: 'Review pending UPI withdrawals, 2% TDS deductions & UTR proofs',
        icon: 'time',
        path: '/admin/(tabs)/super-accounts',
        params: { section: 'REQUESTS', pillar: 'NEW_FINANCE' },
      },
      {
        id: 'new-partner-ledgers',
        title: 'Partner & Party Ledgers',
        shortTitle: 'Bahi-Khata',
        description: 'Commission agents, dealers & multi-party khata statements',
        icon: 'briefcase',
        path: '/admin/(tabs)/super-accounts',
        params: { section: 'PARTNERS', pillar: 'NEW_FINANCE' },
      },
      {
        id: 'new-coupons-engine',
        title: 'Coupons & Referral Engine',
        shortTitle: 'Coupons',
        description: 'Generate discount vouchers, partner commissions & referral rules',
        icon: 'ticket',
        path: '/admin/(tabs)/super-coupons',
        params: { pillar: 'NEW_FINANCE' },
      },
      {
        id: 'new-platform-treasury',
        title: 'Platform Treasury Wallet',
        shortTitle: 'My Wallet',
        description: 'FarmsKing central reserve account, bonus disbursement & ledger',
        icon: 'card',
        path: '/admin/(tabs)/wallet',
        params: { pillar: 'NEW_FINANCE' },
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
    case 'NEW_FINANCE':
    case 'NEW-FINANCE':
      return 'NEW_FINANCE';
    case 'FARMERS':
    case 'FARMER':
      return 'FARMERS';
    case 'FINANCE':
    case 'ACCOUNTS':
    case 'TREASURY':
    case 'WALLET':
      return 'FINANCE';
    case 'ECOMMERCE':
    case 'COMMERCE':
    case 'MARKET':
      return 'COMMERCE';
    case 'FARMER_HUB':
    case 'GARDENER_HUB':
    case 'ECOSYSTEM':
    case 'FARM':
    case 'GARDEN':
      return 'ECOSYSTEM';
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

  // 0. Dedicated Farmers & Crop Doctors Hub Route or Pillar Parameter
  if (
    pathname === '/admin/(tabs)/farmers' ||
    pathname === '/(tabs)/farmers' ||
    pathname === '/farmers' ||
    pathname.includes('/farmers') ||
    pathname.endsWith('/farmers') ||
    effectivePillar === 'FARMERS'
  ) {
    return 'FARMERS';
  }

  // 0.1 Dedicated New Finance Hub Route or Pillar Parameter
  if (
    pathname === '/admin/(tabs)/new-finance' ||
    pathname === '/(tabs)/new-finance' ||
    pathname === '/new-finance' ||
    pathname.includes('/new-finance') ||
    pathname.endsWith('/new-finance') ||
    effectivePillar === 'NEW_FINANCE' ||
    effectivePillar === 'NEW-FINANCE'
  ) {
    return 'NEW_FINANCE';
  }

  // If currently in New Finance Hub and browsing its subtabs, preserve NEW_FINANCE hub
  if (currentPillarId === 'NEW_FINANCE' || currentPillarId === 'NEW-FINANCE') {
    if (
      pathname.includes('new-finance') ||
      pathname.includes('super-accounts') ||
      pathname.includes('super-coupons') ||
      pathname.includes('wallet')
    ) {
      return 'NEW_FINANCE';
    }
  }

  // If currently in Farmers Hub and browsing its subtabs, preserve FARMERS hub
  if (currentPillarId === 'FARMERS') {
    if (
      (pathname.includes('super-users') && (effectiveFilter === 'FARMER' || effectiveFilter === 'ADVISOR' || searchParams?.group === 'CLIENTS' || searchParams?.group === 'PARTNERS')) ||
      pathname.includes('super-crop-edit') ||
      pathname.includes('crop-disease-scanner') ||
      pathname.includes('satellite-map') ||
      pathname.includes('memberships') ||
      pathname.includes('dose') ||
      pathname.includes('crop-intelligence') ||
      pathname.includes('admin-orders') ||
      (pathname.includes('super-accounts') && searchParams?.section === 'WALLETS') ||
      pathname.includes('admin_shop')
    ) {
      return 'FARMERS';
    }
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
