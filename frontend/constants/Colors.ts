export type UserRole =
  | 'FARMER'
  | 'FARM_ADVISOR'
  | 'GARDEN_ADVISOR'
  | 'GARDENER'
  | 'CUSTOMER'
  | 'BUSINESS_PARTNER'
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'OPERATOR'
  | 'LABOUR';

/**
 * Shared, role-agnostic surface tokens — every role's theme spreads this
 * first, then overrides the color fields below with its own accent so each
 * role's dashboard is identifiable by color at a glance.
 */
const SURFACE = {
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
    ...SURFACE,
    name: 'Farmer Dashboard',
    badge: 'Manage your farms & profits',
    headerBg: '#15803d',
    gradient: ['#15803d', '#16a34a'],
    heroGradient: ['#ffffff', '#f0fdf4'],
    primary: '#16a34a',
    primaryLight: '#dcfce7',
    accent: '#22c55e',
  },
  FARM_ADVISOR: {
    ...SURFACE,
    name: 'Advisor Dashboard',
    badge: 'Guide, monitor & support farmers',
    headerBg: '#1d4ed8',
    gradient: ['#1d4ed8', '#2563eb'],
    heroGradient: ['#ffffff', '#eff6ff'],
    primary: '#2563eb',
    primaryLight: '#dbeafe',
    accent: '#3b82f6',
  },
  GARDEN_ADVISOR: {
    ...SURFACE,
    name: 'Advisor Dashboard',
    badge: 'Guide, monitor & support gardeners',
    headerBg: '#0e7490',
    gradient: ['#0e7490', '#0891b2'],
    heroGradient: ['#ffffff', '#ecfeff'],
    primary: '#0891b2',
    primaryLight: '#cffafe',
    accent: '#22d3ee',
  },
  GARDENER: {
    ...SURFACE,
    name: 'Gardener Dashboard',
    badge: 'Manage gardens & maintenance',
    headerBg: '#be185d',
    gradient: ['#be185d', '#db2777'],
    heroGradient: ['#ffffff', '#fdf2f8'],
    primary: '#db2777',
    primaryLight: '#fce7f3',
    accent: '#ec4899',
  },
  CUSTOMER: {
    ...SURFACE,
    name: 'Shopping',
    badge: 'Shop, track orders & support',
    headerBg: '#0f766e',
    gradient: ['#0f766e', '#0d9488'],
    heroGradient: ['#ffffff', '#f0fdfa'],
    primary: '#0d9488',
    primaryLight: '#ccfbf1',
    accent: '#14b8a6',
  },
  BUSINESS_PARTNER: {
    ...SURFACE,
    name: 'My Business',
    badge: 'Promote, earn & grow together',
    headerBg: '#b45309',
    gradient: ['#b45309', '#d97706'],
    heroGradient: ['#ffffff', '#fffbeb'],
    primary: '#d97706',
    primaryLight: '#fef3c7',
    accent: '#f59e0b',
  },
  ADMIN: {
    ...SURFACE,
    name: 'Admin Dashboard',
    badge: 'Manage shop orders & products',
    headerBg: '#6d28d9',
    gradient: ['#6d28d9', '#7c3aed'],
    heroGradient: ['#ffffff', '#f5f3ff'],
    primary: '#7c3aed',
    primaryLight: '#ede9fe',
    accent: '#8b5cf6',
  },
  SUPER_ADMIN: {
    ...SURFACE,
    name: 'Super Admin',
    badge: 'Oversee the whole platform',
    headerBg: '#020617',
    gradient: ['#020617', '#0f172a'],
    heroGradient: ['#ffffff', '#f1f5f9'],
    primary: '#0f172a',
    primaryLight: '#e2e8f0',
    accent: '#334155',
  },
  OPERATOR: {
    ...SURFACE,
    name: 'Operator Desk',
    badge: 'Printing, packing & dispatch',
    headerBg: '#334155',
    gradient: ['#334155', '#475569'],
    heroGradient: ['#ffffff', '#f8fafc'],
    primary: '#475569',
    primaryLight: '#e2e8f0',
    accent: '#64748b',
  },
  LABOUR: {
    ...SURFACE,
    name: 'Labour Dashboard',
    badge: 'View your earnings, payments & balance',
    headerBg: '#c2410c',
    gradient: ['#c2410c', '#ea580c'],
    heroGradient: ['#ffffff', '#fff7ed'],
    primary: '#ea580c',
    primaryLight: '#ffedd5',
    accent: '#f97316',
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
