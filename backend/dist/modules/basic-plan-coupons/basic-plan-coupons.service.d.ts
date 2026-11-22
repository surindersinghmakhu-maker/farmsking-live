import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateBasicPlanCouponDto } from './dto/create-basic-plan-coupon.dto';
export declare class BasicPlanCouponsService {
    private readonly prisma;
    private readonly walletService;
    constructor(prisma: PrismaService, walletService: WalletService);
    create(admin: AuthUser, dto: CreateBasicPlanCouponDto): Promise<{
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
    listAvailableForPurchase(): import(".prisma/client").Prisma.PrismaPromise<({
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
    listMinePurchased(partner: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
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
    purchase(partner: AuthUser, code: string): Promise<{
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
    redeem(farmer: AuthUser, code: string): Promise<{
        plan: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            farmerId: string;
            plan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
            startDate: Date;
            endDate: Date | null;
            expiredAt: Date | null;
            couponId: string | null;
        };
        daysAdded: number;
        newEndDate: Date;
    }>;
}
