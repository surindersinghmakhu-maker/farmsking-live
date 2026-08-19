import { randomBytes } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdvisorAssignmentStatus, GardenerSubscriptionPlan, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateGardenerPlanCouponDto } from './dto/create-gardener-plan-coupon.dto';
import { RedeemGardenerPlanCouponDto } from './dto/redeem-gardener-plan-coupon.dto';

/** Plan limits for FREE tier */
export const FREE_PLAN_MAX_PLANTS = 3;

export const EXPIRY_WARNING_DAYS = 5;
export const GRACE_PERIOD_DAYS = 2;
export const RENEW_HISTORY_MONTHS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;
const RENEW_CUTOFF_MS = RENEW_HISTORY_MONTHS * 30 * DAY_MS;

function generateCode(): string {
  return `GPLAN-${randomBytes(4).toString('hex').toUpperCase()}`;
}

@Injectable()
export class GardenerPlansService {
  constructor(private readonly prisma: PrismaService) {}

  /** Same lifecycle as FarmerPlansService.getEffectivePlan (5-day warning, 2-day grace, 3-month renew-history window). */
  async getEffectivePlan(gardenerId: string): Promise<{
    plan: GardenerSubscriptionPlan;
    endDate: Date | null;
    isExpired: boolean;
    inGrace: boolean;
    expiringSoon: boolean;
    daysUntilExpiry: number | null;
  }> {
    const record = await this.prisma.gardenerPlan.findUnique({ where: { gardenerId } });

    if (!record) {
      await this.prisma.gardenerPlan.create({ data: { gardenerId, plan: GardenerSubscriptionPlan.FREE } });
      return { plan: GardenerSubscriptionPlan.FREE, endDate: null, isExpired: false, inGrace: false, expiringSoon: false, daysUntilExpiry: null };
    }

    if (record.plan === GardenerSubscriptionPlan.FREE) {
      return { plan: GardenerSubscriptionPlan.FREE, endDate: null, isExpired: false, inGrace: false, expiringSoon: false, daysUntilExpiry: null };
    }

    const now = new Date();

    if (record.endDate && record.endDate >= now) {
      const daysUntilExpiry = Math.ceil((record.endDate.getTime() - now.getTime()) / DAY_MS);
      return {
        plan: record.plan,
        endDate: record.endDate,
        isExpired: false,
        inGrace: false,
        expiringSoon: daysUntilExpiry <= EXPIRY_WARNING_DAYS,
        daysUntilExpiry,
      };
    }

    const anchorExpiry = record.expiredAt ?? record.endDate ?? now;
    if (!record.expiredAt) {
      await this.prisma.gardenerPlan.update({ where: { gardenerId }, data: { expiredAt: anchorExpiry } });
    }

    const graceEndsAt = new Date(anchorExpiry.getTime() + GRACE_PERIOD_DAYS * DAY_MS);
    if (now <= graceEndsAt) {
      return { plan: record.plan, endDate: record.endDate, isExpired: true, inGrace: true, expiringSoon: false, daysUntilExpiry: 0 };
    }

    const renewCutoff = new Date(anchorExpiry.getTime() + RENEW_CUTOFF_MS);
    if (now <= renewCutoff) {
      return { plan: GardenerSubscriptionPlan.FREE, endDate: null, isExpired: true, inGrace: false, expiringSoon: false, daysUntilExpiry: null };
    }

    await this.prisma.$transaction([
      this.prisma.gardenerPlan.update({
        where: { gardenerId },
        data: { plan: GardenerSubscriptionPlan.FREE, endDate: null, expiredAt: null, couponId: null },
      }),
      this.prisma.advisorAssignment.updateMany({
        where: { farmerId: gardenerId, status: AdvisorAssignmentStatus.ACTIVE },
        data: { status: AdvisorAssignmentStatus.REVOKED, endDate: now },
      }),
    ]);
    return { plan: GardenerSubscriptionPlan.FREE, endDate: null, isExpired: true, inGrace: false, expiringSoon: false, daysUntilExpiry: null };
  }

  async getMyPlan(user: AuthUser) {
    const effective = await this.getEffectivePlan(user.id);
    return {
      gardenerId: user.id,
      ...effective,
      limits:
        effective.plan === GardenerSubscriptionPlan.FREE
          ? { maxPlants: FREE_PLAN_MAX_PLANTS, advisorIncluded: false }
          : { maxPlants: null, advisorIncluded: true },
    };
  }

