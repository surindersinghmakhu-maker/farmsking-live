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
 * Organizes 100% of platform tools, portals, registries, and operational utilities
 * into 5 clear, high-performance domain hubs.
 */
export const ADMIN_PILLARS: NavigationPillar[] = [
  {
    id: 'EXECUTIVE',
    title: 'EXECUTIVE COMMAND',
    shortTitle: 'Executive',
    icon: 'pulse-outline',
    iconFilled: 'pulse',
    badge: 'Command Hub',
    color: '#10b981',
    subTabs: [
      {
        id: 'overview',
        title: 'Platform Overview',
        shortTitle: 'Overview',
        description: 'Real-time KPIs, active orders & telemetry',
        icon: 'home',
        path: '/admin/(tabs)',
      },
      {
        id: 'support-chat',
        title: 'Support Concierge Desk',
        shortTitle: 'Help Desk',
        description: 'Live helpdesk with farmers, doctors & sellers',
        icon: 'chatbubbles',
        path: '/admin/(tabs)/chat',
      },
      {
        id: 'audit-log',
        title: 'System Audit Trail',
        shortTitle: 'Audit Trail',
        description: 'Security events, login sessions & admin logs',
        icon: 'time',
        path: '/admin/(tabs)/super-audit-log',
      },
      {
        id: 'central-hub',
        title: 'Central Hub & Guides',
        shortTitle: 'Central Hub',
        description: 'Knowledge base, manuals & workflow charts',
        icon: 'grid',
        path: '/admin/(tabs)/admin_more',
      },
      {
        id: 'notifications',
        title: 'System Broadcasts & Alerts',
        shortTitle: 'Alerts',
        description: 'Real-time critical events & announcements',
        icon: 'notifications',
        path: '/notifications',
      },
      {
        id: 'admin-profile',
        title: 'Admin Security & Profile',
        shortTitle: 'Profile',
        description: 'Executive credentials & session security',
        icon: 'shield-checkmark',
        path: '/profile',
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
        description: 'Inventory management, pricing & stock status',
        icon: 'cube',
        path: '/admin/(tabs)/admin-products',
      },
      {
        id: 'orders',
        title: 'Trade Orders',
        shortTitle: 'Orders',
        description: 'Live purchases, dispatch tracking & receipts',
        icon: 'receipt',
        path: '/admin/(tabs)/admin-orders',
      },
      {
        id: 'admin-shop',
        title: 'Store Operations Hub',
        shortTitle: 'Store Hub',
        description: 'Merchant center summary & store health',
        icon: 'storefront',
        path: '/admin/(tabs)/admin_shop',
      },
      {
        id: 'seller-directory',
        title: 'Store Sellers & KYC',
        shortTitle: 'Sellers',
        description: 'Approve store licenses, GSTIN & bank KYC',
        icon: 'shield-checkmark',
        path: '/admin/(tabs)/admin-sellers',
      },
      {
        id: 'seller-payouts',
        title: 'Settlements & Payouts',
        shortTitle: 'Payouts',
        description: 'UPI disbursements & automated ledger entries',
        icon: 'card',
        path: '/admin/(tabs)/seller-payouts',
      },
      {
        id: 'global-ledger',
        title: 'Global Balance Sheet',
        shortTitle: 'Ledger',
        description: 'Platform treasury, wallets & credit management',
        icon: 'wallet',
        path: '/admin/(tabs)/super-accounts',
      },
      {
        id: 'trader-directory',
        title: 'Mandi Traders',
        shortTitle: 'Traders',
        description: 'Wholesale grain dealers & commission agents',
        icon: 'swap-horizontal',
        path: '/admin/(tabs)/super-users',
        params: { group: 'CLIENTS', filter: 'TRADER' },
      },
      {
        id: 'coupons',
        title: 'VIP Pass & Coupons',
        shortTitle: 'Coupons',
        description: 'Discount vouchers, promo keys & usage limits',
        icon: 'ticket',
        path: '/admin/(tabs)/super-coupons',
      },
      {
        id: 'memberships',
        title: 'VIP Verifications & Plans',
        shortTitle: 'VIP Approvals',
        description: 'Verify incoming plan payment proofs & UPI',
        icon: 'ribbon',
        path: '/admin/(tabs)/super-accounts',
        params: { section: 'PARTNERS', sub: 'MEMBERSHIPS' },
      },
      {
        id: 'memberships-catalog',
        title: 'VIP Pass Scheme & Pricing',
        shortTitle: 'VIP Plans',
        description: 'Farmer subscription tiers & pricing packages',
        icon: 'pricetags',
        path: '/admin/(tabs)/memberships',
      },
      {
        id: 'order-tracking',
        title: 'Live Logistics & Shipments',
        shortTitle: 'Logistics',
        description: 'GPS courier dispatch & delivery status',
        icon: 'navigate',
        path: '/order-tracking',
      },
      {
        id: 'public-store',
        title: 'Public Storefront Simulator',
        shortTitle: 'Storefront',
        description: 'Preview customer shopping experience live',
        icon: 'globe',
        path: '/public-store',
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
        description: 'Registered farmers, landholdings & crops',
        icon: 'leaf',
        path: '/admin/(tabs)/super-users',
        params: { group: 'CLIENTS', filter: 'FARMER' },
      },
      {
        id: 'garden-system',
        title: 'Garden Care System',
        shortTitle: 'Garden Care',
        description: 'Urban gardening, plant stages & care schedules',
        icon: 'flower',
        path: '/admin/(tabs)/garden',
      },
      {
        id: 'crop-doctors',
        title: 'Crop Specialists & Doctors',
        shortTitle: 'Doctors',
        description: 'Certified agronomists & crop health advisors',
        icon: 'medical',
        path: '/admin/(tabs)/super-users',
        params: { group: 'PARTNERS', filter: 'FARM_ADVISOR' },
      },
      {
        id: 'satellite-map',
        title: 'Satellite Farm Radar',
        shortTitle: 'Radar',
        description: 'ISRO high-res NDVI heatmaps & soil moisture',
        icon: 'planet',
        path: '/admin/(tabs)/satellite-map',
      },
      {
        id: 'ai-scanner',
        title: 'AI Plant Diagnostics',
        shortTitle: 'AI Scanner',
        description: 'Neural crop disease detection & scan logs',
        icon: 'scan',
        path: '/admin/(tabs)/crop-disease-scanner',
      },
      {
        id: 'crop-intelligence',
        title: 'Crop Intelligence Engine',
        shortTitle: 'Engine',
        description: 'Yield forecasts, mandi rates & weather advice',
        icon: 'trending-up',
        path: '/admin/(tabs)/crop-intelligence',
      },
      {
        id: 'plant-doses',
        title: 'Plant Nutrition & Doses',
        shortTitle: 'Plant Care',
        description: 'Stage-wise fertilizer & pesticide schedules',
        icon: 'nutrition',
        path: '/admin/(tabs)/dose',
      },
      {
        id: 'crop-master',
        title: 'Crop Master Registry',
        shortTitle: 'Registry',
        description: 'Manage seed varieties, seasons & crop types',
        icon: 'create',
        path: '/admin/(tabs)/super-crop-edit',
      },
      {
        id: 'market-consult',
        title: 'Crop Clinic Consultation',
        shortTitle: 'Clinic',
        description: 'Doctor advisory desk & farmer cases',
        icon: 'medkit',
        path: '/admin/(tabs)/market',
      },
      {
        id: 'farmer-onboarding',
        title: 'Farmer Onboarding Portal',
        shortTitle: 'Farmer Setup',
        description: 'Assist new farmers with profile & farm setup',
        icon: 'person-add',
        path: '/farmer-profile-setup',
      },
      {
        id: 'advisor-onboarding',
        title: 'Doctor Credentialing Setup',
        shortTitle: 'Doctor Setup',
        description: 'Onboard and verify agri specialist credentials',
        icon: 'school',
        path: '/advisor-profile',
      },
    ],
  },
  {
    id: 'PLATFORM',
    title: 'PLATFORM & DIRECTORY',
    shortTitle: 'Platform',
    icon: 'settings-outline',
    iconFilled: 'settings',
    badge: 'Control Center',
    color: '#6366f1',
    subTabs: [
      {
        id: 'all-users',
        title: 'Platform User Directory',
        shortTitle: 'Directory',
        description: 'Global user management, search & filters',
        icon: 'people',
        path: '/admin/(tabs)/super-users',
      },
      {
        id: 'staff-roster',
        title: 'Staff Permissions & Roles',
        shortTitle: 'Permissions',
        description: 'Admin privileges, RBAC rules & operator roles',
        icon: 'key',
        path: '/admin/(tabs)/super-users',
        params: { group: 'ADMINS' },
      },
      {
        id: 'trainer-dashboard',
        title: 'Field Operations & Trainers',
        shortTitle: 'Trainers',
        description: 'Field ops staff, training camps & trainers',
        icon: 'school',
        path: '/admin/(tabs)/trainer-dashboard',
      },
      {
        id: 'operators',
        title: 'Dispatch & Orders Desk',
        shortTitle: 'Dispatch',
        description: 'Warehouse fulfillment, packing & shipping',
        icon: 'print',
        path: '/admin/(tabs)/operator-orders',
      },
      {
        id: 'infrastructure-settings',
        title: 'Infrastructure Settings',
        shortTitle: 'Settings',
        description: 'System maintenance flags, cache & CDN toggles',
        icon: 'settings',
        path: '/admin/(tabs)/super-settings',
      },
      {
        id: 'cpanel-integrations',
        title: 'Service Integrations & C-Panel',
        shortTitle: 'C-Panel',
        description: 'SMS gateways, WhatsApp APIs & cloud webhooks',
        icon: 'options',
        path: '/admin/(tabs)/cpanel',
      },
      {
        id: 'labours',
        title: 'Agricultural Workforce',
        shortTitle: 'Workforce',
        description: 'Farm labor directory, job wages & hiring',
        icon: 'hammer',
        path: '/admin/(tabs)/super-users',
        params: { group: 'CLIENTS', filter: 'LABOUR' },
      },
      {
        id: 'staff-onboarding',
        title: 'Staff Profile Onboarding',
        shortTitle: 'Staff Setup',
        description: 'Onboard platform managers & field operators',
        icon: 'id-card',
        path: '/staff-profile-setup',
      },
    ],
  },
  {
    id: 'UTILITIES',
    title: 'TOOLS & UTILITIES',
    shortTitle: 'Utilities',
    icon: 'construct-outline',
    iconFilled: 'construct',
    badge: 'Ops & Tools',
    color: '#8b5cf6',
    subTabs: [
      {
        id: 'notification-settings',
        title: 'Notification Settings',
        shortTitle: 'Alert Config',
        description: 'Configure automated push, SMS & email rules',
        icon: 'notifications-circle',
        path: '/notification-settings',
      },
      {
        id: 'seo-console',
        title: 'SEO & Discovery Console',
        shortTitle: 'SEO Index',
        description: 'Meta tags, OpenGraph previews & search indexing',
        icon: 'search',
        path: '/seo',
      },
      {
        id: 'support-desk',
        title: 'Executive Support Desk',
        shortTitle: 'Support Desk',
        description: 'Platform issue tickets & farmer helpdesk',
        icon: 'headset',
        path: '/support',
      },
      {
        id: 'contact-us',
        title: 'Helpline & Communications',
        shortTitle: 'Helpline',
        description: 'Headquarters contact details & emergency lines',
        icon: 'call',
        path: '/contact-us',
      },
      {
        id: 'legal-compliance',
        title: 'Legal & Privacy Compliance',
        shortTitle: 'Compliance',
        description: 'Privacy policy, terms of service & farmer rights',
        icon: 'document-lock',
        path: '/privacy-policy',
      },
      {
        id: 'seller-sandbox',
        title: 'Storefront Seller Sandbox',
        shortTitle: 'Seller Hub',
        description: 'Simulate vendor merchant center & store view',
        icon: 'storefront',
        path: '/seller-dashboard',
      },
    ],
  },
];

