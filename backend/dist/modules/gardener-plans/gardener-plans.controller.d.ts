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
            startDate: Date;
            endDate: Date | null;
            plan: import(".prisma/client").$Enums.GardenerSubscriptionPlan;
            couponId: string | null;
            gardenerId: string;
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
        plan: import(".prisma/client").$Enums.GardenerSubscriptionPlan;
        daysGranted: number;
        createdById: string;
        code: string;
        assignedGardenerId: string | null;
        isUsed: boolean;
        usedAt: Date | null;
        usedByGardenerId: string | null;
        expiresAt: Date | null;
    }>;
    listAllCoupons(): import(".prisma/client").Prisma.PrismaPromise<({
        createdBy: {
            name: string;
            id: string;
        };
        assignedGardener: {
            name: string;
            mobile: string;
            id: string;
        } | null;
        usedByGardener: {
            name: string;
            mobile: string;
            id: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        plan: import(".prisma/client").$Enums.GardenerSubscriptionPlan;
        daysGranted: number;
        createdById: string;
        code: string;
        assignedGardenerId: string | null;
        isUsed: boolean;
        usedAt: Date | null;
        usedByGardenerId: string | null;
        expiresAt: Date | null;
    })[]>;
    listAllGardenerPlans(): import(".prisma/client").Prisma.PrismaPromise<({
        coupon: {
            plan: import(".prisma/client").$Enums.GardenerSubscriptionPlan;
            code: string;
        } | null;
        gardener: {
            name: string;
            mobile: string;
            id: string;
            kingId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startDate: Date;
        endDate: Date | null;
        plan: import(".prisma/client").$Enums.GardenerSubscriptionPlan;
        couponId: string | null;
        gardenerId: string;
        expiredAt: Date | null;
        hasUsedVipTrial: boolean;
        trialStartedAt: Date | null;
    })[]>;
}
