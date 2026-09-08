import type { AuthUser } from '../../common/types/auth-user.type';
import { WalletService } from './wallet.service';
import { CreditWalletDto } from './dto/credit-wallet.dto';
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
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
    creditWallet(admin: AuthUser, userId: string, dto: CreditWalletDto): Promise<{
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
    debitWallet(admin: AuthUser, userId: string, dto: CreditWalletDto): Promise<{
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