/**
 * Normalizes legacy pillar IDs into the 5 modern hub IDs
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
    case 'UTILITIES':
    case 'TOOLS':
    case 'OTHER':
      return 'UTILITIES';
    case 'EXECUTIVE':
    default:
      return 'EXECUTIVE';
  }
}

/**
 * Automatically detects the active pillar ID given the current URL pathname and query params.
 * Seamlessly maps all 45+ admin routes to one of the 5 Master Domain Hubs.
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

  // 1. Executive Command routes
  if (
    pathname === '/admin/(tabs)' ||
    pathname === '/(tabs)' ||
    pathname === '/' ||
    pathname.includes('/chat') ||
    pathname.includes('super-audit-log') ||
    pathname.includes('admin_more') ||
    (pathname === '/notifications' || pathname.endsWith('/notifications')) ||
    (pathname === '/profile' || pathname.endsWith('/profile'))
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
    pathname.includes('order-tracking') ||
    pathname.includes('public-store') ||
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
    pathname.includes('market') ||
    pathname.includes('farmer-profile') ||
    pathname.includes('advisor-profile') ||
    pathname.endsWith('/farmers') ||
    pathname.endsWith('/farm') ||
    pathname.endsWith('/schedule') ||
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
    pathname.includes('staff-profile') ||
    (pathname.includes('super-users') && (activeGroup === 'ADMINS' || activeFilter === 'SUPER_ADMIN' || activeFilter === 'MANAGER' || activeFilter === 'LABOUR')) ||
    pathname.includes('super-users')
  ) {
    return 'PLATFORM';
  }

  // 5. Utilities, Operations & Compliance routes
  if (
    pathname.includes('notification-settings') ||
    pathname.includes('seo') ||
    pathname.includes('support') ||
    pathname.includes('contact-us') ||
    pathname.includes('privacy-policy') ||
    pathname.includes('seller-dashboard')
  ) {
    return 'UTILITIES';
  }

  return normalizePillarId(currentPillarId);
}
