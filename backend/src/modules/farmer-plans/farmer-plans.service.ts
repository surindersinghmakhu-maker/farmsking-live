import { randomBytes } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdvisorAssignmentStatus, AdvisorType, CropAdvisorReviewStatus, CropStatus, DiscountValueType, FarmerSubscriptionPlan, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdvisorAssignmentService } from '../advisor-assignment/advisor-assignment.service';
import { WalletService } from '../wallet/wallet.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { hasActiveRole } from '../../common/utils/auth-user.util';
import { CreateFarmerPlanCouponDto } from './dto/create-farmer-plan-coupon.dto';
import { GenerateAdvisorCouponDto } from './dto/generate-advisor-coupon.dto';
import { RedeemFarmerPlanCouponDto } from './dto/redeem-farmer-plan-coupon.dto';
import { UpdateFarmerPlanPricingDto } from './dto/update-farmer-plan-pricing.dto';

/** Plan limits for FREE tier */
export const FREE_PLAN_MAX_CROPS = 3;
export const FREE_PLAN_MAX_ACTIVE_CROPS = 3;
/** Plot creation itself is unlimited on every paid tier — STANDARD and PREMIUM instead cap how many crop
 * cycles a farmer can have under active advisor review (PENDING or ACCEPTED) at once. */
export const STANDARD_PLAN_MAX_ADVISOR_CROPS = 5;
export const PREMIUM_PLAN_MAX_ADVISOR_CROPS = 10;

/** Tier order, low to high — a coupon/renewal can only move a farmer to an equal or higher tier than what's currently active. */
export const PLAN_RANK: Record<FarmerSubscriptionPlan, number> = {
  FREE: 0,
  BASIC: 1,
  STANDARD: 2,
  PREMIUM: 3,
};

/** Days before expiry that the "plan expiring soon" indicator turns on for both farmer and advisor. */
export const EXPIRY_WARNING_DAYS = 5;
/** After expiry, the same plan's benefits keep working for this long while showing "Renew" instead of "Extend". */
export const GRACE_PERIOD_DAYS = 2;
/** Renewing within this window of the original expiry continues from that expiry date (no lost days). Past it, the advisor history is dropped. */
export const RENEW_HISTORY_MONTHS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;
const RENEW_CUTOFF_MS = RENEW_HISTORY_MONTHS * 30 * DAY_MS;

const ALPHANUMERIC_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** BASIC codes start with B, PREMIUM with P, STANDARD with S — B/P are followed by 6 digits, S by 6 alphanumeric characters. */
function generateCode(plan: FarmerSubscriptionPlan): string {
  if (plan === FarmerSubscriptionPlan.STANDARD) {
    const bytes = randomBytes(6);
    let suffix = '';
    for (let i = 0; i < 6; i++) {
      suffix += ALPHANUMERIC_CHARS[bytes[i] % ALPHANUMERIC_CHARS.length];
    }
    return `S${suffix}`;
  }
  const prefix = plan === FarmerSubscriptionPlan.BASIC ? 'B' : 'P';
  const digits = randomBytes(4).readUInt32BE(0) % 1_000_000;
  return `${prefix}${digits.toString().padStart(6, '0')}`;
}

