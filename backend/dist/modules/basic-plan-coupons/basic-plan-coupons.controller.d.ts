import type { AuthUser } from '../../common/types/auth-user.type';
import { BasicPlanCouponsService } from './basic-plan-coupons.service';
import { CreateBasicPlanCouponDto } from './dto/create-basic-plan-coupon.dto';
export declare class BasicPlanCouponsController {
    private readonly basicPlanCouponsService;
    constructor(basicPlanCouponsService: BasicPlanCouponsService);
    create(user: AuthUser, dto: CreateBasicPlanCouponDto): Promise<{
        id: string;
        createdAt: Date;
        code: string;
        createdById: string;
        daysGranted: number;
        isUsed: boolean;
        usedAt: Date | null;
        usedByFarmerId: string | null;
        listPrice: import("@prisma/client/runtime/library").Decimal;
        purchasedById: string | null;
        purchasePrice: import("@prisma/client/runtime/library").Decimal | null;
        purchasedAt: Date | null;
    }>;
    listAll(): import(".prisma/client").Prisma.PrismaPromise<({
        createdBy: {
            id: string;
            kingId: string | null;
            name: string;
        };
        usedByFarmer: {
            id: string;
            kingId: string | null;
            name: string;
        } | null;
        purchasedBy: {
            id: string;
            kingId: string | null;
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        code: string;
        createdById: string;
        daysGranted: number;
        isUsed: boolean;
        usedAt: Date | null;
        usedByFarmerId: string | null;
        listPrice: import("@prisma/client/runtime/library").Decimal;
        purchasedById: string | null;
        purchasePrice: import("@prisma/client/runtime/library").Decimal | null;
        purchasedAt: Date | null;
    })[]>;
    listAvailable(): import(".prisma/client").Prisma.PrismaPromise<({
        createdBy: {
            id: string;
            kingId: string | null;
            name: string;
        };
        usedByFarmer: {
            id: string;
            kingId: string | null;
            name: string;
        } | null;
        purchasedBy: {
            id: string;
            kingId: string | null;
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        code: string;
        createdById: string;
        daysGranted: number;
        isUsed: boolean;
        usedAt: Date | null;
        usedByFarmerId: string | null;
        listPrice: import("@prisma/client/runtime/library").Decimal;
        purchasedById: string | null;
        purchasePrice: import("@prisma/client/runtime/library").Decimal | null;
        purchasedAt: Date | null;
    })[]>;
    listMine(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        createdBy: {
            id: string;
            kingId: string | null;
            name: string;
        };
        usedByFarmer: {
            id: string;
            kingId: string | null;
            name: string;
        } | null;
        purchasedBy: {
            id: string;
            kingId: string | null;
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        code: string;
        createdById: string;
        daysGranted: number;
        isUsed: boolean;
        usedAt: Date | null;
        usedByFarmerId: string | null;
        listPrice: import("@prisma/client/runtime/library").Decimal;
        purchasedById: string | null;
        purchasePrice: import("@prisma/client/runtime/library").Decimal | null;
        purchasedAt: Date | null;
    })[]>;
    purchase(user: AuthUser, code: string): Promise<{
        createdBy: {
            id: string;
            kingId: string | null;
            name: string;
        };
        usedByFarmer: {
            id: string;
            kingId: string | null;
            name: string;
        } | null;
        purchasedBy: {
            id: string;
            kingId: string | null;
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        code: string;
        createdById: string;
        daysGranted: number;
        isUsed: boolean;
        usedAt: Date | null;
        usedByFarmerId: string | null;
        listPrice: import("@prisma/client/runtime/library").Decimal;
        purchasedById: string | null;
        purchasePrice: import("@prisma/client/runtime/library").Decimal | null;
        purchasedAt: Date | null;
    }>;
    redeem(user: AuthUser, code: string): Promise<{
        plan: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            farmerId: string;
            startDate: Date;
            endDate: Date | null;
            plan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
            expiredAt: Date | null;
            couponId: string | null;
        };
        daysAdded: number;
        newEndDate: Date;
    }>;
}