  private renewalBaseDate(currentPlan: { endDate: Date | null; expiredAt: Date | null } | null, now: Date): Date {
    if (currentPlan?.endDate && currentPlan.endDate > now) return currentPlan.endDate;
    if (currentPlan?.expiredAt && now.getTime() - currentPlan.expiredAt.getTime() <= RENEW_CUTOFF_MS) {
      return currentPlan.expiredAt;
    }
    return now;
  }

  async previewCoupon(user: AuthUser, code: string) {
    const coupon = await this.resolveCoupon(code, user.id);
    const now = new Date();
    const currentPlan = await this.prisma.gardenerPlan.findUnique({ where: { gardenerId: user.id } });
    const baseDate = this.renewalBaseDate(currentPlan, now);
    const newEndDate = new Date(baseDate.getTime() + coupon.daysGranted * DAY_MS);

    return {
      code: coupon.code,
      plan: coupon.plan,
      daysGranted: coupon.daysGranted,
      currentPlan: currentPlan?.plan ?? GardenerSubscriptionPlan.FREE,
      newEndDate,
      extendsExisting: baseDate.getTime() !== now.getTime(),
    };
  }

  async redeemCoupon(user: AuthUser, dto: RedeemGardenerPlanCouponDto) {
    const coupon = await this.resolveCoupon(dto.code, user.id);
    const now = new Date();

    const currentPlan = await this.prisma.gardenerPlan.findUnique({ where: { gardenerId: user.id } });
    const baseDate = this.renewalBaseDate(currentPlan, now);
    const extended = baseDate.getTime() !== now.getTime();
    const newEndDate = new Date(baseDate.getTime() + coupon.daysGranted * DAY_MS);

    const [updatedPlan] = await this.prisma.$transaction([
      this.prisma.gardenerPlan.upsert({
        where: { gardenerId: user.id },
        create: {
          gardenerId: user.id,
          plan: GardenerSubscriptionPlan.PREMIUM,
          startDate: now,
          endDate: newEndDate,
          couponId: coupon.id,
        },
        update: {
          plan: GardenerSubscriptionPlan.PREMIUM,
          startDate: extended ? currentPlan!.startDate : now,
          endDate: newEndDate,
          expiredAt: null,
          couponId: coupon.id,
        },
      }),
      this.prisma.gardenerPlanCoupon.update({
        where: { id: coupon.id },
        data: { isUsed: true, usedAt: now, usedByGardenerId: user.id },
      }),
    ]);

    return { plan: updatedPlan, daysGranted: coupon.daysGranted, newEndDate, extended };
  }

  async createCoupon(admin: AuthUser, dto: CreateGardenerPlanCouponDto) {
    if (dto.assignedGardenerId) {
      const gardener = await this.prisma.user.findFirst({
        where: { id: dto.assignedGardenerId, roles: { has: Role.GARDENER }, deletedAt: null },
      });
      if (!gardener) throw new NotFoundException('Gardener not found.');
    }

    let code = generateCode();
    while (await this.prisma.gardenerPlanCoupon.findUnique({ where: { code } })) {
      code = generateCode();
    }

    return this.prisma.gardenerPlanCoupon.create({
      data: {
        code,
        plan: GardenerSubscriptionPlan.PREMIUM,
        daysGranted: dto.daysGranted,
        assignedGardenerId: dto.assignedGardenerId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdById: admin.id,
      },
    });
  }

  listAllCoupons() {
    return this.prisma.gardenerPlanCoupon.findMany({
      include: {
        assignedGardener: { select: { id: true, name: true, mobile: true } },
        usedByGardener: { select: { id: true, name: true, mobile: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listAllGardenerPlans() {
    return this.prisma.gardenerPlan.findMany({
      include: {
        gardener: { select: { id: true, name: true, mobile: true, kingId: true } },
        coupon: { select: { code: true, plan: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  private async resolveCoupon(code: string, gardenerId: string) {
    const coupon = await this.prisma.gardenerPlanCoupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) throw new NotFoundException('Invalid coupon code.');
    if (coupon.isUsed) throw new BadRequestException('This coupon has already been used.');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('This coupon has expired.');
    }
    if (coupon.assignedGardenerId && coupon.assignedGardenerId !== gardenerId) {
      throw new ForbiddenException('This coupon is assigned to a different gardener.');
    }
    return coupon;
  }
}
