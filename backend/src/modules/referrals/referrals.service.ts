import { Injectable } from '@nestjs/common';
import { FarmerSubscriptionPlan, PlanCouponCategory, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { AuthUser } from '../../common/types/auth-user.type';



@Injectable()
export class ReferralsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  /** Link a new user to their referrer using King ID (e.g. FK-100238) or Referral Code */
  async linkReferralOnSignUp(referredUserId: string, referrerKingId: string) {
    if (!referrerKingId) return null;

    const referrer = await this.prisma.user.findFirst({
      where: {
        kingId: referrerKingId.trim(),
        deletedAt: null,
      },
    });


    if (!referrer || referrer.id === referredUserId) {
      return null;
    }

    // Check if already referred
    const existing = await this.prisma.userReferral.findUnique({
      where: { referredUserId },
    });
    if (existing) return existing;

    // Create Level 1 Direct Referral
    const directRef = await this.prisma.userReferral.create({
      data: {
        referrerId: referrer.id,
        referredUserId,
        level: 1,
        trustScoreBonus: 10,
      },
    });

    // Check if referrer was also referred (Level 2 Grandparent Referral)
    const grandparentRef = await this.prisma.userReferral.findUnique({
      where: { referredUserId: referrer.id },
    });

    if (grandparentRef) {
      await this.prisma.userReferral.create({
        data: {
          referrerId: grandparentRef.referrerId,
          referredUserId,
          level: 2,
          trustScoreBonus: 5,
        },
      }).catch(() => null);
    }

    // 20-Referral Milestone Reward: Check if referrer reached 20 referrals to issue 1 Free Admin Plan Coupon
    await this.checkAndRewardMilestoneFreeCoupon(referrer.id).catch(() => null);

    return directRef;
  }


  /** Trigger Lifetime Royalty cashback when a referred user makes a purchase or plan renewal */
  async creditLifetimeRoyalty(
    sourceUserId: string,
    purchaseAmount: number,
    royaltyType: 'PLAN_PURCHASE' | 'STORE_PURCHASE' | 'SERVICE_HIRE',
    referenceCode?: string,
  ) {
    if (!purchaseAmount || purchaseAmount <= 0) return;

    // Find referrers (Level 1 & Level 2)
    const referrals = await this.prisma.userReferral.findMany({
      where: { referredUserId: sourceUserId },
      include: { referrer: { select: { id: true, name: true, kingId: true } } },
    });

    const sourceUser = await this.prisma.user.findUnique({
      where: { id: sourceUserId },
      select: { name: true, kingId: true },
    });
    const sourceLabel = sourceUser ? `${sourceUser.name} (${sourceUser.kingId || 'Farmer'})` : 'Referred Farmer';

    for (const ref of referrals) {
      // Plan purchases = 1% (L1) / 0.5% (L2). Store shopping = 0.01% (L1) / 0.005% (L2)
      let rate = 0;
      if (royaltyType === 'PLAN_PURCHASE') {
        rate = ref.level === 1 ? 0.01 : 0.005;
      } else {
        rate = ref.level === 1 ? 0.0001 : 0.00005;
      }

      const royaltyAmount = Math.round(purchaseAmount * rate * 100) / 100;

      if (royaltyAmount > 0) {
        // Record Royalty
        await this.prisma.referralRoyalty.create({
          data: {
            userId: ref.referrerId,
            sourceUserId,
            amount: royaltyAmount,
            royaltyType,
            referenceCode: referenceCode || null,
          },
        });

        // Credit Referrer Wallet
        const label = royaltyType === 'PLAN_PURCHASE' ? (ref.level === 1 ? '1%' : '0.5%') : (ref.level === 1 ? '0.01%' : '0.005%');
        await this.walletService.credit(
          ref.referrerId,
          royaltyAmount,
          `Lifetime Royalty (${label}) for ${royaltyType === 'PLAN_PURCHASE' ? 'plan renewal' : 'shopping'} by ${sourceLabel}`,
          { relatedUserId: sourceUserId },
        );
      }
    }
  }

  /** Check 20-referral milestone for a referrer and auto-generate 1 Free Admin Coupon in their account */
  async checkAndRewardMilestoneFreeCoupon(referrerId: string, planTier: FarmerSubscriptionPlan = FarmerSubscriptionPlan.PRO) {
    const threshold = 20; // 20 referrals threshold rule
    const directCount = await this.prisma.userReferral.count({
      where: { referrerId, level: 1 },
    });

    if (directCount > 0 && directCount % threshold === 0) {
      const superAdmin = await this.prisma.user.findFirst({
        where: { role: Role.SUPER_ADMIN, deletedAt: null },
        select: { id: true },
      });
      if (!superAdmin) return;

      const prefix = planTier === FarmerSubscriptionPlan.PRO ? 'KC-LITE' : planTier === FarmerSubscriptionPlan.SMART ? 'KC-PRO' : 'KC-FREE';
      const code = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

      return this.prisma.farmerPlanCoupon.create({
        data: {
          code,
          category: PlanCouponCategory.FARMER_PLAN,
          plan: planTier,
          daysGranted: 365,
          assignedFarmerId: referrerId,
          createdById: superAdmin.id,
          createdByRole: Role.SUPER_ADMIN,
          generationCostAmount: null, // ₹0 Admin reward
        },
      });
    }
  }

  /** Get calling user's Farm Network Circle, referrals, and lifetime royalty income */
  async getMyReferralNetwork(user: AuthUser) {
    const directReferrals = await this.prisma.userReferral.findMany({
      where: { referrerId: user.id, level: 1 },
      include: {
        referredUser: {
          select: { id: true, name: true, kingId: true, mobile: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const extendedReferrals = await this.prisma.userReferral.findMany({
      where: { referrerId: user.id, level: 2 },
      include: {
        referredUser: {
          select: { id: true, name: true, kingId: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const royalties = await this.prisma.referralRoyalty.findMany({
      where: { userId: user.id },
      include: {
        sourceUser: { select: { id: true, name: true, kingId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalRoyaltiesEarned = royalties.reduce((sum, r) => sum + Number(r.amount), 0);

    const currentUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { kingId: true },
    });

    const inviteKingId = currentUser?.kingId || user.id;
    const inviteUrl = `https://farmsking.com/invite?ref=${inviteKingId}`;


    return {
      kingId: inviteKingId,
      inviteUrl,
      directCount: directReferrals.length,
      extendedCount: extendedReferrals.length,
      totalNetworkCount: directReferrals.length + extendedReferrals.length,
      totalRoyaltiesEarned: Math.round(totalRoyaltiesEarned * 100) / 100,
      directReferrals,
      extendedReferrals,
      royaltiesHistory: royalties,
    };
  }
}
