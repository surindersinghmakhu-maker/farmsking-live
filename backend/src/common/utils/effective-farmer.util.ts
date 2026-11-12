import { Role } from '@prisma/client';
import type { AuthUser } from '../types/auth-user.type';
import { hasActiveRole } from './auth-user.util';

/**
 * Resolves the effective farmer owner ID for operational modules (farms, expenses, parties, labour, records).
 * If the logged-in user is an active SUPERVISOR linked to an employer farmer, all reads/writes act seamlessly on
 * the employer farmer's workspace (`employerFarmerId`). Otherwise returns `user.id`.
 */
export function getEffectiveFarmerId(user: AuthUser): string {
  if (hasActiveRole(user, Role.SUPERVISOR) && user.employerFarmerId) {
    return user.employerFarmerId;
  }
  return user.id;
}
