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
            name: string;
            id: string;
            kingId: string | null;
        };
        usedByFarmer: {
            name: string;
            id: string;
            kingId: string | null;
        } | null;
        purchasedBy: {
            name: string;
            id: string;
            kingId: string | null;
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
            name: string;
            id: string;
            kingId: string | null;
        };
        usedByFarmer: {
            name: string;
            id: string;
            kingId: string | null;
        } | null;
        purchasedBy: {
            name: string;
            id: string;
            kingId: string | null;
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
            name: string;
            id: string;
            kingId: string | null;
        };
        usedByFarmer: {
            name: string;
            id: string;
            kingId: string | null;
        } | null;
        purchasedBy: {
            name: string;
            id: string;
            kingId: string | null;
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
            name: string;
            id: string;
            kingId: string | null;
        };
        usedByFarmer: {
            name: string;
            id: string;
            kingId: string | null;
        } | null;
        purchasedBy: {
            name: string;
            id: string;
            kingId: string | null;
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
            startDate: Date;
            endDate: Date | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            couponId: string | null;
            farmerId: string;
            plan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
            expiredAt: Date | null;
        };
        daysAdded: number;
        newEndDate: Date;
    }>;
}
