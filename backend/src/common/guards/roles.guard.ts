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

    // Primary role covers the common case; `roles` lets an account with more than one granted role
    // (e.g. a Farmer who was also made a Business Partner) reach every dashboard it holds — minus
    // whatever an Admin has deactivated (still kept in `roles` for history, just not usable).
    const isPrimaryUsable = !user.deactivatedRoles?.includes(user.role);
    const activeRoles = (user.roles ?? []).filter((r) => !user.deactivatedRoles?.includes(r));
    return (requiredRoles.includes(user.role) && isPrimaryUsable) || requiredRoles.some((r) => activeRoles.includes(r));
  }
}
