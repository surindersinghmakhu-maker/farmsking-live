export type UserRole = 'FARMER' | 'FARM_ADVISOR' | 'GARDEN_ADVISOR' | 'GARDENER' | 'CUSTOMER' | 'BUSINESS_PARTNER' | 'ADMIN';

/**
 * FarmsKing uses one brand identity (green) across every role — role is
 * communicated via badge text/icon, not a different color per screen.
 */
const BRAND = {
  headerBg: '#15803d',
  gradient: ['#15803d', '#16a34a'] as [string, string],
  heroGradient: ['#ffffff', '#f0fdf4'] as [string, string],
  primary: '#16a34a',
  primaryLight: '#dcfce7',
  accent: '#22c55e',
  bg: '#f7f9f8',
  cardBg: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
};

export const RoleThemes: Record<UserRole, {
  name: string;
  badge: string;
  headerBg: string;
  /** Brand gradient, used for headers and primary CTAs. */
  gradient: [string, string];
  /** Faint white -> brand-tinted gradient, used behind hero stat cards. */
  heroGradient: [string, string];
  primary: string;
  primaryLight: string;
  accent: string;
  bg: string;
  cardBg: string;
  text: string;
  textMuted: string;
  border: string;
}> = {
  FARMER: {
    ...BRAND,
    name: 'My Farms',
    badge: 'Manage your farms & profits',
  },
  FARM_ADVISOR: {
    ...BRAND,
    name: 'My Farmers',
    badge: 'Guide, monitor & support farmers',
  },
  GARDEN_ADVISOR: {
    ...BRAND,
    name: 'My Gardeners',
    badge: 'Guide, monitor & support gardeners',
  },
  GARDENER: {
    ...BRAND,
    name: 'My Garden',
    badge: 'Manage gardens & maintenance',
  },
  CUSTOMER: {
    ...BRAND,
    name: 'Shopping',
    badge: 'Shop, track orders & support',
  },
  BUSINESS_PARTNER: {
    ...BRAND,
    name: 'My Business',
    badge: 'Promote, earn & grow together',
  },
  ADMIN: {
    ...BRAND,
    name: 'Admin Dashboard',
    badge: 'Oversee the whole platform',
  },
};

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#166534',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#166534',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#22c55e',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#22c55e',
  },
};
