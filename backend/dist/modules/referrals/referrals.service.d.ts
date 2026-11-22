import { FarmerSubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { AuthUser } from '../../common/types/auth-user.type';
export declare class ReferralsService {
    private readonly prisma;
    private readonly walletService;
    constructor(prisma: PrismaService, walletService: WalletService);
    linkReferralOnSignUp(referredUserId: string, referrerKingId: string): Promise<{
        id: string;
        createdAt: Date;
        level: number;
        referrerId: string;
        referredUserId: string;
        isGuarantor: boolean;
        trustScoreBonus: number;
    } | null>;
    creditLifetimeRoyalty(sourceUserId: string, purchaseAmount: number, royaltyType: 'PLAN_PURCHASE' | 'STORE_PURCHASE' | 'SERVICE_HIRE', referenceCode?: string): Promise<void>;
    checkAndRewardMilestoneFreeCoupon(referrerId: string, planTier?: FarmerSubscriptionPlan): Promise<{
        id: string;
        createdAt: Date;
        plan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
        assignedAdvisorId: string | null;
        category: import(".prisma/client").$Enums.PlanCouponCategory;
        code: string;
        expiresAt: Date | null;
        createdById: string;
        daysGranted: number;
        assignedFarmerId: string | null;
        assignedBusinessPartnerId: string | null;
        isUsed: boolean;
        usedAt: Date | null;
        usedByFarmerId: string | null;
        generationCostAmount: import("@prisma/client/runtime/library").Decimal | null;
        doctorFeeAmount: import("@prisma/client/runtime/library").Decimal | null;
        adminPlatformFeePercent: import("@prisma/client/runtime/library").Decimal | null;
        adminPlatformFeeAmount: import("@prisma/client/runtime/library").Decimal | null;
        includeMembership: boolean;
        includedMembershipPlan: import(".prisma/client").$Enums.FarmerSubscriptionPlan | null;
        includedMembershipDays: number | null;
        createdByRole: import(".prisma/client").$Enums.Role | null;
        payoutAmount: import("@prisma/client/runtime/library").Decimal | null;
        payoutRecipientId: string | null;
        doctorKingId: string | null;
        advisorKingId: string | null;
    } | undefined>;
    getMyReferralNetwork(user: AuthUser): Promise<{
        kingId: string;
        inviteUrl: string;
        directCount: number;
        extendedCount: number;
        totalNetworkCount: number;
        totalRoyaltiesEarned: number;
        directReferrals: ({
            referredUser: {
                id: string;
                kingId: string | null;
                mobile: string;
                name: string;
                createdAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            level: number;
            referrerId: string;
            referredUserId: string;
            isGuarantor: boolean;
            trustScoreBonus: number;
        })[];
        extendedReferrals: ({
            referredUser: {
                id: string;
                kingId: string | null;
                name: string;
                createdAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            level: number;
            referrerId: string;
            referredUserId: string;
            isGuarantor: boolean;
            trustScoreBonus: number;
        })[];
        royaltiesHistory: ({
            sourceUser: {
                id: string;
                kingId: string | null;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            sourceUserId: string;
            royaltyType: string;
            referenceCode: string | null;
        })[];
    }>;
}
