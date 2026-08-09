import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { UserRole } from '@/constants/Colors';

interface RoleContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
  /** Roles this user has actually been granted — the switcher only offers these. */
  assignedRoles: UserRole[];
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

/**
 * Placeholder for the real backend role list (`GET /auth/me` once the
 * backend role system lands). Every non-admin user always holds CUSTOMER;
 * this sample also grants FARMER, FARM_ADVISOR and BUSINESS_PARTNER so the
 * switcher's restriction is visibly demonstrated — GARDENER, GARDEN_ADVISOR
 * and ADMIN are intentionally left out to show an unassigned role.
 */
const ASSIGNED_ROLES: UserRole[] = [
  'CUSTOMER',
  'FARMER',
  'GARDENER',
  'FARM_ADVISOR',
  'GARDEN_ADVISOR',
  'BUSINESS_PARTNER',
  'ADMIN',
];

/**
 * Which dashboard/nav is currently being previewed. Separate from the
 * authenticated user's real role — this lets the role-switcher demo every
 * assigned dashboard, and both the tab bar and the Home screen read it from
 * here so they stay in sync.
 */
export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('CUSTOMER');

  const value = useMemo(() => ({ role, setRole, assignedRoles: ASSIGNED_ROLES }), [role]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
