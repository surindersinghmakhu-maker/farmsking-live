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

    let finalRoles = Array.from(new Set([primaryRole, ...mapped]));
    if (isAdminUser) {
      finalRoles = finalRoles.filter((r) => r !== 'FARMER' && r !== 'CUSTOMER');
      if (finalRoles.length === 0) finalRoles = [primaryRole];
    }
    return finalRoles;
  }, [user, primaryRole]);

  const isAdminUser = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const defaultInitialRole = isAdminUser
    ? (user?.role as UserRole)
    : (user?.role === 'LABOUR' ? 'LABOUR' : (assignedRoles.includes('FARMER') ? 'FARMER' : primaryRole));

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

    if (assignedRoles.includes('FARMER')) {
      setRoleState('FARMER');
      return;
    }

    let cancelled = false;
    (async () => {
      const saved = await AppStorage.getItemAsync(`${LAST_DASHBOARD_KEY_PREFIX}${user.id}`);
      if (cancelled) return;
      setRoleState(saved && assignedRoles.includes(saved as UserRole) ? (saved as UserRole) : primaryRole);
    })();
    return () => {
      cancelled = true;
    };
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
