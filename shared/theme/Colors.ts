export type UserRole =
  | 'FARMER'
  | 'ADVISOR'
  | 'FARM_ADVISOR'
  | 'GARDEN_ADVISOR'
  | 'GARDENER'
  | 'CUSTOMER'
  | 'AGENT'
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'OPERATOR'
  | 'LABOUR'
  | 'MANAGER'
  | 'SUPERVISOR'
  | 'TECHNICAL_TRAINER'
  | 'ACCOUNTANT'
  | 'SELLER'
  | 'TRADER'
  | 'NURSERY_OWNER';

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
    name: 'Crop Doctor Desk',
    badge: 'Expert agronomy & farmer queries',
    headerBg: '#04101c',
    gradient: ['#04101c', '#062038'],
    heroGradient: ['#062038', '#04101c'],
    primary: '#38bdf8',
    primaryLight: 'rgba(56, 189, 248, 0.15)',
    accent: '#00ff87',
  },
  FARM_ADVISOR: {
    ...SURFACE,
    name: 'Farm Advisor Portal',
    badge: 'Field crop pathology & soil science',
    headerBg: '#04101c',
    gradient: ['#04101c', '#062038'],
    heroGradient: ['#062038', '#04101c'],
    primary: '#38bdf8',
    primaryLight: 'rgba(56, 189, 248, 0.15)',
    accent: '#00ff87',
  },
  GARDEN_ADVISOR: {
    ...SURFACE,
    name: 'Garden Advisor Console',
    badge: 'Horticulture, terrace & urban plant care',
    headerBg: '#0d041a',
    gradient: ['#0d041a', '#1e0938'],
    heroGradient: ['#1e0938', '#0d041a'],
    primary: '#a855f7',
    primaryLight: 'rgba(168, 85, 247, 0.15)',
    accent: '#f43f5e',
  },
  GARDENER: {
    ...SURFACE,
    name: 'Gardener Green Space',
    badge: 'Track backyard & potted plants',
    headerBg: '#03120a',
    gradient: ['#03120a', '#072415'],
    heroGradient: ['#072415', '#03120a'],
    primary: '#22c55e',
    primaryLight: 'rgba(34, 197, 94, 0.15)',
    accent: '#84cc16',
  },
  CUSTOMER: {
    ...SURFACE,
    name: 'Agri Marketplace',
    badge: 'Verified seeds, fertilizers & tools',
    headerBg: '#010d0c',
    gradient: ['#010d0c', '#041c19'],
    heroGradient: ['#041c19', '#010d0c'],
    primary: '#14b8a6',
    primaryLight: 'rgba(20, 184, 166, 0.15)',
    accent: '#06b6d4',
  },
  AGENT: {
    ...SURFACE,
    name: 'Village Franchise Hub',
    badge: 'Onboard farmers & distribute seeds',
    headerBg: '#120701',
    gradient: ['#120701', '#241003'],
    heroGradient: ['#241003', '#120701'],
    primary: '#f97316',
    primaryLight: 'rgba(249, 115, 22, 0.15)',
    accent: '#eab308',
  },
  ADMIN: {
    ...SURFACE,
    name: 'Admin Command Center',
    badge: 'Governance, audits & master controls',
    headerBg: '#130407',
    gradient: ['#130407', '#260a10'],
    heroGradient: ['#260a10', '#130407'],
    primary: '#f43f5e',
    primaryLight: 'rgba(244, 63, 94, 0.15)',
    accent: '#ec4899',
  },
  SUPER_ADMIN: {
    ...SURFACE,
    name: 'Executive Master Control',
    badge: 'Total platform autonomy & security',
    headerBg: '#0f0219',
    gradient: ['#0f0219', '#210536'],
    heroGradient: ['#210536', '#0f0219'],
    primary: '#c084fc',
    primaryLight: 'rgba(192, 132, 252, 0.15)',
    accent: '#f43f5e',
  },
  OPERATOR: {
    ...SURFACE,
    name: 'Dispatch & Ops Terminal',
    badge: 'Order fulfillment & inventory triage',
    headerBg: '#0f0b01',
    gradient: ['#0f0b01', '#241a02'],
    heroGradient: ['#241a02', '#0f0b01'],
    primary: '#eab308',
    primaryLight: 'rgba(234, 179, 8, 0.15)',
    accent: '#f97316',
  },
  LABOUR: {
    ...SURFACE,
    name: 'Worker Shift Tracker',
    badge: 'Daily wage tasks & farm attendance',
    headerBg: '#020d0e',
    gradient: ['#020d0e', '#051f21'],
    heroGradient: ['#051f21', '#020d0e'],
    primary: '#06b6d4',
    primaryLight: 'rgba(6, 182, 212, 0.15)',
    accent: '#3b82f6',
  },
  MANAGER: {
    ...SURFACE,
    name: 'Regional Operations Desk',
    badge: 'District workflows & staff routing',
    headerBg: '#070514',
    gradient: ['#070514', '#110d2e'],
    heroGradient: ['#110d2e', '#070514'],
    primary: '#818cf8',
    primaryLight: 'rgba(129, 140, 248, 0.15)',
    accent: '#a855f7',
  },
  SUPERVISOR: {
    ...SURFACE,
    name: 'Field Operations Terminal',
    badge: 'On-ground field inspections & tasks',
    headerBg: '#0a0d02',
    gradient: ['#0a0d02', '#171e04'],
    heroGradient: ['#171e04', '#0a0d02'],
    primary: '#84cc16',
    primaryLight: 'rgba(132, 204, 22, 0.15)',
    accent: '#22c55e',
  },
  TECHNICAL_TRAINER: {
    ...SURFACE,
    name: 'Agronomy Training Academy',
    badge: 'Farmer workshops & video guidance',
    headerBg: '#04101c',
    gradient: ['#04101c', '#062038'],
    heroGradient: ['#062038', '#04101c'],
    primary: '#38bdf8',
    primaryLight: 'rgba(56, 189, 248, 0.15)',
    accent: '#00ff87',
  },
  ACCOUNTANT: {
    ...SURFACE,
    name: 'Accountant & CA Desk',
    badge: 'GST GSTR-8, Income Tax TDS & Statutory Compliance',
    headerBg: '#065f46',
    gradient: ['#065f46', '#047857'],
    heroGradient: ['#ffffff', '#ecfdf5'],
    primary: '#059669',
    primaryLight: '#d1fae5',
    accent: '#10b981',
  },
  SELLER: {
    ...SURFACE,
    name: 'Seller Dashboard',
    badge: 'Store Products & Vendor Orders',
    headerBg: '#090e17',
    gradient: ['#090e17', '#0f172a'],
    heroGradient: ['#0f172a', '#090e17'],
    primary: '#10b981',
    primaryLight: 'rgba(16, 185, 129, 0.15)',
    accent: '#38bdf8',
  },
  TRADER: {
    ...SURFACE,
    name: 'Trader & Buyer Desk',
    badge: 'Shop inputs & track wholesale buys',
    headerBg: '#010d0c',
    gradient: ['#010d0c', '#041c19'],
    heroGradient: ['#041c19', '#010d0c'],
    primary: '#38bdf8',
    primaryLight: 'rgba(56, 189, 248, 0.15)',
    accent: '#10b981',
  },
  NURSERY_OWNER: {
    ...SURFACE,
    name: 'Nursery Hub',
    badge: 'Seedlings, Batches & Dispatch Escrow',
    headerBg: '#021209',
    gradient: ['#021209', '#042413'],
    heroGradient: ['#042413', '#021209'],
    primary: '#10b981',
    primaryLight: 'rgba(16, 185, 129, 0.15)',
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
