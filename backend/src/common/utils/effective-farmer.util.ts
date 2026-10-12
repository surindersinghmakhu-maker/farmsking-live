import { Role } from '@prisma/client';
import { AuthUser } from '../types/auth-user.type';

/**
 * Resolves the effective farmer ID for scoping data queries and operations.
 * If the user is a SUPERVISOR and is appointed by an employer farmer,
 * all farm data (sales, crops, plots, labour, expenses, parties) belongs to the employer farmer.
 * Otherwise, falls back to the user's own ID.
 */
export function getEffectiveFarmerId(user: AuthUser): string {
  if (
    (user.role === Role.SUPERVISOR ||
      (Array.isArray(user.roles) && user.roles.includes(Role.SUPERVISOR))) &&
    user.employerFarmerId
  ) {
    return user.employerFarmerId;
  }
  return user.id;
}
