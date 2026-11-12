import { ConflictException } from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * Single Source of Truth for FarmsKing role isolation, compatibility, and portal access rules.
 * Keeps User/Client accounts, Business Partner/Seller accounts, Farm Staff, and Admin Panel Staff
 * strictly bounded without ambiguous combinations.
 */
export const ADMIN_STAFF_ROLES: readonly Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.MANAGER,
  Role.OPERATOR,
  Role.TECHNICAL_TRAINER,
  Role.ACCOUNTANT,
];

/** Dedicated single-purpose operational accounts working under an employer farmer. */
export const FARM_STAFF_ROLES: readonly Role[] = [
  Role.SUPERVISOR,
  Role.LABOUR,
];

/** Roles permitted inside the Agent / Partner login tab. */
export const PARTNER_PORTAL_ROLES: readonly Role[] = [
  Role.AGENT,
  Role.ADVISOR,
  Role.SELLER,
];

/** Explicit non-baseline client roles that allow logging into the User login tab even alongside Partner roles. */
export const EXPLICIT_CLIENT_ROLES: readonly Role[] = [
  Role.FARMER,
  Role.GARDENER,
  Role.TRADER,
  Role.SUPERVISOR,
  Role.LABOUR,
];

const OPERATIONAL_NON_CUSTOMER_ROLES: readonly Role[] = [
  Role.FARMER,
  Role.GARDENER,
  Role.SUPERVISOR,
  Role.LABOUR,
  Role.AGENT,
  Role.SELLER,
  Role.ADVISOR,
  Role.TRADER,
  ...ADMIN_STAFF_ROLES,
];

const PRIMARY_ROLE_PRIORITY: readonly Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.MANAGER,
  Role.ACCOUNTANT,
  Role.OPERATOR,
  Role.TECHNICAL_TRAINER,
  Role.SUPERVISOR,
  Role.LABOUR,
  Role.FARMER,
  Role.GARDENER,
  Role.TRADER,
  Role.ADVISOR,
  Role.AGENT,
  Role.SELLER,
  Role.CUSTOMER,
];

export function getActiveRolesList(user: {
  role: Role;
  roles?: Role[] | null;
  deactivatedRoles?: Role[] | null;
}): Role[] {
  const deactivated = new Set(user.deactivatedRoles ?? []);
  const combined = [user.role, ...(user.roles ?? [])].filter(Boolean);
  return Array.from(new Set(combined)).filter((r) => !deactivated.has(r));
}

export function validateRoleCombination(roles: Role[]): { valid: boolean; error?: string } {
  const unique = Array.from(new Set(roles));
  const adminMatches = unique.filter((r) => ADMIN_STAFF_ROLES.includes(r));

  if (adminMatches.length > 1) {
    return {
      valid: false,
      error:
        'Admin Panel staff roles (Super Admin, Admin, Manager, Accountant, Operator, Technical Trainer) are single-role only and cannot be combined.',
    };
  }

  if (adminMatches.length === 1) {
    const nonBaseline = unique.filter((r) => r !== Role.CUSTOMER && !ADMIN_STAFF_ROLES.includes(r));
    if (nonBaseline.length > 0) {
      return {
        valid: false,
        error:
          'Admin Panel staff accounts cannot hold Farmer, Gardener, Supervisor, Labour, Agent, Seller, Advisor, or Trader roles.',
      };
    }
    return { valid: true };
  }

  if (unique.includes(Role.FARMER) && unique.includes(Role.GARDENER)) {
    return {
      valid: false,
      error: 'An account cannot be both Farmer and Gardener at the same time.',
    };
  }

  const farmStaffMatches = unique.filter((r) => FARM_STAFF_ROLES.includes(r));
  if (farmStaffMatches.length > 0) {
    if (farmStaffMatches.length > 1) {
      return {
        valid: false,
        error: 'An account cannot hold both Supervisor and Labour Worker roles.',
      };
    }
    const staffRole = farmStaffMatches[0];
    const otherOperational = unique.filter(
      (r) => r !== staffRole && r !== Role.CUSTOMER && OPERATIONAL_NON_CUSTOMER_ROLES.includes(r),
    );
    if (otherOperational.length > 0) {
      return {
        valid: false,
        error:
          'Farm Staff accounts (Supervisor and Labour Worker) are single-role only and cannot combine with Farmer, Gardener, Agent, Seller, Advisor, or Trader roles.',
      };
    }
  }

  return { valid: true };
}

export function assertRoleCombinationAllowed(roles: Role[]): void {
  const result = validateRoleCombination(roles);
  if (!result.valid) {
    throw new ConflictException(result.error);
  }
}

export function pickBestPrimaryRole(roles: Role[]): Role {
  const unique = Array.from(new Set(roles));
  for (const candidate of PRIMARY_ROLE_PRIORITY) {
    if (unique.includes(candidate)) {
      return candidate;
    }
  }
  return unique[0] ?? Role.CUSTOMER;
}

export function evaluatePortalEligibility(
  user: { role: Role; roles?: Role[] | null; deactivatedRoles?: Role[] | null } | null,
  portal?: 'CLIENT' | 'PARTNER',
): { allowed: boolean; reason?: string } {
  if (!portal) return { allowed: true };

  if (!user) {
    if (portal === 'PARTNER') {
      return {
        allowed: false,
        reason:
          'No Agent account is registered with these details. Please switch to the User Login section for Farmer, Gardener, or Buyer accounts.',
      };
    }
    return { allowed: true };
  }

  const activeRoles = getActiveRolesList(user);
  if (activeRoles.some((r) => ADMIN_STAFF_ROLES.includes(r))) {
    return {
      allowed: false,
      reason:
        'Admin and Staff accounts (Super Admin, Admin, Manager, Operator, Technical Trainer) cannot sign in here. Please use the Admin Panel.',
    };
  }

  const isPartnerAccount = activeRoles.some((r) => PARTNER_PORTAL_ROLES.includes(r));
  const hasExplicitClientRole = activeRoles.some((r) => EXPLICIT_CLIENT_ROLES.includes(r));

  if (portal === 'PARTNER' && !isPartnerAccount) {
    return {
      allowed: false,
      reason:
        'This account belongs to User Login (Farmer, Gardener, or Buyer). Please switch to the User Login section.',
    };
  }

  if (portal === 'CLIENT' && isPartnerAccount && !hasExplicitClientRole) {
    return {
      allowed: false,
      reason:
        'This account is registered as an Agent account (Crop Doctor, Agent, or Seller). Please switch to the Agent Login section.',
    };
  }

  return { allowed: true };
}
