import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OperatorPermission, Role } from '@prisma/client';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { OPERATOR_PERMISSION_KEY } from '../decorators/operator-permission.decorator';
import { AuthUser } from '../types/auth-user.type';

/**
 * Gates an endpoint that's open to OPERATOR alongside ADMIN/SUPER_ADMIN (via @Roles), but only lets an
 * Operator through if they've been granted the specific @RequireOperatorPermission on that route.
 * ADMIN/SUPER_ADMIN callers always pass — this only narrows what an OPERATOR can reach.
 */
@Injectable()
export class OperatorPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<OperatorPermission | undefined>(OPERATOR_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthUser | undefined = request.user;
    if (!user || user.role !== Role.OPERATOR) return true;

    const record = await this.prisma.user.findUnique({ where: { id: user.id }, select: { operatorPermissions: true } });
    if (!record?.operatorPermissions.includes(required)) {
      throw new ForbiddenException(`You don't have the ${required} permission. Ask an admin to grant it.`);
    }
    return true;
  }
}
