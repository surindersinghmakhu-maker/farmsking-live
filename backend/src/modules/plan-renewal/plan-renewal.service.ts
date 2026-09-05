import { randomBytes } from 'crypto';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AdvisorSubscription, FarmerSubscriptionPlan, Role, SubscriptionPlanStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdvisorAssignmentService } from '../advisor-assignment/advisor-assignment.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { hasActiveRole } from '../../common/utils/auth-user.util';
import { buildUpiPaymentLink } from '../../common/utils/upi.util';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { CreatePlanRenewalCouponDto } from './dto/create-plan-renewal-coupon.dto';
import { RedeemPlanRenewalCouponDto } from './dto/redeem-plan-renewal-coupon.dto';

const DAY_MS = 24 * 60 * 60 * 1000;

function generateCode(): string {
  return `RENEW-${randomBytes(3).toString('hex').toUpperCase()}`;
}

/** Pure math shared by preview and redeem so they can never drift. */
function computeExtension(subscription: AdvisorSubscription, daysGranted: number, applyBonus: boolean) {
  const now = new Date();
  const currentEndDate = subscription.endDate;
  const isPending = !!currentEndDate && currentEndDate.getTime() > now.getTime();
  const bonusDayApplied = applyBonus && isPending;
  const baseDate = isPending ? currentEndDate! : now;
  const totalDays = daysGranted + (bonusDayApplied ? 1 : 0);
  const newEndDate = new Date(baseDate.getTime() + totalDays * DAY_MS);
  return { bonusDayApplied, newEndDate };
}

