import type { AuthUser } from '../../common/types/auth-user.type';
import { GardenerPlansService } from './gardener-plans.service';
import { GardenerSubscriptionPlan } from '@prisma/client';
import { CreateGardenerPlanCouponDto } from './dto/create-gardener-plan-coupon.dto';
import { RedeemGardenerPlanCouponDto } from './dto/redeem-gardener-plan-coupon.dto';
export declare class GardenerPlansController {
    private readonly gardenerPlansService;
    constructor(gardenerPlansService: GardenerPlansService);
    getMyPlan(user: AuthUser): Promise<{
        hasUsedVipTrial: boolean;
        trialStartedAt: Date | null;
        limits: {
            maxPlants: number;
            advisorIncluded: boolean;
        } | {
            maxPlants: null;
            advisorIncluded: boolean;
        };
        plan: GardenerSubscriptionPlan;
        endDate: Date | null;
        isExpired: boolean;
        inGrace: boolean;
        expiringSoon: boolean;
        daysUntilExpiry: number | null;
        gardenerId: string;
    }>;
    initiatePayment(user: AuthUser, plan: GardenerSubscriptionPlan): Promise<{
        isTestPayment: boolean;
        paymentSessionId: null;
        orderId: string;
    } | {
        paymentSessionId: any;
        orderId: string;
        isTestPayment?: undefined;
    }>;
    activateVipTrial(user: AuthUser): Promise<{
        success: boolean;
        plan: "VIP";
        trialEndDate: Date;
        message: string;
    }>;
    previewCoupon(user: AuthUser, code: string): Promise<{
        code: string;
        plan: import(".prisma/client").$Enums.GardenerSubscriptionPlan;
        daysGranted: number;
        currentPlan: import(".prisma/client").$Enums.GardenerSubscriptionPlan;
        newEndDate: Date;
        extendsExisting: boolean;
    }>;
    redeemCoupon(user: AuthUser, dto: RedeemGardenerPlanCouponDto): Promise<{
        plan: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            gardenerId: string;
            plan: import(".prisma/client").$Enums.GardenerSubscriptionPlan;
            couponId: string | null;
            startDate: Date;
            endDate: Date | null;
            expiredAt: Date | null;
            hasUsedVipTrial: boolean;
            trialStartedAt: Date | null;
        };
        daysGranted: number;
        newEndDate: Date;
        extended: boolean;
    }>;
    createCoupon(user: AuthUser, dto: CreateGardenerPlanCouponDto): Promise<{
        id: string;
        createdAt: Date;
        daysGranted: number;
        plan: import(".prisma/client").$Enums.GardenerSubscriptionPlan;
        createdById: string;
        code: string;
        expiresAt: Date | null;
        isUsed: boolean;
        usedAt: Date | null;
        assignedGardenerId: string | null;
        usedByGardenerId: string | null;
    }>;
    listAllCoupons(): import(".prisma/client").Prisma.PrismaPromise<({
        createdBy: {
            id: string;
            name: string;
        };
        assignedGardener: {
            id: string;
            mobile: string;
            name: string;
        } | null;
        usedByGardener: {
            id: string;
            mobile: string;
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        daysGranted: number;
        plan: import(".prisma/client").$Enums.GardenerSubscriptionPlan;
        createdById: string;
        code: string;
        expiresAt: Date | null;
        isUsed: boolean;
        usedAt: Date | null;
        assignedGardenerId: string | null;
        usedByGardenerId: string | null;
    })[]>;
    listAllGardenerPlans(): import(".prisma/client").Prisma.PrismaPromise<({
        gardener: {
            id: string;
            mobile: string;
            name: string;
            kingId: string | null;
        };
        coupon: {
            plan: import(".prisma/client").$Enums.GardenerSubscriptionPlan;
            code: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        gardenerId: string;
        plan: import(".prisma/client").$Enums.GardenerSubscriptionPlan;
        couponId: string | null;
        startDate: Date;
        endDate: Date | null;
        expiredAt: Date | null;
        hasUsedVipTrial: boolean;
        trialStartedAt: Date | null;
    })[]>;
}
