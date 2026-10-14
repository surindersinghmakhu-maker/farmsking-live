import { UserRole } from '@/constants/Colors';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type PortalId = 'ADMIN_HQ' | 'GARDEN' | 'SHOP' | 'FARMER' | 'STAFF';

export interface PortalTheme {
  name: string;
  tagline: string;
  badge: string;
  urlPrefix: string;
  primaryColor: string;
  accentColor: string;
  bgGradient: [string, string];
  sidebarBg: string;
  icon: string;
  allowedRoles: string[];
}

export const PORTALS: Record<PortalId, PortalTheme> = {
  ADMIN_HQ: {
    name: 'FarmsKing Command',
    tagline: 'Master Executive Control Center',
    badge: 'HQ',
    urlPrefix: '/admin/(tabs)',
    primaryColor: '#10b981',
    accentColor: '#34d399',
    bgGradient: ['#040f1c', '#061a30'],
    sidebarBg: '#040f1c',
    icon: 'shield-checkmark',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
  },
  GARDEN: {
    name: 'GreenSpace™',
    tagline: 'Your Garden, Elevated',
    badge: 'GARDEN',
    urlPrefix: '/garden/(tabs)',
    primaryColor: '#ec4899',
    accentColor: '#10b981',
    bgGradient: ['#1a0a14', '#0d1a12'],
    sidebarBg: '#150811',
    icon: 'flower',
    allowedRoles: ['GARDENER', 'GARDEN_ADVISOR', 'SUPER_ADMIN', 'ADMIN'],
  },
  SHOP: {
    name: 'FarmsKing Commerce',
    tagline: 'Agri-Market, Powered',
    badge: 'COMMERCE',
    urlPrefix: '/shop/(tabs)',
    primaryColor: '#0284c7',
    accentColor: '#f59e0b',
    bgGradient: ['#0a1424', '#081c38'],
    sidebarBg: '#071224',
    icon: 'bag-handle',
    allowedRoles: ['SELLER', 'OPERATOR', 'TRADER', 'SUPER_ADMIN', 'ADMIN'],
  },
  FARMER: {
    name: 'Agri-Hub',
    tagline: 'Intelligence for Every Field',
    badge: 'AGRI',
    urlPrefix: '/farmer/(tabs)',
    primaryColor: '#16a34a',
    accentColor: '#84cc16',
    bgGradient: ['#07170c', '#0c2414'],
    sidebarBg: '#07170c',
    icon: 'leaf',
    allowedRoles: ['FARMER', 'SUPERVISOR', 'LABOUR', 'FARM_ADVISOR', 'SUPER_ADMIN', 'ADMIN'],
  },
  STAFF: {
    name: 'Operations Desk',
    tagline: 'Command. Coordinate. Deliver.',
    badge: 'OPERATIONS',
    urlPrefix: '/staff/(tabs)',
    primaryColor: '#6366f1',
    accentColor: '#a78bfa',
    bgGradient: ['#0c0a21', '#141038'],
    sidebarBg: '#0c0a21',
    icon: 'people',
    allowedRoles: ['MANAGER', 'TECHNICAL_TRAINER', 'BUSINESS_PARTNER', 'SUPER_ADMIN', 'ADMIN'],
  },
};

const LAST_PORTAL_STORAGE_KEY = 'farmsking_active_portal_v2';

/**
 * Determine default portal URL for a given role
 */
export function getPortalForRole(role?: string | null): PortalId {
  if (!role) return 'ADMIN_HQ';
  const r = role.toUpperCase();

  if (['GARDENER', 'GARDEN_ADVISOR'].includes(r)) return 'GARDEN';
  if (['SELLER', 'TRADER'].includes(r)) return 'SHOP';
  if (['FARMER', 'SUPERVISOR', 'LABOUR', 'FARM_ADVISOR'].includes(r)) return 'FARMER';
  if (['MANAGER', 'TECHNICAL_TRAINER', 'BUSINESS_PARTNER', 'OPERATOR'].includes(r)) return 'STAFF';

  return 'ADMIN_HQ';
}

/**
 * Save user's active portal preference
 */
export async function saveActivePortal(portalId: PortalId): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LAST_PORTAL_STORAGE_KEY, portalId);
      }
    } else {
      await SecureStore.setItemAsync(LAST_PORTAL_STORAGE_KEY, portalId);
    }
  } catch (err) {
    console.warn('Failed to save active portal preference:', err);
  }
}

/**
 * Get user's saved portal preference
 */
export async function getSavedPortal(): Promise<PortalId | null> {
  try {
    let val: string | null = null;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        val = window.localStorage.getItem(LAST_PORTAL_STORAGE_KEY);
      }
    } else {
      val = await SecureStore.getItemAsync(LAST_PORTAL_STORAGE_KEY);
    }
    if (val && Object.keys(PORTALS).includes(val)) {
      return val as PortalId;
    }
  } catch (err) {
    console.warn('Failed to read saved portal:', err);
  }
  return null;
}

/**
 * Verify if role is permitted in a portal
 */
export function isRoleAllowedInPortal(role: string | undefined | null, portalId: PortalId): boolean {
  if (!role) return false;
  const r = role.toUpperCase();
  if (['SUPER_ADMIN', 'ADMIN'].includes(r)) return true;
  return PORTALS[portalId]?.allowedRoles.includes(r) ?? false;
}
