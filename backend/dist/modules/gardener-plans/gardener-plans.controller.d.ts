import type { AuthUser } from '../../common/types/auth-user.type';
import { GardenerPlansService } from './gardener-plans.service';
import { CreateGardenerPlanCouponDto } from './dto/create-gardener-plan-coupon.dto';
import { RedeemGardenerPlanCouponDto } from './dto/redeem-gardener-plan-coupon.dto';
export declare class GardenerPlansController {
    private readonly gardenerPlansService;
    constructor(gardenerPlansService: GardenerPlansService);
    getMyPlan(user: AuthUser): Promise<{
        limits: {
            maxPlants: number;
            advisorIncluded: boolean;
        } | {
            maxPlants: null;
            advisorIncluded: boolean;
        };
        plan: import(".prisma/client").GardenerSubscriptionPlan;
        endDate: Date | null;
        isExpired: boolean;
        inGrace: boolean;
        expiringSoon: boolean;
        daysUntilExpiry: number | null;
        gardenerId: string;
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
            plan: import(".prisma/client").$Enums.GardenerSubscriptionPlan;
            startDate: Date;
            endDate: Date | null;
            expiredAt: Date | null;
            couponId: string | null;
            gardenerId: string;
        };
        daysGranted: number;
        newEndDate: Date;
        extended: boolean;
    }>;
    createCoupon(user: AuthUser, dto: CreateGardenerPlanCouponDto): Promise<{
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
        plan: import(".prisma/client").$Enums.GardenerSubscriptionPlan;
        startDate: Date;
        endDate: Date | null;
        expiredAt: Date | null;
        couponId: string | null;
        gardenerId: string;
    })[]>;
}
