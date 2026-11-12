import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { SubscriptionPlanStatus } from '@prisma/client';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { AuthUser } from '../types/auth-user.type';
import { getEffectiveFarmerId } from '../utils/effective-farmer.util';

/** Gates a route to farmers with an ACTIVE AdvisorSubscription — the app's first real paid-feature check. */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: AuthUser | undefined = request.user;
    if (!user) {
      return false;
    }

    const effectiveFarmerId = getEffectiveFarmerId(user);
    const activeSubscription = await this.prisma.advisorSubscription.findFirst({
      where: { farmerId: effectiveFarmerId, status: SubscriptionPlanStatus.ACTIVE, deletedAt: null },
    });

    if (!activeSubscription) {
      throw new ForbiddenException({
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'This feature requires an active Farmer Advisor subscription.',
      });
    }

    return true;
  }
}
