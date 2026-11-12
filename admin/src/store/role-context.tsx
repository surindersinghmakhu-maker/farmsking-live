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

    const staffRoles = ['ADMIN', 'SUPER_ADMIN', 'TECHNICAL_TRAINER', 'OPERATOR', 'MANAGER', 'ACCOUNTANT', 'ADVISOR'];
    const isStaffUser = staffRoles.some(r => user.role === r || (user.roles && user.roles.includes(r as Role)));

    const granted = user.roles && user.roles.length > 0 ? user.roles : [user.role];
    const deactivated = user.deactivatedRoles ?? [];
    let activeRoles = granted.filter((r) => !deactivated.includes(r));

    const mapped = activeRoles.map((r) => toUserRole(r, user.advisorType));
    const rawPrimary = toUserRole(user.role, user.advisorType);
    const isPrimaryActive = !deactivated.includes(user.role);

    let finalRoles = isPrimaryActive ? Array.from(new Set([rawPrimary, ...mapped])) : mapped;

    if (finalRoles.length === 0) {
      finalRoles = ['CUSTOMER'];
    }

    if (isStaffUser) {
      finalRoles = finalRoles.filter((r) => r !== 'FARMER' && r !== 'GARDENER');
      if (!finalRoles.includes('CUSTOMER')) {
        finalRoles.push('CUSTOMER');
      }
    }
    return finalRoles;
  }, [user]);

  const isStaffUser = ['ADMIN', 'SUPER_ADMIN', 'TECHNICAL_TRAINER', 'OPERATOR', 'MANAGER', 'ACCOUNTANT'].some(
    r => user?.role === r || (user?.roles && user.roles.includes(r as Role))
  );

  const isAdvisorOrDoctor = (r: UserRole) => r === 'ADVISOR' || r === 'FARM_ADVISOR' || r === 'GARDEN_ADVISOR';
  const hasAdvisorRole = assignedRoles.some(isAdvisorOrDoctor);
  const hasFarmerRole = assignedRoles.includes('FARMER');

  const advisorRoleToUse = assignedRoles.find(isAdvisorOrDoctor) || (isAdvisorOrDoctor(primaryRole) ? primaryRole : 'FARM_ADVISOR');

  const defaultInitialRole = isStaffUser
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
    let active = true;
    const syncRole = async () => {
      if (!user?.id) {
        if (active) setRoleState(primaryRole);
        return;
      }
      if (isStaffUser) {
        if (active) setRoleState(user.role as UserRole);
        return;
      }
      if (user.role === 'LABOUR') {
        if (active) setRoleState('LABOUR');
        return;
      }

      const savedRole = (await AppStorage.getItemAsync(`${LAST_DASHBOARD_KEY_PREFIX}${user.id}`).catch(() => null)) as UserRole | null;
      if (!active) return;

      setRoleState((prev) => {
        if (prev && assignedRoles.includes(prev)) return prev;
        if (savedRole && assignedRoles.includes(savedRole)) return savedRole;
        const advisorRole = assignedRoles.find(isAdvisorOrDoctor);
        if (advisorRole) return advisorRole;
        return primaryRole;
      });
    };
    syncRole();
    return () => {
      active = false;
    };
  }, [user?.id, user?.role, primaryRole, assignedRoles, isStaffUser]);

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
