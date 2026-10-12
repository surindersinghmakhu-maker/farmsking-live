import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthUser } from '../types/auth-user.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthUser | undefined = request.user;
    if (!user) return false;

    // Collect all usable active roles
    const isPrimaryUsable = !user.deactivatedRoles?.includes(user.role);
    const activeRoles = (user.roles ?? []).filter((r) => !user.deactivatedRoles?.includes(r));
    const allUserRoles = new Set<Role>();
    if (isPrimaryUsable) allUserRoles.add(user.role);
    activeRoles.forEach((r) => allUserRoles.add(r));

    // Role Hierarchy rules:
    // 1. SUPER_ADMIN has platform-wide authority over all admin-tier and staff operations
    if (allUserRoles.has(Role.SUPER_ADMIN)) {
      return true;
    }

    // 2. ADMIN has access to ADMIN, MANAGER, and OPERATOR endpoints
    if (allUserRoles.has(Role.ADMIN)) {
      if (
        requiredRoles.includes(Role.ADMIN) ||
        requiredRoles.includes(Role.MANAGER) ||
        requiredRoles.includes(Role.OPERATOR)
      ) {
        return true;
      }
    }

    // 3. MANAGER has access to MANAGER and OPERATOR endpoints
    if (allUserRoles.has(Role.MANAGER)) {
      if (requiredRoles.includes(Role.MANAGER) || requiredRoles.includes(Role.OPERATOR)) {
        return true;
      }
    }

    // Standard match for user's assigned active roles
    return requiredRoles.some((r) => allUserRoles.has(r));
  }
}
