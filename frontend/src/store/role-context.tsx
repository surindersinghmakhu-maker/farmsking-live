import { createContext, useContext, useEffect, useMemo, useState, useRef, ReactNode } from 'react';
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
  const { user, loginPortal } = useAuth();

  const primaryRole = user ? toUserRole(user.role, user.advisorType) : 'CUSTOMER';

  const assignedRoles = useMemo<UserRole[]>(() => {
    if (!user) return ['CUSTOMER'];

    const staffRoles = ['ADMIN', 'SUPER_ADMIN', 'TECHNICAL_TRAINER', 'OPERATOR', 'MANAGER'];
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

    // Admin staff cannot hold Client group roles (FARMER, GARDENER, SUPERVISOR, LABOUR)
    if (isStaffUser) {
      finalRoles = finalRoles.filter((r) => !['FARMER', 'GARDENER', 'SUPERVISOR', 'LABOUR'].includes(r));
      if (!finalRoles.includes('CUSTOMER')) {
        finalRoles.push('CUSTOMER');
      }
      return finalRoles;
    }

    // Strict portal separation: User Login shows Client roles only; Partner Login shows Partner roles only
    if (loginPortal === 'CLIENT') {
      const clientOnly = finalRoles.filter((r) =>
        ['FARMER', 'GARDENER', 'TRADER', 'SUPERVISOR', 'LABOUR', 'CUSTOMER'].includes(r),
      );
      return clientOnly.length > 0 ? clientOnly : ['CUSTOMER'];
    }
    if (loginPortal === 'PARTNER') {
      const partnerOnly = finalRoles.filter((r) =>
        ['AGENT', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR', 'SELLER'].includes(r),
      );
      if (partnerOnly.length > 0) return partnerOnly;
    }
    return finalRoles;
  }, [user, loginPortal]);

  const isStaffUser = ['ADMIN', 'SUPER_ADMIN', 'TECHNICAL_TRAINER', 'OPERATOR', 'MANAGER'].some(
    r => user?.role === r || (user?.roles && user.roles.includes(r as Role))
  );

  const isAdvisorOrDoctor = (r: UserRole) => r === 'ADVISOR' || r === 'FARM_ADVISOR' || r === 'GARDEN_ADVISOR';
  const hasAdvisorRole = assignedRoles.some(isAdvisorOrDoctor);
  const hasAgentRole = assignedRoles.includes('AGENT');
  const hasFarmerRole = assignedRoles.includes('FARMER');
  const hasGardenerRole = assignedRoles.includes('GARDENER');
  const hasTraderRole = assignedRoles.includes('TRADER' as UserRole);

  const advisorRoleToUse: UserRole =
    assignedRoles.includes('FARM_ADVISOR')
      ? 'FARM_ADVISOR'
      : assignedRoles.includes('ADVISOR')
        ? 'FARM_ADVISOR'
        : assignedRoles.includes('GARDEN_ADVISOR')
          ? 'GARDEN_ADVISOR'
          : isAdvisorOrDoctor(primaryRole)
            ? (primaryRole === 'ADVISOR' ? 'FARM_ADVISOR' : primaryRole)
            : 'FARM_ADVISOR';

  const resolvePortalDefaultRole = (): UserRole => {
    if (!user?.id) return primaryRole;
    if (isStaffUser) return user.role as UserRole;
    if (assignedRoles.includes('SUPERVISOR')) return 'SUPERVISOR';
    if (user.role === 'LABOUR') return 'LABOUR';

    if (loginPortal === 'CLIENT') {
      if (hasFarmerRole) return 'FARMER';
      if (hasGardenerRole) return 'GARDENER';
      if (hasTraderRole) return 'TRADER' as UserRole;
      return 'CUSTOMER';
    }

    if (loginPortal === 'PARTNER') {
      if (hasAdvisorRole) return advisorRoleToUse;
      if (hasAgentRole) return 'AGENT';
      if (assignedRoles.includes('SELLER')) return 'SELLER';
    }

    // Fallback when no explicit loginPortal is stored yet
    if (hasAdvisorRole) return advisorRoleToUse;
    if (hasFarmerRole) return 'FARMER';
    if (hasGardenerRole) return 'GARDENER';
    if (hasTraderRole) return 'TRADER' as UserRole;
    if (hasAgentRole) return 'AGENT';
    return primaryRole;
  };

  const defaultInitialRole = resolvePortalDefaultRole();

  const [role, setRoleState] = useState<UserRole>(defaultInitialRole);
  const prevUserIdRef = useRef<string | undefined>(user?.id);

  // Synchronous role sync when user transitions (e.g. login or logout)
  useEffect(() => {
    if (!user?.id) {
      prevUserIdRef.current = undefined;
      setRoleState('CUSTOMER');
      return;
    }

    if (prevUserIdRef.current !== user.id) {
      // User just logged in or switched account!
      prevUserIdRef.current = user.id;
      const defaultRole = resolvePortalDefaultRole();
      setRoleState(defaultRole);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, loginPortal, assignedRoles]);

  useEffect(() => {
    let active = true;
    const syncRole = async () => {
      if (!user?.id) {
        if (active) setRoleState(primaryRole);
        return;
      }

      const savedRole = (await AppStorage.getItemAsync(`${LAST_DASHBOARD_KEY_PREFIX}${user.id}`).catch(() => null)) as UserRole | null;
      if (!active) return;

      const portalAllowed: UserRole[] | null =
        loginPortal === 'CLIENT'
          ? ['FARMER', 'GARDENER', 'TRADER', 'SUPERVISOR', 'LABOUR', 'CUSTOMER']
          : loginPortal === 'PARTNER'
            ? ['AGENT', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR', 'SELLER']
            : null;

      setRoleState((prev) => {
        // If savedRole is valid, respect the user's previously chosen preference
        if (savedRole && assignedRoles.includes(savedRole) && (!portalAllowed || portalAllowed.includes(savedRole))) {
          return savedRole;
        }

        // If currently on an active assigned role that is NOT a stale 'CUSTOMER' (when user has FARMER/GARDENER/ADVISOR)
        const isStaleCustomer = prev === 'CUSTOMER' && (hasFarmerRole || hasGardenerRole || hasAdvisorRole);
        if (!isStaleCustomer && prev && assignedRoles.includes(prev) && (!portalAllowed || portalAllowed.includes(prev))) {
          return prev;
        }

        return resolvePortalDefaultRole();
      });
    };

    syncRole();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, loginPortal, primaryRole, assignedRoles, isStaffUser]);

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
