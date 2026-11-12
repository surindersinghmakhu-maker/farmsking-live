import { Role } from '@prisma/client';

/** Maps legacy cached 'BUSINESS_PARTNER' role strings from older clients seamlessly to Role.AGENT. */
export function normalizeRoleAlias<T>(val: T): T {
  if ((val as unknown as string) === 'BUSINESS_PARTNER') return Role.AGENT as unknown as T;
  return val;
}

/**
 * True if this account currently holds and can use the given role — either as its primary `role`, or
 * anywhere in its granted `roles` (as long as it hasn't been deactivated). A multi-role account (e.g. a
 * Farmer who was also made an Agent) can have a different primary role while still being a
 * fully usable Farmer, so callers that need "is this the farmer themselves" must check both. Accepts
 * any user-shaped object with these three fields — AuthUser (JWT) or a full Prisma User row both work.
 */
export function hasActiveRole(user: { role?: Role; roles?: Role[]; deactivatedRoles?: Role[] } | null | undefined, role: Role): boolean {
  if (!user) return false;
  const deactivated = user.deactivatedRoles ?? [];
  if (deactivated.includes(role)) return false;
  if (user.role === role) return true;
  return (user.roles ?? []).includes(role);
}
