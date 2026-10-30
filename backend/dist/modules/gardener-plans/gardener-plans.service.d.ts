import { GardenerSubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateGardenerPlanCouponDto } from './dto/create-gardener-plan-coupon.dto';
import { RedeemGardenerPlanCouponDto } from './dto/redeem-gardener-plan-coupon.dto';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { CashfreeService } from '../cashfree/cashfree.service';
export declare const FREE_PLAN_MAX_PLANTS = 5;
export declare const EXPIRY_WARNING_DAYS = 5;
export declare const GRACE_PERIOD_DAYS = 2;
export declare const RENEW_HISTORY_MONTHS = 3;
export declare class GardenerPlansService {
    private readonly prisma;
    private readonly appSettingsService;
    private readonly cashfreeService;
    constructor(prisma: PrismaService, appSettingsService: AppSettingsService, cashfreeService: CashfreeService);
    getEffectivePlan(gardenerId: string): Promise<{
        plan: GardenerSubscriptionPlan;
        endDate: Date | null;
        isExpired: boolean;
        inGrace: boolean;
        expiringSoon: boolean;
        daysUntilExpiry: number | null;
    }>;
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
    private renewalBaseDate;
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
            expiredAt: Date | null;
            couponId: string | null;
            gardenerId: string;
            hasUsedVipTrial: boolean;
            trialStartedAt: Date | null;
        };
        daysGranted: number;
        newEndDate: Date;
        extended: boolean;
    }>;
    createCoupon(admin: AuthUser, dto: CreateGardenerPlanCouponDto): Promise<{
        id: string;
        createdAt: Date;
        code: string;
        expiresAt: Date | null;
        createdById: string;
        plan: import(".prisma/client").$Enums.GardenerSubscriptionPlan;
        daysGranted: number;
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
        code: string;
        expiresAt: Date | null;
        createdById: string;
        plan: import(".prisma/client").$Enums.GardenerSubscriptionPlan;
        daysGranted: number;
        isUsed: boolean;
        usedAt: Date | null;
        assignedGardenerId: string | null;
        usedByGardenerId: string | null;
    })[]>;
    listAllGardenerPlans(): import(".prisma/client").Prisma.PrismaPromise<({
        coupon: {
            code: string;
            plan: import(".prisma/client").$Enums.GardenerSubscriptionPlan;
        } | null;
        gardener: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startDate: Date;
        endDate: Date | null;
        plan: import(".prisma/client").$Enums.GardenerSubscriptionPlan;
        expiredAt: Date | null;
        couponId: string | null;
        gardenerId: string;
        hasUsedVipTrial: boolean;
        trialStartedAt: Date | null;
    })[]>;
    private resolveCoupon;
    initiatePayment(user: AuthUser, plan: GardenerSubscriptionPlan): Promise<{
        paymentSessionId: any;
        orderId: string;
    }>;
    activateVipTrial(user: AuthUser): Promise<{
        success: boolean;
        plan: "VIP";
        trialEndDate: Date;
        message: string;
    }>;
}