@Injectable()
export class FarmerPlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly advisorAssignmentService: AdvisorAssignmentService,
    private readonly walletService: WalletService,
  ) {}

  // ─── Plan helpers ────────────────────────────────────────────────────────

  /**
   * Gets the effective plan for a farmer, applying the full lifecycle:
   *  - active: plan/endDate as stored; expiringSoon if within EXPIRY_WARNING_DAYS of endDate.
   *  - grace (0-2 days past endDate): benefits of the SAME plan still apply, but isExpired=true / inGrace=true
   *    so the UI shows "Renew" instead of "Extend".
   *  - past grace but within RENEW_HISTORY_MONTHS of the original expiry: benefits drop to FREE, but the
   *    plan/coupon/expiredAt are kept so a renewal can still continue from the original expiry date.
   *  - past RENEW_HISTORY_MONTHS: permanently reset to FREE and the farmer's advisor assignment history is revoked.
   */
  async getEffectivePlan(farmerId: string): Promise<{
    plan: FarmerSubscriptionPlan;
    startDate: Date | null;
    endDate: Date | null;
    isExpired: boolean;
    inGrace: boolean;
    expiringSoon: boolean;
    daysUntilExpiry: number | null;
  }> {
    const record = await this.prisma.farmerPlan.findUnique({ where: { farmerId } });

    if (!record) {
      // Auto-create FREE plan if missing (edge case for existing farmers)
      await this.prisma.farmerPlan.create({ data: { farmerId, plan: FarmerSubscriptionPlan.FREE } });
      return { plan: FarmerSubscriptionPlan.FREE, startDate: null, endDate: null, isExpired: false, inGrace: false, expiringSoon: false, daysUntilExpiry: null };
    }

    if (record.plan === FarmerSubscriptionPlan.FREE) {
      return { plan: FarmerSubscriptionPlan.FREE, startDate: null, endDate: null, isExpired: false, inGrace: false, expiringSoon: false, daysUntilExpiry: null };
    }

    const now = new Date();

    // Still within the paid period.
    if (record.endDate && record.endDate >= now) {
      const daysUntilExpiry = Math.ceil((record.endDate.getTime() - now.getTime()) / DAY_MS);
      return {
        plan: record.plan,
        startDate: record.startDate,
        endDate: record.endDate,
        isExpired: false,
        inGrace: false,
        expiringSoon: daysUntilExpiry <= EXPIRY_WARNING_DAYS,
        daysUntilExpiry,
      };
    }

    // Past endDate — lapsed. anchorExpiry is the original lapse moment (persisted so grace/renew windows are stable).
    const anchorExpiry = record.expiredAt ?? record.endDate ?? now;
    if (!record.expiredAt) {
      await this.prisma.farmerPlan.update({ where: { farmerId }, data: { expiredAt: anchorExpiry } });
    }

    const graceEndsAt = new Date(anchorExpiry.getTime() + GRACE_PERIOD_DAYS * DAY_MS);
    if (now <= graceEndsAt) {
      // Grace period: same plan's benefits still work, UI should show "Renew".
      return { plan: record.plan, startDate: record.startDate, endDate: record.endDate, isExpired: true, inGrace: true, expiringSoon: false, daysUntilExpiry: 0 };
    }

    const renewCutoff = new Date(anchorExpiry.getTime() + RENEW_CUTOFF_MS);
    if (now <= renewCutoff) {
      // Past grace, benefits are FREE-tier now, but plan/coupon/expiredAt stay so a renewal can continue from anchorExpiry.
      await this.trimAdvisorCropsToCap(farmerId, null);
      return { plan: FarmerSubscriptionPlan.FREE, startDate: null, endDate: null, isExpired: true, inGrace: false, expiringSoon: false, daysUntilExpiry: null };
    }

    // Past the renew-history window: permanent reset + drop the advisor assignment history.
    await this.prisma.$transaction([
      this.prisma.farmerPlan.update({
        where: { farmerId },
        data: { plan: FarmerSubscriptionPlan.FREE, endDate: null, expiredAt: null, couponId: null },
      }),
      this.prisma.advisorAssignment.updateMany({
        where: { farmerId, status: AdvisorAssignmentStatus.ACTIVE },
        data: { status: AdvisorAssignmentStatus.REVOKED, endDate: now },
      }),
    ]);
    await this.trimAdvisorCropsToCap(farmerId, null);
    return { plan: FarmerSubscriptionPlan.FREE, startDate: null, endDate: null, isExpired: true, inGrace: false, expiringSoon: false, daysUntilExpiry: null };
  }

  /**
   * Whenever a farmer's effective advisor-crop cap shrinks (tier drop, including all the way to
   * no-advisor on FREE/BASIC), reverts the most-recently-submitted PENDING/ACCEPTED crops back to
   * NONE until the count is back within the new cap — the oldest-submitted crops are kept.
   */
  private async trimAdvisorCropsToCap(farmerId: string, newCap: number | null) {
    const activeAdvisorCrops = await this.prisma.cropCycle.findMany({
      where: {
        deletedAt: null,
        status: { notIn: [CropStatus.COMPLETED, CropStatus.FAILED] },
        advisorReviewStatus: { in: [CropAdvisorReviewStatus.PENDING, CropAdvisorReviewStatus.ACCEPTED] },
        plot: { farm: { ownerId: farmerId } },
      },
      orderBy: { submittedToAdvisorAt: 'desc' },
      select: { id: true },
    });

    const toRevert = newCap === null ? activeAdvisorCrops : activeAdvisorCrops.slice(0, Math.max(0, activeAdvisorCrops.length - newCap));
    if (toRevert.length === 0) return;

    await this.prisma.cropCycle.updateMany({
      where: { id: { in: toRevert.map((c) => c.id) } },
      data: { advisorReviewStatus: CropAdvisorReviewStatus.NONE, submittedToAdvisorAt: null, advisorAcceptedAt: null },
    });
  }

  // ─── Farmer: view own plan ────────────────────────────────────────────────

  async getMyPlan(user: AuthUser) {
    const effective = await this.getEffectivePlan(user.id);
    return {
      farmerId: user.id,
      ...effective,
      limits:
        effective.plan === FarmerSubscriptionPlan.FREE
          ? {
              maxTotalCrops: FREE_PLAN_MAX_CROPS,
              maxActiveCrops: FREE_PLAN_MAX_ACTIVE_CROPS,
              maxAdvisorCrops: null,
              fullCompletedCropDetails: false,
              advisorIncluded: false,
            }
          : effective.plan === FarmerSubscriptionPlan.BASIC
            ? {
                maxTotalCrops: null,
                maxActiveCrops: null,
                maxAdvisorCrops: null,
                fullCompletedCropDetails: true,
                advisorIncluded: false,
              }
            : effective.plan === FarmerSubscriptionPlan.STANDARD
              ? {
                  maxTotalCrops: null,
                  maxActiveCrops: null,
                  maxAdvisorCrops: STANDARD_PLAN_MAX_ADVISOR_CROPS,
                  fullCompletedCropDetails: true,
                  advisorIncluded: true,
                }
              : {
                  maxTotalCrops: null,
                  maxActiveCrops: null,
                  maxAdvisorCrops: PREMIUM_PLAN_MAX_ADVISOR_CROPS,
                  fullCompletedCropDetails: true,
                  advisorIncluded: true,
                },
    };
  }

  // ─── Farmer: coupon preview ───────────────────────────────────────────────

  /** Extend base date: while active, extend on top of current endDate; if lapsed but within the renew window, continue from the original expiry (no lost days); otherwise start from now. */
  private renewalBaseDate(currentPlan: { endDate: Date | null; expiredAt: Date | null } | null, now: Date): Date {
    if (currentPlan?.endDate && currentPlan.endDate > now) return currentPlan.endDate;
    if (currentPlan?.expiredAt && now.getTime() - currentPlan.expiredAt.getTime() <= RENEW_CUTOFF_MS) {
      return currentPlan.expiredAt;
    }
    return now;
  }

  async previewCoupon(user: AuthUser, code: string, farmerId?: string) {
    const { coupon, targetFarmerId } = await this.resolveCouponAndFarmer(user, code, farmerId);
    const resultPlan = await this.resolveResultPlan(targetFarmerId, coupon.plan);

    const now = new Date();
    const currentPlan = await this.prisma.farmerPlan.findUnique({ where: { farmerId: targetFarmerId } });
    const isSameTierRenewal = currentPlan?.plan === resultPlan;
    const baseDate = isSameTierRenewal ? this.renewalBaseDate(currentPlan, now) : now;
    const newEndDate = new Date(baseDate.getTime() + coupon.daysGranted * DAY_MS);

    return {
      code: coupon.code,
      plan: coupon.plan,
      resultPlan,
      daysGranted: coupon.daysGranted,
      currentPlan: currentPlan?.plan ?? FarmerSubscriptionPlan.FREE,
      newEndDate,
      extendsExisting: baseDate.getTime() !== now.getTime(),
      includesAdvisor: resultPlan === FarmerSubscriptionPlan.PREMIUM || resultPlan === FarmerSubscriptionPlan.STANDARD,
    };
  }

  /**
   * A coupon never actually downgrades a farmer — if its tier is lower than the farmer's current
   * effective tier, the current (higher) tier is kept and the coupon's days are simply added on top
   * of it instead. Returns the plan the farmer will actually be on after redemption.
   */
  private async resolveResultPlan(farmerId: string, couponPlan: FarmerSubscriptionPlan): Promise<FarmerSubscriptionPlan> {
    const effective = await this.getEffectivePlan(farmerId);
    return PLAN_RANK[couponPlan] < PLAN_RANK[effective.plan] ? effective.plan : couponPlan;
  }

  // ─── Farmer/Advisor: redeem coupon — new farmer (first plan), extend (still active), or renew (lapsed) ────────

  async redeemCoupon(user: AuthUser, dto: RedeemFarmerPlanCouponDto) {
    const { coupon, targetFarmerId } = await this.resolveCouponAndFarmer(user, dto.code, dto.farmerId);
    const result = await this.applyPlanChange(targetFarmerId, coupon.plan, coupon.daysGranted, coupon.id);

    // A farmer picking their advisor in the same step as activating a fresh STANDARD/PREMIUM plan — sends a
    // hire request just like "Choose Your Advisor"; the advisor must accept before it's active (and gets paid).
    if (dto.advisorId && (result.plan.plan === FarmerSubscriptionPlan.STANDARD || result.plan.plan === FarmerSubscriptionPlan.PREMIUM)) {
      await this.advisorAssignmentService.requestSpecificAdvisor(targetFarmerId, dto.advisorId);
    }

    await this.prisma.farmerPlanCoupon.update({
      where: { id: coupon.id },
      data: { isUsed: true, usedAt: new Date(), usedByFarmerId: targetFarmerId },
    });
    await this.payoutCommissions(coupon, targetFarmerId);

    return result;
  }

  /**
   * Applies a plan tier + day extension to a farmer — shared by coupon redemption and direct UPI plan
   * payment confirmation. Never downgrades an active higher tier (see resolveResultPlan).
   *
   * Base date rule: only a same-tier RENEWAL extends on top of the current expiry (or continues from it
   * if lapsed but within the renew window) — an UPGRADE to a genuinely higher tier always starts fresh
   * from today, it never inherits the lower tier's remaining days.
   */
  async applyPlanChange(farmerId: string, targetPlan: FarmerSubscriptionPlan, daysGranted: number, couponId?: string) {
    const resultPlan = await this.resolveResultPlan(farmerId, targetPlan);
    const now = new Date();

    const currentPlan = await this.prisma.farmerPlan.findUnique({ where: { farmerId } });
    const isSameTierRenewal = currentPlan?.plan === resultPlan;
    const baseDate = isSameTierRenewal ? this.renewalBaseDate(currentPlan, now) : now;
    const extended = baseDate.getTime() !== now.getTime();
    const newEndDate = new Date(baseDate.getTime() + daysGranted * DAY_MS);
    const keptHigherPlan = resultPlan !== targetPlan;

    const updatedPlan = await this.prisma.farmerPlan.upsert({
      where: { farmerId },
      create: { farmerId, plan: resultPlan, startDate: now, endDate: newEndDate, couponId },
      update: {
        plan: resultPlan,
        startDate: extended && isSameTierRenewal ? currentPlan!.startDate : now,
        endDate: newEndDate,
        expiredAt: null,
        ...(couponId ? { couponId } : {}),
      },
    });

    let advisorHired = false;
    if (resultPlan === FarmerSubscriptionPlan.PREMIUM || resultPlan === FarmerSubscriptionPlan.STANDARD) {
      advisorHired = await this.ensurePremiumAdvisorHire(farmerId, newEndDate);
    }

    const newCap =
      resultPlan === FarmerSubscriptionPlan.STANDARD
        ? STANDARD_PLAN_MAX_ADVISOR_CROPS
        : resultPlan === FarmerSubscriptionPlan.PREMIUM
          ? PREMIUM_PLAN_MAX_ADVISOR_CROPS
          : null;
    await this.trimAdvisorCropsToCap(farmerId, newCap);

    return {
      plan: updatedPlan,
      daysGranted,
      newEndDate,
      extended,
      advisorHired,
      keptHigherPlan,
    };
  }

  /**
   * Prorates the plan's configured price by daysGranted/billingPeriodDays and credits the wallets of
   * whoever issued/serviced this coupon: the business partner who handed it out (if any), and the
   * currently-assigned advisor (for STANDARD/PREMIUM). Whatever's left is the platform's own share —
   * nothing to credit there, it just isn't paid out.
   */
  private async payoutCommissions(
    coupon: { plan: FarmerSubscriptionPlan; daysGranted: number; code: string; assignedBusinessPartnerId: string | null },
    farmerId: string,
  ) {
    const pricing = await this.prisma.farmerPlanPricing.findUnique({ where: { plan: coupon.plan } });
    if (!pricing) return;

    const ratio = coupon.daysGranted / pricing.billingPeriodDays;
    const farmer = await this.prisma.user.findUnique({ where: { id: farmerId }, select: { name: true, kingId: true } });
    const farmerLabel = farmer ? `${farmer.name}${farmer.kingId ? ` (ID: ${farmer.kingId})` : ''}` : 'a farmer';

    if (coupon.assignedBusinessPartnerId) {
      const partnerAmount =
        pricing.partnerShareType === DiscountValueType.PERCENTAGE
          ? (Number(pricing.price) * Number(pricing.partnerShareValue)) / 100
          : Number(pricing.partnerShareValue);
      const proratedAmount = Math.round(partnerAmount * ratio * 100) / 100;
      if (proratedAmount > 0) {
        await this.walletService.credit(
          coupon.assignedBusinessPartnerId,
          proratedAmount,
          `Commission for ${coupon.plan} plan coupon ${coupon.code} — redeemed by ${farmerLabel} on ${new Date().toLocaleDateString('en-IN')}`,
          { relatedUserId: farmerId },
        );
      }
    }

    if (pricing.advisorShareValue) {
      const assignment = await this.prisma.advisorAssignment.findFirst({
        where: { farmerId, status: AdvisorAssignmentStatus.ACTIVE },
      });
      if (assignment) {
        const proratedAmount = Math.round(Number(pricing.advisorShareValue) * ratio * 100) / 100;
        if (proratedAmount > 0) {
          await this.walletService.credit(
            assignment.advisorId,
            proratedAmount,
            `Advisor fee for ${coupon.plan} plan coupon ${coupon.code} — redeemed by ${farmerLabel} on ${new Date().toLocaleDateString('en-IN')}`,
            { relatedUserId: farmerId },
          );
        }
      }
    }
  }

  // ─── Plan pricing (Super Admin editable) ──────────────────────────────────

  getPricing() {
    return this.prisma.farmerPlanPricing.findMany({ orderBy: { price: 'asc' } });
  }

  async updatePricing(admin: AuthUser, plan: FarmerSubscriptionPlan, dto: UpdateFarmerPlanPricingDto) {
    const existing = await this.prisma.farmerPlanPricing.findUnique({ where: { plan } });
    if (!existing) throw new NotFoundException('No pricing row for this plan yet.');

    return this.prisma.farmerPlanPricing.update({
      where: { plan },
      data: {
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.billingPeriodDays !== undefined ? { billingPeriodDays: dto.billingPeriodDays } : {}),
        ...(dto.partnerShareType !== undefined ? { partnerShareType: dto.partnerShareType } : {}),
        ...(dto.partnerShareValue !== undefined ? { partnerShareValue: dto.partnerShareValue } : {}),
        ...(dto.advisorShareValue !== undefined ? { advisorShareValue: dto.advisorShareValue } : {}),
        ...(dto.adminShareValue !== undefined ? { adminShareValue: dto.adminShareValue } : {}),
        ...(dto.partnerGenerationCostPercent !== undefined ? { partnerGenerationCostPercent: dto.partnerGenerationCostPercent } : {}),
        ...(dto.advisorGenerationCostPercent !== undefined ? { advisorGenerationCostPercent: dto.advisorGenerationCostPercent } : {}),
        updatedById: admin.id,
      },
    });
  }

  /**
   * STANDARD and PREMIUM both include a Farm Advisor, but WHICH advisor is always the farmer's own
   * explicit choice via chooseAdvisor() below — this just keeps an existing AdvisorSubscription's end
   * date in sync with the plan's, it never auto-picks or auto-creates an assignment. That's what makes
   * the "Choose Your Advisor" screen actually reachable after a fresh upgrade instead of being skipped.
   */
  private async ensurePremiumAdvisorHire(farmerId: string, endDate: Date): Promise<boolean> {
    const existingSubscription = await this.prisma.advisorSubscription.findFirst({
      where: { farmerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (existingSubscription) {
      await this.prisma.advisorSubscription.update({
        where: { id: existingSubscription.id },
        data: { status: 'ACTIVE', endDate },
      });
    }
    return false;
  }

  // ─── Farmer: choose a specific advisor (STANDARD/PREMIUM only) ────────────

  /**
   * Lets a STANDARD/PREMIUM farmer pick a specific Farm Advisor. This only sends the advisor a PENDING
   * hire request — the advisor must accept it (see AdvisorAssignmentService.accept/reject) before it
   * becomes active and crop-sharing unlocks. A rejected request lets the farmer choose again.
   */
  async chooseAdvisor(user: AuthUser, advisorId: string) {
    const effective = await this.getEffectivePlan(user.id);
    if (effective.plan !== FarmerSubscriptionPlan.STANDARD && effective.plan !== FarmerSubscriptionPlan.PREMIUM) {
      throw new BadRequestException('Upgrade to the STANDARD or PREMIUM plan to choose your advisor.');
    }

    const advisor = await this.prisma.user.findFirst({
      where: { id: advisorId, roles: { has: Role.ADVISOR }, advisorType: AdvisorType.FARM, deletedAt: null },
    });
    if (!advisor) {
      throw new NotFoundException('Advisor not found.');
    }

    return this.advisorAssignmentService.requestSpecificAdvisor(user.id, advisorId);
  }

  // ─── Admin: grant days directly, no coupon ────────────────────────────────

  /** Admin-only manual override — extends the farmer's current plan tier by N days with no coupon involved. */
  async grantDaysDirectly(farmerId: string, daysGranted: number) {
    const currentPlan = await this.prisma.farmerPlan.findUnique({ where: { farmerId } });
    if (!currentPlan || currentPlan.plan === FarmerSubscriptionPlan.FREE) {
      throw new BadRequestException('This farmer needs a paid plan first — use a coupon to set the tier.');
    }

    const now = new Date();
    const baseDate = this.renewalBaseDate(currentPlan, now);
    const newEndDate = new Date(baseDate.getTime() + daysGranted * DAY_MS);

    const updatedPlan = await this.prisma.farmerPlan.update({
      where: { farmerId },
      data: { endDate: newEndDate, expiredAt: null },
    });

    let advisorHired = false;
    if (currentPlan.plan === FarmerSubscriptionPlan.PREMIUM || currentPlan.plan === FarmerSubscriptionPlan.STANDARD) {
      advisorHired = await this.ensurePremiumAdvisorHire(farmerId, newEndDate);
    }

    return { plan: updatedPlan, daysAdded: daysGranted, newEndDate, advisorHired };
  }

  // ─── Super Admin: create coupon ───────────────────────────────────────────

  async createCoupon(admin: AuthUser, dto: CreateFarmerPlanCouponDto) {
    if (dto.plan === FarmerSubscriptionPlan.FREE) {
      throw new BadRequestException('Cannot create a coupon for the FREE plan.');
    }
    const lockTargets = [dto.assignedFarmerId, dto.assignedAdvisorId, dto.assignedBusinessPartnerId].filter(Boolean);
    if (lockTargets.length > 1) {
      throw new BadRequestException('Lock a coupon to only one of: a farmer, an advisor, or a business partner.');
    }

    if (dto.assignedFarmerId) {
      const farmer = await this.prisma.user.findFirst({
        where: { id: dto.assignedFarmerId, roles: { has: Role.FARMER }, deletedAt: null },
      });
      if (!farmer) throw new NotFoundException('Farmer not found.');
    }
    if (dto.assignedAdvisorId) {
      const advisor = await this.prisma.user.findFirst({
        where: { id: dto.assignedAdvisorId, roles: { has: Role.ADVISOR }, deletedAt: null },
      });
      if (!advisor) throw new NotFoundException('Advisor not found.');
    }
    if (dto.assignedBusinessPartnerId) {
      const partner = await this.prisma.user.findFirst({
        where: { id: dto.assignedBusinessPartnerId, roles: { has: Role.BUSINESS_PARTNER }, deletedAt: null },
      });
      if (!partner) throw new NotFoundException('Business partner not found.');
    }

    const pricing = await this.prisma.farmerPlanPricing.findUnique({ where: { plan: dto.plan } });
    const ratio = pricing ? dto.daysGranted / pricing.billingPeriodDays : 0;
    let debitAmount = 0;
    if (pricing && dto.assignedAdvisorId && pricing.advisorGenerationCostPercent) {
      debitAmount = Math.round(Number(pricing.price) * (Number(pricing.advisorGenerationCostPercent) / 100) * ratio * 100) / 100;
    } else if (pricing && dto.assignedBusinessPartnerId) {
      if (dto.plan === FarmerSubscriptionPlan.BASIC) {
        // BASIC has no advisor involved — partner pays the configured flat generation cost.
        debitAmount = pricing.partnerGenerationCostPercent
          ? Math.round(Number(pricing.price) * (Number(pricing.partnerGenerationCostPercent) / 100) * ratio * 100) / 100
          : 0;
      } else {
        // STANDARD/PREMIUM — the advisor keeps their fee out of the price; the partner covers whatever's left.
        const advisorFeePercent = Number(pricing.advisorGenerationCostPercent ?? 0);
        debitAmount = Math.round(Number(pricing.price) * (1 - advisorFeePercent / 100) * ratio * 100) / 100;
      }
    }
    const debitAssigneeId = dto.assignedAdvisorId || dto.assignedBusinessPartnerId || null;

    const quantity = dto.quantity ?? 1;
    const created: Awaited<ReturnType<typeof this.prisma.farmerPlanCoupon.create>>[] = [];
    for (let i = 0; i < quantity; i += 1) {
      let code = generateCode(dto.plan);
      while (await this.prisma.farmerPlanCoupon.findUnique({ where: { code } })) {
        code = generateCode(dto.plan);
      }

      const coupon = await this.prisma.farmerPlanCoupon.create({
        data: {
          code,
          plan: dto.plan,
          daysGranted: dto.daysGranted,
          assignedFarmerId: dto.assignedFarmerId,
          assignedAdvisorId: dto.assignedAdvisorId,
          assignedBusinessPartnerId: dto.assignedBusinessPartnerId,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          createdById: admin.id,
          generationCostAmount: debitAmount > 0 ? debitAmount : null,
        },
      });

      if (debitAssigneeId && debitAmount > 0) {
        await this.walletService.debit(
          debitAssigneeId,
          debitAmount,
          `Cost for issuing ${dto.plan} plan coupon ${coupon.code}`,
          { relatedUserId: admin.id },
        );
      }

      created.push(coupon);
    }

    return created;
  }

  // ─── Advisor: self-service coupon generation ──────────────────────────────

  /**
   * Advisor self-service: generates a Farmer Plan (BASIC) or Advisor Plan (STANDARD/PREMIUM) coupon for
   * themselves to hand to a farmer, or to share with a Business Partner instead — pricing stays entirely
   * Super-Admin controlled (this only reads farmerPlanPricing, never writes it). The coupon is always
   * assigned to the calling advisor.
   *
   * - Farmer / open code, BASIC plan: the advisor's own fee % (advisorGenerationCostPercent) is subtracted
   *   from the plan price first — whatever's left is debited from the advisor's own wallet, i.e. they buy it
   *   at price minus their own fee (they're reselling a plan with no advisory involvement).
   * - Farmer / open code, STANDARD/PREMIUM: the advisor pays the coupon's full value upfront — when a farmer
   *   redeems it, advisorShareValue is credited back to the advisor automatically (payoutCommissions), same
   *   as any other STANDARD/PREMIUM redemption.
   * - Business partner: two independent debits at each side's own standard generation-cost % — the advisor's
   *   wallet pays their normal fee (advisorGenerationCostPercent) and the partner's wallet separately pays
   *   theirs (partnerGenerationCostPercent).
   */
  async generateOwnCoupon(advisor: AuthUser, dto: GenerateAdvisorCouponDto) {
    if (dto.plan === FarmerSubscriptionPlan.FREE) {
      throw new BadRequestException('Cannot create a coupon for the FREE plan.');
    }
    if (dto.assignedFarmerId && dto.assignedBusinessPartnerId) {
      throw new BadRequestException('Lock a coupon to only one of: a farmer, or a business partner.');
    }

    if (dto.assignedFarmerId) {
      await this.advisorAssignmentService.assertAdvisorAssignedToFarmerAnyExpiry(advisor.id, dto.assignedFarmerId);
    }
    if (dto.assignedBusinessPartnerId) {
      const partner = await this.prisma.user.findFirst({
        where: { id: dto.assignedBusinessPartnerId, roles: { has: Role.BUSINESS_PARTNER }, deletedAt: null },
      });
      if (!partner) throw new NotFoundException('Business partner not found.');
    }

    const pricing = await this.prisma.farmerPlanPricing.findUnique({ where: { plan: dto.plan } });
    const ratio = pricing ? dto.daysGranted / pricing.billingPeriodDays : 0;
    const advisorFeePercent = Number(pricing?.advisorGenerationCostPercent ?? 0);

    let advisorDebit = 0;
    let partnerDebit = 0;
    if (dto.assignedBusinessPartnerId) {
      const partnerFeePercent = Number(pricing?.partnerGenerationCostPercent ?? 0);
      advisorDebit = pricing ? Math.round(Number(pricing.price) * (advisorFeePercent / 100) * ratio * 100) / 100 : 0;
      partnerDebit = pricing ? Math.round(Number(pricing.price) * (partnerFeePercent / 100) * ratio * 100) / 100 : 0;
    } else if (dto.plan === FarmerSubscriptionPlan.BASIC) {
      advisorDebit = pricing ? Math.round(Number(pricing.price) * (1 - advisorFeePercent / 100) * ratio * 100) / 100 : 0;
    } else {
      // STANDARD/PREMIUM: full coupon value — the advisor's share comes back automatically on redemption.
      advisorDebit = pricing ? Math.round(Number(pricing.price) * ratio * 100) / 100 : 0;
    }

    if (advisorDebit > 0) {
      const balance = await this.walletService.getBalance(advisor.id);
      if (balance < advisorDebit) {
        throw new BadRequestException(
          `Insufficient wallet balance — generating this coupon costs ₹${advisorDebit.toLocaleString('en-IN')}, your balance is ₹${balance.toLocaleString('en-IN')}.`,
        );
      }
    }
    if (partnerDebit > 0 && dto.assignedBusinessPartnerId) {
      const balance = await this.walletService.getBalance(dto.assignedBusinessPartnerId);
      if (balance < partnerDebit) {
        throw new BadRequestException(
          `The business partner's wallet balance is too low — this coupon costs them ₹${partnerDebit.toLocaleString('en-IN')}, their balance is ₹${balance.toLocaleString('en-IN')}.`,
        );
      }
    }

    let code = generateCode(dto.plan);
    while (await this.prisma.farmerPlanCoupon.findUnique({ where: { code } })) {
      code = generateCode(dto.plan);
    }

    const totalDebit = advisorDebit + partnerDebit;
    const coupon = await this.prisma.farmerPlanCoupon.create({
      data: {
        code,
        plan: dto.plan,
        daysGranted: dto.daysGranted,
        assignedFarmerId: dto.assignedFarmerId,
        assignedAdvisorId: advisor.id,
        assignedBusinessPartnerId: dto.assignedBusinessPartnerId,
        createdById: advisor.id,
        generationCostAmount: totalDebit > 0 ? totalDebit : null,
      },
    });

    if (advisorDebit > 0) {
      await this.walletService.debit(
        advisor.id,
        advisorDebit,
        `Self-generated ${dto.plan} plan coupon ${coupon.code}`,
      );
    }
    if (partnerDebit > 0 && dto.assignedBusinessPartnerId) {
      await this.walletService.debit(
        dto.assignedBusinessPartnerId,
        partnerDebit,
        `Share of ${dto.plan} plan coupon ${coupon.code} — generated by advisor`,
        { relatedUserId: advisor.id },
      );
    }

    return coupon;
  }

  /** Super Admin: deactivate an unused coupon (blocks redemption) — never deleted, code stays visible in history. */
  async deactivateCoupon(id: string) {
    const coupon = await this.prisma.farmerPlanCoupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found.');
    if (coupon.isUsed) throw new BadRequestException('This coupon has already been redeemed — nothing to deactivate.');

    return this.prisma.farmerPlanCoupon.update({
      where: { id },
      data: { isUsed: true, usedAt: new Date() },
    });
  }

  // ─── Admin/Super Admin: list all coupons ──────────────────────────────────

  /** The advisor's own wallet of plan coupons issued to them, to apply to any of their assigned farmers. */
  listMineForAdvisor(user: AuthUser) {
    return this.prisma.farmerPlanCoupon.findMany({
      where: { assignedAdvisorId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** The business partner's own wallet of plan coupons issued to them, to hand out to farmers — earns a commission on redemption. */
  listMineForBusinessPartner(user: AuthUser) {
    return this.prisma.farmerPlanCoupon.findMany({
      where: { assignedBusinessPartnerId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  listAllCoupons() {
    return this.prisma.farmerPlanCoupon.findMany({
      include: {
        assignedFarmer: { select: { id: true, name: true, mobile: true } },
        assignedAdvisor: { select: { id: true, name: true, mobile: true } },
        assignedBusinessPartner: { select: { id: true, name: true, mobile: true } },
        usedByFarmer: { select: { id: true, name: true, mobile: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Admin/Super Admin: list all farmer plans ─────────────────────────────

  listAllFarmerPlans() {
    return this.prisma.farmerPlan.findMany({
      include: {
        farmer: { select: { id: true, name: true, mobile: true, kingId: true } },
        coupon: { select: { code: true, plan: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /** Validates the coupon and resolves which farmer it applies to — a farmer redeeming for themself, or an advisor redeeming on behalf of one of their assigned farmers. */
  private async resolveCouponAndFarmer(user: AuthUser, code: string, farmerId?: string) {
    const coupon = await this.prisma.farmerPlanCoupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!coupon) throw new NotFoundException('Invalid coupon code.');
    if (coupon.isUsed) throw new BadRequestException('This coupon has already been used.');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('This coupon has expired.');
    }

    const targetFarmerId = farmerId ?? (hasActiveRole(user, Role.FARMER) ? user.id : undefined);
    if (!targetFarmerId) {
      throw new BadRequestException('A farmer must be specified to redeem this code.');
    }

    if (coupon.assignedFarmerId && coupon.assignedFarmerId !== targetFarmerId) {
      throw new ForbiddenException('This coupon is assigned to a different farmer.');
    }
    if (coupon.assignedAdvisorId && (user.role !== Role.ADVISOR || user.id !== coupon.assignedAdvisorId)) {
      throw new ForbiddenException('This coupon is assigned to a different advisor.');
    }
    if (user.role === Role.ADVISOR && targetFarmerId !== user.id) {
      await this.advisorAssignmentService.assertAdvisorAssignedToFarmerAnyExpiry(user.id, targetFarmerId);
    }

    return { coupon, targetFarmerId };
  }
}
