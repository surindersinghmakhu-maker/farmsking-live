export type UserRole =
  | 'FARMER'
  | 'ADVISOR'
  | 'FARM_ADVISOR'
  | 'GARDEN_ADVISOR'
  | 'GARDENER'
  | 'CUSTOMER'
  | 'BUSINESS_PARTNER'
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'OPERATOR'
  | 'LABOUR'
  | 'MANAGER'
  | 'SUPERVISOR'
  | 'TECHNICAL_TRAINER';

/**
 * Shared, role-agnostic surface tokens — every role's theme spreads this
 * first, then overrides the color fields below with its own accent so each
 * role's dashboard is identifiable by color at a glance.
 */
const SURFACE = {
  bg: '#020d06',
  cardBg: '#04160c',
  text: '#ffffff',
  textMuted: '#94a3b8',
  border: 'rgba(0, 255, 135, 0.22)',
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
    headerBg: '#020b06',
    gradient: ['#020b06', '#041d0f'],
    heroGradient: ['#041d0f', '#020b06'],
    primary: '#00ff87',
    primaryLight: 'rgba(0, 255, 135, 0.15)',
    accent: '#10b981',
  },
  ADVISOR: {
    ...SURFACE,
    name: 'Advisor Dashboard',
    badge: 'Guide, monitor & support farmers',
    headerBg: '#020817',
    gradient: ['#020817', '#061330'],
    heroGradient: ['#061330', '#020817'],
    primary: '#38bdf8',
    primaryLight: 'rgba(56, 189, 248, 0.15)',
    accent: '#00ff87',
  },
  FARM_ADVISOR: {
    ...SURFACE,
    name: 'Advisor Dashboard',
    badge: 'Guide, monitor & support farmers',
    headerBg: '#020817',
    gradient: ['#020817', '#061330'],
    heroGradient: ['#061330', '#020817'],
    primary: '#38bdf8',
    primaryLight: 'rgba(56, 189, 248, 0.15)',
    accent: '#00ff87',
  },
  GARDEN_ADVISOR: {
    ...SURFACE,
    name: 'Advisor Dashboard',
    badge: 'Guide, monitor & support gardeners',
    headerBg: '#010f14',
    gradient: ['#010f14', '#04222b'],
    heroGradient: ['#04222b', '#010f14'],
    primary: '#06b6d4',
    primaryLight: 'rgba(6, 182, 212, 0.15)',
    accent: '#00ff87',
  },
  GARDENER: {
    ...SURFACE,
    name: 'Gardener Dashboard',
    badge: 'Manage gardens & maintenance',
    headerBg: '#12020a',
    gradient: ['#12020a', '#290618'],
    heroGradient: ['#290618', '#12020a'],
    primary: '#ec4899',
    primaryLight: 'rgba(236, 72, 153, 0.15)',
    accent: '#00ff87',
  },
  CUSTOMER: {
    ...SURFACE,
    name: 'Shopping',
    badge: 'Shop, track orders & support',
    headerBg: '#010d0c',
    gradient: ['#010d0c', '#041c19'],
    heroGradient: ['#041c19', '#010d0c'],
    primary: '#14b8a6',
    primaryLight: 'rgba(20, 184, 166, 0.15)',
    accent: '#00ff87',
  },
  BUSINESS_PARTNER: {
    ...SURFACE,
    name: 'Wallet',
    badge: 'Promote, earn & grow together',
    headerBg: '#100802',
    gradient: ['#100802', '#241204'],
    heroGradient: ['#241204', '#100802'],
    primary: '#f59e0b',
    primaryLight: 'rgba(245, 158, 11, 0.15)',
    accent: '#00ff87',
  },
  ADMIN: {
    ...SURFACE,
    name: 'Admin Dashboard',
    badge: 'Manage shop orders & products',
    headerBg: '#020b06',
    gradient: ['#020b06', '#041d0f'],
    heroGradient: ['#041d0f', '#020b06'],
    primary: '#00ff87',
    primaryLight: 'rgba(0, 255, 135, 0.15)',
    accent: '#10b981',
  },
  SUPER_ADMIN: {
    ...SURFACE,
    name: 'Super Admin',
    badge: 'Oversee the whole platform',
    headerBg: '#020617',
    gradient: ['#020617', '#0f172a'],
    heroGradient: ['#0f172a', '#020617'],
    primary: '#00ff87',
    primaryLight: 'rgba(0, 255, 135, 0.15)',
    accent: '#38bdf8',
  },
  OPERATOR: {
    ...SURFACE,
    name: 'Operator Desk',
    badge: 'Printing, packing & dispatch',
    headerBg: '#050b14',
    gradient: ['#050b14', '#0d1829'],
    heroGradient: ['#0d1829', '#050b14'],
    primary: '#475569',
    primaryLight: 'rgba(71, 85, 105, 0.15)',
    accent: '#00ff87',
  },
  LABOUR: {
    ...SURFACE,
    name: 'Labour Dashboard',
    badge: 'View your earnings, payments & balance',
    headerBg: '#120502',
    gradient: ['#120502', '#240b04'],
    heroGradient: ['#240b04', '#120502'],
    primary: '#f97316',
    primaryLight: 'rgba(249, 115, 22, 0.15)',
    accent: '#00ff87',
  },
  MANAGER: {
    ...SURFACE,
    name: 'Manager Dashboard',
    badge: 'Store & user operations',
    headerBg: '#060212',
    gradient: ['#060212', '#14062e'],
    heroGradient: ['#14062e', '#060212'],
    primary: '#a855f7',
    primaryLight: 'rgba(168, 85, 247, 0.15)',
    accent: '#00ff87',
  },
  SUPERVISOR: {
    ...SURFACE,
    name: 'Supervisor Dashboard',
    badge: 'Farm & field supervision',
    headerBg: '#020b06',
    gradient: ['#020b06', '#041d0f'],
    heroGradient: ['#041d0f', '#020b06'],
    primary: '#00ff87',
    primaryLight: 'rgba(0, 255, 135, 0.15)',
    accent: '#06b6d4',
  },
  TECHNICAL_TRAINER: {
    ...SURFACE,
    name: 'Technical Trainer',
    badge: 'Training & support',
    headerBg: '#020a1c',
    gradient: ['#020a1c', '#06173a'],
    heroGradient: ['#06173a', '#020a1c'],
    primary: '#38bdf8',
    primaryLight: 'rgba(56, 189, 248, 0.15)',
    accent: '#00ff87',
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
