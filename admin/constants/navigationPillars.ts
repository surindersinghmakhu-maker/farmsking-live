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
    title: 'EXECUTIVE COMMAND',
    shortTitle: 'Executive',
    icon: 'pulse-outline',
    iconFilled: 'pulse',
    badge: 'Command HQ',
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
    title: 'COMMERCE & ORDERS',
    shortTitle: 'Commerce',
    icon: 'bag-handle-outline',
    iconFilled: 'bag-handle',
    badge: 'Trade & Orders',
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
        title: 'Orders & Dispatch',
        shortTitle: 'Orders',
        description: 'Customer purchases, packaging & tracking',
        icon: 'receipt',
        path: '/admin/(tabs)/admin-orders',
      },
      {
        id: 'seller-directory',
        title: 'Seller Stores & KYC',
        shortTitle: 'Seller KYC',
        description: 'Review merchant licenses, GSTIN & store approval',
        icon: 'ribbon',
        path: '/admin/(tabs)/admin-sellers',
      },
      {
        id: 'global-ledger',
        title: 'Treasury & Payouts',
        shortTitle: 'Treasury',
        description: 'Financial balance sheets, UPI transfers & wallet ledger',
        icon: 'wallet',
        path: '/admin/(tabs)/super-accounts',
      },
      {
        id: 'coupons',
        title: 'Coupons & VIP Passes',
        shortTitle: 'Coupons',
        description: 'Discount vouchers, promo codes & memberships',
        icon: 'ticket',
        path: '/admin/(tabs)/super-coupons',
      },
    ],
  },
  {
    id: 'ECOSYSTEM',
    title: 'AGRI-ECOSYSTEM',
    shortTitle: 'Agri-Hub',
    icon: 'leaf-outline',
    iconFilled: 'leaf',
    badge: 'Farm & Care',
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
    id: 'USERS',
    title: 'USER DIRECTORY',
    shortTitle: 'Users',
    icon: 'people-outline',
    iconFilled: 'people',
    badge: 'User Hub',
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
    title: 'SYSTEM & SETTINGS',
    shortTitle: 'System Ops',
    icon: 'construct-outline',
    iconFilled: 'construct',
    badge: 'System Ops',
    color: '#8b5cf6',
    subTabs: [
      {
        id: 'infrastructure-settings',
        title: 'System Configuration',
        shortTitle: 'Settings',
        description: 'Maintenance flags, system caching & feature switches',
        icon: 'settings',
        path: '/admin/(tabs)/super-settings',
      },
      {
        id: 'cpanel-integrations',
        title: 'C-Panel & Integrations',
        shortTitle: 'C-Panel',
        description: 'SMS gateways, WhatsApp APIs & cloud webhooks',
        icon: 'options',
        path: '/admin/(tabs)/cpanel',
      },
      {
        id: 'central-hub',
        title: 'Operations Knowledge Base',
        shortTitle: 'Operations Hub',
        description: 'Platform documentation, manuals & team workspaces',
        icon: 'grid',
        path: '/admin/(tabs)/admin_more',
      },
      {
        id: 'notification-settings',
        title: 'Alerts & Messaging Rules',
        shortTitle: 'Alert Rules',
        description: 'Configure automated push, SMS & email notifications',
        icon: 'notifications-circle',
        path: '/notification-settings',
      },
      {
        id: 'seo-console',
        title: 'SEO & Search Console',
        shortTitle: 'SEO Index',
        description: 'Meta tags, OpenGraph previews & search indexing',
        icon: 'search',
        path: '/seo',
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
 * User Directory (super-users) is strictly and exclusively routed to USERS.
 */
export function detectPillarFromRoute(
  pathname: string,
  searchParams?: Record<string, any>,
  currentPillarId?: string
): string {
  if (!pathname) return normalizePillarId(currentPillarId);

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

  // 2. User Directory routes (super-users & onboarding EXCLUSIVELY here)
  if (
    pathname.includes('super-users') ||
    pathname.includes('staff-profile') ||
    pathname.includes('farmer-profile') ||
    pathname.includes('advisor-profile')
  ) {
    return 'USERS';
  }

  // 3. Commerce & Orders routes
  if (
    pathname.includes('admin-products') ||
    pathname.includes('admin-orders') ||
    pathname.includes('operator-orders') ||
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
    pathname.endsWith('/shop')
  ) {
    return 'COMMERCE';
  }

  // 4. Agri-Ecosystem & Garden Care routes
  let activeMode = searchParams?.mode;
  if (typeof window !== 'undefined' && !activeMode) {
    try {
      activeMode = new URLSearchParams(window.location.search).get('mode') || undefined;
    } catch {}
  }

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
    pathname.endsWith('/records') ||
    activeMode === 'GARDEN'
  ) {
    return 'ECOSYSTEM';
  }

  // 5. System Operations & Settings routes
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
