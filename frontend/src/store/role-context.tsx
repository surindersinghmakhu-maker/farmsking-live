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

/**
 * The dashboards shown are always exactly the ones the logged-in account actually holds — derived from
 * the backend's `role` (current/primary) and `roles` (every role ever granted). An account with more
 * than one granted role gets a "Switch Dashboard" option (see SwitchDashboardSection) instead of always
 * showing every dashboard, which is what the old dev-only switcher used to do.
 */
export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const primaryRole = user ? toUserRole(user.role, user.advisorType) : 'CUSTOMER';
  const assignedRoles = useMemo<UserRole[]>(() => {
    if (!user) return ['CUSTOMER'];
    const granted = user.roles && user.roles.length > 0 ? user.roles : [user.role];
    const deactivated = user.deactivatedRoles ?? [];
    const activeRoles = granted.filter((r) => !deactivated.includes(r));
    const mapped = activeRoles.map((r) => toUserRole(r, user.advisorType));
    // De-dupe while keeping the primary role first.
    return Array.from(new Set([primaryRole, ...mapped]));
  }, [user, primaryRole]);

  const [role, setRoleState] = useState<UserRole>(primaryRole);

  // Whenever the logged-in account changes (login/logout/role change), restore that account's last-picked
  // dashboard (if any, and still valid for this account) — otherwise fall back to the primary role. Never
  // leak a previous account's picked dashboard into a new session.
  useEffect(() => {
    if (!user?.id) {
      setRoleState(primaryRole);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, primaryRole]);

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
