import type { AuthUser } from '../../common/types/auth-user.type';
import { WalletService } from './wallet.service';
import { CreditWalletDto } from './dto/credit-wallet.dto';
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
    getMyWallet(user: AuthUser): Promise<{
        balance: number;
        welcomeEarnings: number;
        referralEarnings: number;
        commissionEarnings: number;
        transactions: ({
            relatedUser: {
                name: string;
                mobile: string;
                id: string;
                kingId: string | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            userId: string;
            type: import(".prisma/client").$Enums.WalletTransactionType;
            couponRedemptionId: string | null;
            reason: string;
            withdrawalRequestId: string | null;
            relatedUserId: string | null;
        })[];
    }>;
    claimWelcomeBonus(user: AuthUser): Promise<{
        balance: number;
        welcomeEarnings: number;
        referralEarnings: number;
        commissionEarnings: number;
        transactions: ({
            relatedUser: {
                name: string;
                mobile: string;
                id: string;
                kingId: string | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            userId: string;
            type: import(".prisma/client").$Enums.WalletTransactionType;
            couponRedemptionId: string | null;
            reason: string;
            withdrawalRequestId: string | null;
            relatedUserId: string | null;
        })[];
    }>;
    getReferralStatement(user: AuthUser): Promise<{
        summary: {
            totalReferees: number;
            totalIssuedBonus: number;
            totalPendingBonus: number;
            signupBonusAmount: number;
            welcomeBonusAmount: number;
            planUpgradeBonusAmount: number;
        };
        myReferralInfo: any;
        referees: {
            refereeId: string;
            refereeName: string;
            refereeKingId: string;
            registrationDate: string;
            issuedAmount: number;
            signupBonusIssued: number;
            planBonusIssued: number;
            pendingAmount: number;
            status: string;
            referenceCodeUsed: string;
        }[];
    }>;
    getAdminAllWallets(search?: string, role?: string, page?: string, limit?: string): Promise<{
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        items: {
            balance: number;
            totalCredit: number;
            totalDebit: number;
            pendingWithdrawal: number;
            welcomeEarnings: number;
            referralEarnings: number;
            commissionEarnings: number;
            name: string;
            mobile: string;
            upiId: string | null;
            id: string;
            kingId: string | null;
            role: import(".prisma/client").$Enums.Role;
            roles: import(".prisma/client").$Enums.Role[];
            bankAccountNumber: string | null;
            bankIfsc: string | null;
            createdAt: Date;
        }[];
    }>;
    getAdminBonusReport(): Promise<{
        summary: {
            totalBonusIssued: number;
            totalWelcome: number;
            countWelcome: number;
            totalReferralSignup: number;
            countReferralSignup: number;
            totalReferralPlan: number;
            countReferralPlan: number;
            totalOtherBonus: number;
            countOtherBonus: number;
            totalWalletLiability: number;
            totalBonusTransactions: number;
        };
        transactions: {
            id: string;
            amount: number;
            reason: string;
            createdAt: Date;
            category: "OTHER" | "WELCOME" | "REFERRAL_SIGNUP" | "REFERRAL_PLAN";
            user: {
                name: string;
                mobile: string;
                id: string;
                kingId: string | null;
                role: import(".prisma/client").$Enums.Role;
            };
            relatedUser: {
                name: string;
                mobile: string;
                id: string;
                kingId: string | null;
                role: import(".prisma/client").$Enums.Role;
            } | null;
        }[];
    }>;
    getAdminAutomatedReport(): Promise<{
        generatedAt: string;
        summary: {
            totalActiveBalanceUsers: number;
            totalSystemLiability: number;
            totalWithdrawalsCount: number;
            totalPendingWithdrawals: number;
            countPendingWithdrawals: number;
            totalApprovedWithdrawals: number;
            countApprovedWithdrawals: number;
            totalRejectedWithdrawals: number;
            countRejectedWithdrawals: number;
            totalManualCredits: number;
            totalManualDebits: number;
            totalInAppSpending: number;
        };
        activeBalanceUsers: {
            balance: number;
            totalCredit: number;
            totalDebit: number;
            welcomeEarnings: number;
            referralEarnings: number;
            commissionEarnings: number;
            name: string;
            mobile: string;
            upiId: string | null;
            id: string;
            kingId: string | null;
            role: import(".prisma/client").$Enums.Role;
            bankAccountNumber: string | null;
            bankIfsc: string | null;
            createdAt: Date;
        }[];
        withdrawals: ({
            businessPartner: {
                name: string;
                mobile: string;
                upiId: string | null;
                id: string;
                kingId: string | null;
                bankAccountNumber: string | null;
                bankIfsc: string | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.WithdrawalStatus;
            notes: string | null;
            platformExpense: boolean;
            businessPartnerId: string;
            gstAmount: import("@prisma/client/runtime/library").Decimal | null;
            requestedAt: Date;
            requestedAmount: import("@prisma/client/runtime/library").Decimal;
            approvedAmount: import("@prisma/client/runtime/library").Decimal | null;
            platformFeeAmount: import("@prisma/client/runtime/library").Decimal | null;
            netPayableAmount: import("@prisma/client/runtime/library").Decimal | null;
            processedAt: Date | null;
            processedById: string | null;
        })[];
        manualTransactions: ({
            user: {
                name: string;
                mobile: string;
                id: string;
                kingId: string | null;
                role: import(".prisma/client").$Enums.Role;
            };
        } & {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            userId: string;
            type: import(".prisma/client").$Enums.WalletTransactionType;
            couponRedemptionId: string | null;
            reason: string;
            withdrawalRequestId: string | null;
            relatedUserId: string | null;
        })[];
        inAppUsageTransactions: ({
            user: {
                name: string;
                mobile: string;
                id: string;
                kingId: string | null;
                role: import(".prisma/client").$Enums.Role;
            };
        } & {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            userId: string;
            type: import(".prisma/client").$Enums.WalletTransactionType;
            couponRedemptionId: string | null;
            reason: string;
            withdrawalRequestId: string | null;
            relatedUserId: string | null;
        })[];
    }>;
    getWalletForUser(userId: string): Promise<{
        balance: number;
        welcomeEarnings: number;
        referralEarnings: number;
        commissionEarnings: number;
        transactions: ({
            relatedUser: {
                name: string;
                mobile: string;
                id: string;
                kingId: string | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            userId: string;
            type: import(".prisma/client").$Enums.WalletTransactionType;
            couponRedemptionId: string | null;
            reason: string;
            withdrawalRequestId: string | null;
            relatedUserId: string | null;
        })[];
    }>;
    creditWallet(admin: AuthUser, userId: string, dto: CreditWalletDto): Promise<{
        balance: number;
        welcomeEarnings: number;
        referralEarnings: number;
        commissionEarnings: number;
        transactions: ({
            relatedUser: {
                name: string;
                mobile: string;
                id: string;
                kingId: string | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            userId: string;
            type: import(".prisma/client").$Enums.WalletTransactionType;
            couponRedemptionId: string | null;
            reason: string;
            withdrawalRequestId: string | null;
            relatedUserId: string | null;
        })[];
    }>;
    debitWallet(admin: AuthUser, userId: string, dto: CreditWalletDto): Promise<{
        balance: number;
        welcomeEarnings: number;
        referralEarnings: number;
        commissionEarnings: number;
        transactions: ({
            relatedUser: {
                name: string;
                mobile: string;
                id: string;
                kingId: string | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            userId: string;
            type: import(".prisma/client").$Enums.WalletTransactionType;
            couponRedemptionId: string | null;
            reason: string;
            withdrawalRequestId: string | null;
            relatedUserId: string | null;
        })[];
    }>;
}
