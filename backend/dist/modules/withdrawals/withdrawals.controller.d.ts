import type { AuthUser } from '../../common/types/auth-user.type';
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { ApproveWithdrawalDto } from './dto/approve-withdrawal.dto';
export declare class WithdrawalsController {
    private readonly withdrawalsService;
    constructor(withdrawalsService: WithdrawalsService);
    create(user: AuthUser, dto: CreateWithdrawalDto): Promise<void>;
    listMine(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<{
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
    }[]>;
    listAll(): Promise<{
        partnerWallet: {
            balance: number;
            totalCredit: number;
            totalDebit: number;
            welcomeEarnings: number;
            referralEarnings: number;
            commissionEarnings: number;
        };
        businessPartner: {
            name: string;
            mobile: string;
            upiId: string | null;
            id: string;
            kingId: string | null;
            bankAccountNumber: string | null;
            bankIfsc: string | null;
        };
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
    }[]>;
    approve(user: AuthUser, id: string, dto: ApproveWithdrawalDto): Promise<{
        platformFeeAmount: number;
        gstAmount: number;
        netPayableAmount: number;
        id: string;
        status: import(".prisma/client").$Enums.WithdrawalStatus;
        notes: string | null;
        platformExpense: boolean;
        businessPartnerId: string;
        requestedAt: Date;
        requestedAmount: import("@prisma/client/runtime/library").Decimal;
        approvedAmount: import("@prisma/client/runtime/library").Decimal | null;
        processedAt: Date | null;
        processedById: string | null;
    }>;
    reject(user: AuthUser, id: string, notes?: string): Promise<{
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
    }>;
}
