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

/** Roles permitted inside the Partner (Seller, Crop Doctor, Garden Advisor, Sales Manager, Nursery Owner) login tab. */
export const PARTNER_PORTAL_ROLES: readonly Role[] = [
  Role.AGENT,
  Role.ADVISOR,
  Role.SELLER,
  Role.NURSERY_OWNER,
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
  Role.NURSERY_OWNER,
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
  Role.NURSERY_OWNER,
  Role.CUSTOMER,
];

export const STAFF_CATEGORY_ROLES: readonly Role[] = ADMIN_STAFF_ROLES;
export const PARTNER_CATEGORY_ROLES: readonly Role[] = [Role.AGENT, Role.ADVISOR, Role.SELLER, Role.TRADER, Role.NURSERY_OWNER];
export const CLIENT_CATEGORY_ROLES: readonly Role[] = [Role.FARMER, Role.GARDENER, Role.CUSTOMER, Role.SUPERVISOR, Role.LABOUR];

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

  // 1. Staff Category: Exactly at most ONE staff role
  const staffMatches = unique.filter((r) => ADMIN_STAFF_ROLES.includes(r));
  if (staffMatches.length > 1) {
    return {
      valid: false,
      error:
        'Staff accounts can hold only one Staff role (Admin, Manager, Operator, Technical Staff, or Accountant).',
    };
  }

  // 2. Client Category: At most ONE primary agricultural role (Farmer OR Gardener) alongside base Customer
  if (unique.includes(Role.FARMER) && unique.includes(Role.GARDENER)) {
    return {
      valid: false,
      error: 'In the Client category, an account can hold only one role: Farmer OR Gardener.',
    };
  }

  const farmStaffMatches = unique.filter((r) => FARM_STAFF_ROLES.includes(r));
  // Note: Supervisor CAN now combine with Labour Worker role (e.g. Supervisor executing or recording field labour).
  if ((unique.includes(Role.FARMER) || unique.includes(Role.GARDENER)) && farmStaffMatches.length > 0) {
    return {
      valid: false,
      error: 'Farm Staff roles (Supervisor or Labour) cannot combine with Farmer or Gardener on the same account.',
    };
  }
  if (staffMatches.length > 0 && farmStaffMatches.length > 0) {
    return {
      valid: false,
      error: 'Farm Staff roles (Supervisor or Labour) cannot combine with Admin Staff roles on the same account.',
    };
  }
  const partnerMatches = unique.filter((r) => PARTNER_CATEGORY_ROLES.includes(r));
  if (partnerMatches.length > 0 && farmStaffMatches.length > 0) {
    return {
      valid: false,
      error: 'Farm Staff roles (Supervisor or Labour) cannot combine with Partner roles on the same account.',
    };
  }
  const isAdvisorAndAgentOnly =
    partnerMatches.length === 2 &&
    partnerMatches.includes(Role.ADVISOR) &&
    partnerMatches.includes(Role.AGENT);

  if (partnerMatches.length > 1 && !isAdvisorAndAgentOnly) {
    return {
      valid: false,
      error:
        'In the Partner category, only Advisor (Crop Doctor / Garden Advisor) and Sales Manager (Agent) can combine on the same account. Seller and Trader accounts are dedicated.',
    };
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
          'Not registered as a FarmsKing Partner (Seller, Crop Doctor, Garden Advisor, or Sales Manager). Please contact FarmsKing Support to register, or switch to User Login.',
      };
    }
    return { allowed: true };
  }

  const activeRoles = getActiveRolesList(user);

  if (portal === 'CLIENT') {
    const clientRolesList: Role[] = [Role.CUSTOMER, Role.FARMER, Role.GARDENER, Role.SUPERVISOR, Role.LABOUR, Role.TRADER];
    const hasClientRole = activeRoles.some((r) => clientRolesList.includes(r));
    if (!hasClientRole) {
      return {
        allowed: false,
        reason:
          'This account has no active Client role. Please sign in through Partner Login or the Admin Portal.',
      };
    }
    return { allowed: true };
  }

  if (portal === 'PARTNER') {
    const hasPartnerRole = activeRoles.some((r) => PARTNER_PORTAL_ROLES.includes(r));
    if (!hasPartnerRole) {
      return {
        allowed: false,
        reason:
          'Not registered as a FarmsKing Partner (Seller, Crop Doctor, Garden Advisor, or Sales Manager). Please contact FarmsKing Support or apply below, or switch to User Login.',
      };
    }
    return { allowed: true };
  }

  return { allowed: true };
}