@Injectable()
export class PlanRenewalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly advisorAssignmentService: AdvisorAssignmentService,
    private readonly appSettingsService: AppSettingsService,
  ) {}

  async create(admin: AuthUser, dto: CreatePlanRenewalCouponDto) {
    if (dto.assignedFarmerId && dto.assignedAdvisorId) {
      throw new BadRequestException('Lock a coupon to a farmer or an advisor, not both.');
    }
    if (dto.assignedFarmerId) {
      const farmer = await this.prisma.user.findFirst({
        where: { id: dto.assignedFarmerId, roles: { has: Role.FARMER }, deletedAt: null },
      });
      if (!farmer) {
        throw new NotFoundException('Farmer not found.');
      }
    }
    if (dto.assignedAdvisorId) {
      const advisor = await this.prisma.user.findFirst({
        where: { id: dto.assignedAdvisorId, roles: { has: Role.ADVISOR }, deletedAt: null },
      });
      if (!advisor) {
        throw new NotFoundException('Advisor not found.');
      }
    }

    let code = generateCode();
    while (await this.prisma.planRenewalCoupon.findUnique({ where: { code } })) {
      code = generateCode();
    }

    return this.prisma.planRenewalCoupon.create({
      data: {
        code,
        daysGranted: dto.daysGranted,
        createdById: admin.id,
        assignedFarmerId: dto.assignedFarmerId,
        assignedAdvisorId: dto.assignedAdvisorId,
      },
    });
  }

  listAll() {
    return this.prisma.planRenewalCoupon.findMany({
      include: {
        assignedFarmer: { select: { id: true, name: true, mobile: true } },
        assignedAdvisor: { select: { id: true, name: true, mobile: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** The advisor's own wallet of coupons locked to them. */
  listMineForAdvisor(user: AuthUser) {
    return this.prisma.planRenewalCoupon.findMany({
      where: { assignedAdvisorId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Validates the coupon + ownership locks and resolves which farmer it would apply to. Shared by preview and redeem. */
  private async resolveCouponAndFarmer(user: AuthUser, code: string, farmerId?: string) {
    const coupon = await this.prisma.planRenewalCoupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) {
      throw new NotFoundException('Invalid renewal code.');
    }
    if (coupon.isUsed) {
      throw new BadRequestException('This renewal code has already been used.');
    }

    const targetFarmerId = farmerId ?? (hasActiveRole(user, Role.FARMER) ? user.id : undefined);
    if (!targetFarmerId) {
      throw new BadRequestException('A farmer must be specified to redeem this code.');
    }

    if (coupon.assignedFarmerId && coupon.assignedFarmerId !== targetFarmerId) {
      throw new ForbiddenException('This renewal code is assigned to a different farmer.');
    }
    if (coupon.assignedAdvisorId && (user.role !== Role.ADVISOR || user.id !== coupon.assignedAdvisorId)) {
      throw new ForbiddenException('This renewal code is assigned to a different advisor.');
    }

    if (user.role === Role.ADVISOR && targetFarmerId !== user.id) {
      await this.advisorAssignmentService.assertAdvisorAssignedToFarmerAnyExpiry(user.id, targetFarmerId);
    }

    // No subscription yet is fine here — redeem() below creates one (first-time "Hire an Advisor" via coupon).
    const subscription = await this.prisma.advisorSubscription.findFirst({
      where: { farmerId: targetFarmerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return { coupon, targetFarmerId, subscription };
  }

  /** Read-only preview — shows the days/new-expiry a code would grant, without consuming it. */
  async previewRedeem(user: AuthUser, code: string, farmerId?: string) {
    const { coupon, subscription } = await this.resolveCouponAndFarmer(user, code, farmerId);
    if (!subscription) {
      const newEndDate = new Date(Date.now() + coupon.daysGranted * DAY_MS);
      return { daysGranted: coupon.daysGranted, bonusDayApplied: false, newEndDate, isFirstHire: true };
    }
    const { bonusDayApplied, newEndDate } = computeExtension(subscription, coupon.daysGranted, true);
    return { daysGranted: coupon.daysGranted, bonusDayApplied, newEndDate, isFirstHire: false };
  }

  /**
   * Redeems a renewal/hire code.
   *  - No existing subscription (first "Hire an Advisor"): creates one, auto-picks & links a Farm Advisor,
   *    and upgrades the farmer's plan to PREMIUM — both valid for the coupon's daysGranted.
   *  - Existing subscription: pending (not-yet-expired) time carries over, expired plans restart from today,
   *    renewing before expiry earns a 1-day bonus.
   */
  async redeem(user: AuthUser, code: string, dto: RedeemPlanRenewalCouponDto) {
    const { coupon, targetFarmerId, subscription } = await this.resolveCouponAndFarmer(user, code, dto.farmerId);
    const now = new Date();

    if (!subscription) {
      const plan = await this.prisma.advisorPlan.findFirst({ where: { isActive: true } });
      if (!plan) {
        throw new NotFoundException('No advisor plan is configured yet. Please contact support.');
      }
      const newEndDate = new Date(now.getTime() + coupon.daysGranted * DAY_MS);

      const newSubscription = await this.prisma.advisorSubscription.create({
        data: { farmerId: targetFarmerId, planId: plan.id, status: SubscriptionPlanStatus.ACTIVE, approvedAt: now, startDate: now, endDate: newEndDate },
      });
      await this.advisorAssignmentService.createFromSubscription(newSubscription.id, targetFarmerId);
      await this.prisma.farmerPlan.upsert({
        where: { farmerId: targetFarmerId },
        create: { farmerId: targetFarmerId, plan: FarmerSubscriptionPlan.PRO, endDate: newEndDate },
        update: { plan: FarmerSubscriptionPlan.PRO, endDate: newEndDate, expiredAt: null },
      });
      await this.prisma.planRenewalCoupon.update({
        where: { id: coupon.id },
        data: { isUsed: true, usedAt: now, assignedFarmerId: targetFarmerId, bonusDayApplied: false },
      });

      return { subscription: newSubscription, daysAdded: coupon.daysGranted, bonusDayApplied: false, newEndDate, isFirstHire: true };
    }

    const { bonusDayApplied, newEndDate } = computeExtension(subscription, coupon.daysGranted, true);

    const [updatedSubscription] = await this.prisma.$transaction([
      this.prisma.advisorSubscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionPlanStatus.ACTIVE, startDate: subscription.startDate ?? now, endDate: newEndDate },
      }),
      this.prisma.planRenewalCoupon.update({
        where: { id: coupon.id },
        data: { isUsed: true, usedAt: now, assignedFarmerId: targetFarmerId, bonusDayApplied },
      }),
      this.prisma.farmerPlan.upsert({
        where: { farmerId: targetFarmerId },
        create: { farmerId: targetFarmerId, plan: FarmerSubscriptionPlan.PRO, endDate: newEndDate },
        update: { plan: FarmerSubscriptionPlan.PRO, endDate: newEndDate, expiredAt: null },
      }),
    ]);

    return { subscription: updatedSubscription, daysAdded: coupon.daysGranted, bonusDayApplied, newEndDate, isFirstHire: false };
  }

  /** UPI deep link for paying the farmer's current plan — fixed amount is the plan price, remark is the farmer's King ID. */
  async getUpiLinkForFarmer(user: AuthUser, farmerId?: string) {
    const targetFarmerId = farmerId ?? (hasActiveRole(user, Role.FARMER) ? user.id : undefined);
    if (!targetFarmerId) {
      throw new BadRequestException('A farmer must be specified to generate a payment link.');
    }
    if (hasActiveRole(user, Role.ADVISOR) && targetFarmerId !== user.id) {
      await this.advisorAssignmentService.assertAdvisorAssignedToFarmerAnyExpiry(user.id, targetFarmerId);
    }

    const [farmer, subscription] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: targetFarmerId, roles: { has: Role.FARMER }, deletedAt: null } }),
      this.prisma.advisorSubscription.findFirst({
        where: { farmerId: targetFarmerId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: { plan: true },
      }),
    ]);
    if (!farmer) {
      throw new NotFoundException('Farmer not found.');
    }
    if (!subscription) {
      throw new BadRequestException('This farmer has no plan to pay for yet.');
    }

    const remark = farmer.kingId ?? farmer.id;
    const settings = await this.appSettingsService.get();
    if (!settings.upiId) {
      throw new BadRequestException('UPI payment is not configured yet. Please contact support.');
    }
    const upiLink = buildUpiPaymentLink({
      amount: Number(subscription.plan.price),
      note: remark,
      transactionRef: remark,
      payeeVpa: settings.upiId,
      payeeName: settings.upiPayeeName ?? undefined,
    });
    return { upiLink, amount: Number(subscription.plan.price), farmerKingId: remark, planName: subscription.plan.name };
  }

  /** Admin-only — directly extends a farmer's plan with no coupon involved. No early-renewal bonus day. */
  async grantDaysDirectly(farmerId: string, daysGranted: number) {
    const subscription = await this.prisma.advisorSubscription.findFirst({
      where: { farmerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!subscription) {
      throw new BadRequestException('This farmer needs an active plan before days can be added. Please subscribe first.');
    }

    const { newEndDate } = computeExtension(subscription, daysGranted, false);
    const now = new Date();
    const updatedSubscription = await this.prisma.advisorSubscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionPlanStatus.ACTIVE, startDate: subscription.startDate ?? now, endDate: newEndDate },
    });

    return { subscription: updatedSubscription, daysAdded: daysGranted, newEndDate };
  }
}
