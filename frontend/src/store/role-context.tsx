import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Role } from '../types/api';
import { UserRole } from '@/constants/Colors';
import { useAuth } from './auth-context';
import * as AppStorage from '@/src/lib/storage';

const LAST_DASHBOARD_KEY_PREFIX = 'farmsking_last_dashboard_role_';

interface RoleContextValue {
  /** The dashboard currently being shown. */
  role: UserRole;
  /** Switches which dashboard is shown — only ever succeeds for a role in `assignedRoles`. */
  setRole: (role: UserRole) => void;
  /** Every dashboard this account is actually allowed to see, derived from the account's real granted roles. */
  assignedRoles: UserRole[];
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

/** Maps one backend Role (+ advisorType for the FARM/GARDEN split) to the frontend's dashboard UserRole. */
function toUserRole(role: Role, advisorType: 'FARM' | 'GARDEN' | null | undefined): UserRole {
  if (role === 'ADVISOR') {
    return advisorType === 'GARDEN' ? 'GARDEN_ADVISOR' : 'FARM_ADVISOR';
  }
  return role as UserRole;
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const primaryRole = user ? toUserRole(user.role, user.advisorType) : 'CUSTOMER';
  const assignedRoles = useMemo<UserRole[]>(() => {
    if (!user) return ['CUSTOMER'];
    const isAdminUser = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || (user.roles && (user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN')));

    const granted = user.roles && user.roles.length > 0 ? user.roles : [user.role];
    const deactivated = user.deactivatedRoles ?? [];
    let activeRoles = granted.filter((r) => !deactivated.includes(r));

    if (isAdminUser) {
      activeRoles = activeRoles.filter((r) => r !== 'FARMER' && r !== 'CUSTOMER');
    }

    const mapped = activeRoles.map((r) => toUserRole(r, user.advisorType));

    const rawPrimary = toUserRole(user.role, user.advisorType);
    const isPrimaryActive = !deactivated.includes(user.role);

    let finalRoles = isPrimaryActive ? Array.from(new Set([rawPrimary, ...mapped])) : mapped;
    if (finalRoles.length === 0) {
      finalRoles = ['CUSTOMER'];
    }

    if (finalRoles.includes('FARMER') && finalRoles.includes('GARDENER')) {
      finalRoles = finalRoles.filter(r => r !== 'GARDENER');
    }

    if (isAdminUser) {
      finalRoles = finalRoles.filter((r) => r !== 'FARMER' && r !== 'CUSTOMER');
      if (finalRoles.length === 0) finalRoles = [rawPrimary];
    }
    return finalRoles;
  }, [user]);

  const isAdminUser = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const isAdvisorOrDoctor = (r: UserRole) => r === 'ADVISOR' || r === 'FARM_ADVISOR' || r === 'GARDEN_ADVISOR';
  const hasAdvisorRole = assignedRoles.some(isAdvisorOrDoctor);
  const hasFarmerRole = assignedRoles.includes('FARMER');

  const advisorRoleToUse = assignedRoles.find(isAdvisorOrDoctor) || (isAdvisorOrDoctor(primaryRole) ? primaryRole : 'FARM_ADVISOR');

  const defaultInitialRole = isAdminUser
    ? (user?.role as UserRole)
    : (user?.role === 'LABOUR'
      ? 'LABOUR'
      : (hasAdvisorRole
        ? advisorRoleToUse
        : (hasFarmerRole
          ? 'FARMER'
          : primaryRole)));

  const [role, setRoleState] = useState<UserRole>(defaultInitialRole);

  useEffect(() => {
    if (!user?.id) {
      setRoleState(primaryRole);
      return;
    }

    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      setRoleState(user.role as UserRole);
      return;
    }

    if (user.role === 'LABOUR') {
      setRoleState('LABOUR');
      return;
    }

    // Priority 1: If Doctor or Advisor role is assigned -> Default to Doctor/Advisor tab
    const advisorRole = assignedRoles.find(isAdvisorOrDoctor);
    if (advisorRole) {
      setRoleState(advisorRole);
      return;
    }

    // Priority 2: If Farmer role is assigned -> Default to Farmer tab
    if (assignedRoles.includes('FARMER')) {
      setRoleState('FARMER');
      return;
    }

    // Priority 3: Customer role only -> Default to CUSTOMER (opens Store tab)
    setRoleState(primaryRole);
  }, [user?.id, user?.role, primaryRole, assignedRoles]);

  const setRole = (next: UserRole) => {
    if (assignedRoles.includes(next)) {
      setRoleState(next);
      if (user?.id) {
        AppStorage.setItemAsync(`${LAST_DASHBOARD_KEY_PREFIX}${user.id}`, next);
      }
    }
  };

  const value = useMemo<RoleContextValue>(() => ({ role, setRole, assignedRoles }), [role, assignedRoles]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
