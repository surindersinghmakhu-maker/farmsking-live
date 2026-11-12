import { ForbiddenException } from '@nestjs/common';
import { Role, SupervisorPermission } from '@prisma/client';
import type { PrismaService } from '../../modules/prisma/prisma.service';
import type { AuthUser } from '../types/auth-user.type';
import { hasActiveRole } from './auth-user.util';

export type SupervisorFeatureCategory = 'spray' | 'labour' | 'advisory' | 'sales';
export type SupervisorFeatureMode = 'view' | 'entry';

const CATEGORY_TO_PERMISSION: Record<SupervisorFeatureCategory, SupervisorPermission> = {
  spray: SupervisorPermission.MANAGE_SPRAY_SCHEDULE,
  labour: SupervisorPermission.MANAGE_LABOUR_EXPENSES,
  advisory: SupervisorPermission.CROP_DOCTOR_CHAT,
  sales: SupervisorPermission.MANAGE_HARVEST_SALES,
};

/**
 * Enforces farmer-configured Supervisor view/entry permissions for active SUPERVISOR accounts.
 * Bypassed cleanly when caller is FARMER, ADMIN, or SUPER_ADMIN, or a non-supervisor role (e.g. LABOUR).
 */
export async function assertSupervisorPermission(
  prisma: PrismaService,
  user: AuthUser,
  category: SupervisorFeatureCategory,
  mode: SupervisorFeatureMode,
): Promise<void> {
  if (!user) return;
  if (
    hasActiveRole(user, Role.ADMIN) ||
    hasActiveRole(user, Role.SUPER_ADMIN) ||
    hasActiveRole(user, Role.FARMER) ||
    !hasActiveRole(user, Role.SUPERVISOR)
  ) {
    return;
  }

  let cfg: Record<string, any> | null = null;
  try {
    const rows: Array<{ supervisorFeaturesConfig?: any }> = await prisma.$queryRawUnsafe(
      `SELECT "supervisorFeaturesConfig" FROM "users" WHERE "id" = $1 LIMIT 1`,
      user.id,
    );
    const rawCfg = rows?.[0]?.supervisorFeaturesConfig;
    if (rawCfg) {
      cfg = typeof rawCfg === 'string' ? JSON.parse(rawCfg) : rawCfg;
    }
  } catch {
    cfg = null;
  }

  if (cfg && typeof cfg === 'object' && Object.keys(cfg).length > 0 && cfg[category]) {
    if (cfg[category]?.[mode] === true) {
      return;
    }
    throw new ForbiddenException(
      `Supervisor does not have ${mode} access for the ${category} module. Ask the employer farmer to enable it.`,
    );
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { supervisorPermissions: true },
  });
  const requiredPerm = CATEGORY_TO_PERMISSION[category];
  if (!record?.supervisorPermissions?.includes(requiredPerm)) {
    throw new ForbiddenException(
      `Supervisor does not have ${requiredPerm} permission. Ask the employer farmer to grant access.`,
    );
  }
}

