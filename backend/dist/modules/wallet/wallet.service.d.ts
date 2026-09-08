import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
export declare class WalletService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    credit(userId: string, amount: number, reason: string, meta?: {
        couponRedemptionId?: string;
        withdrawalRequestId?: string;
        relatedUserId?: string;
    }): import(".prisma/client").Prisma.Prisma__WalletTransactionClient<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.WalletTransactionType;
        userId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        reason: string;
        couponRedemptionId: string | null;
        withdrawalRequestId: string | null;
        relatedUserId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    debit(userId: string, amount: number, reason: string, meta?: {
        couponRedemptionId?: string;
        withdrawalRequestId?: string;
        relatedUserId?: string;
    }): import(".prisma/client").Prisma.Prisma__WalletTransactionClient<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.WalletTransactionType;
        userId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        reason: string;
        couponRedemptionId: string | null;
        withdrawalRequestId: string | null;
        relatedUserId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    getBalance(userId: string): Promise<number>;
    getMyWallet(user: AuthUser): Promise<{
        balance: number;
        transactions: ({
            relatedUser: {
                id: string;
                kingId: string | null;
                mobile: string;
                name: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.WalletTransactionType;
            userId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            reason: string;
            couponRedemptionId: string | null;
            withdrawalRequestId: string | null;
            relatedUserId: string | null;
        })[];
    }>;
    getWalletForUser(userId: string): Promise<{
        balance: number;
        transactions: ({
            relatedUser: {
                id: string;
                kingId: string | null;
                mobile: string;
                name: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.WalletTransactionType;
            userId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            reason: string;
            couponRedemptionId: string | null;
            withdrawalRequestId: string | null;
            relatedUserId: string | null;
        })[];
    }>;
    adminCreditWallet(admin: AuthUser, userId: string, amount: number, reason?: string): Promise<{
        balance: number;
        transactions: ({
            relatedUser: {
                id: string;
                kingId: string | null;
                mobile: string;
                name: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.WalletTransactionType;
            userId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            reason: string;
            couponRedemptionId: string | null;
            withdrawalRequestId: string | null;
            relatedUserId: string | null;
        })[];
    }>;
    adminDebitWallet(admin: AuthUser, userId: string, amount: number, reason?: string): Promise<{
        balance: number;
        transactions: ({
            relatedUser: {
                id: string;
                kingId: string | null;
                mobile: string;
                name: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.WalletTransactionType;
            userId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            reason: string;
            couponRedemptionId: string | null;
            withdrawalRequestId: string | null;
            relatedUserId: string | null;
        })[];
    }>;
}
