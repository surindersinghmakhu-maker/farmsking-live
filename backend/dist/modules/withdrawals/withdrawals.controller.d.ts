import type { AuthUser } from '../../common/types/auth-user.type';
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { ApproveWithdrawalDto } from './dto/approve-withdrawal.dto';
export declare class WithdrawalsController {
    private readonly withdrawalsService;
    constructor(withdrawalsService: WithdrawalsService);
    create(user: AuthUser, dto: CreateWithdrawalDto): Promise<void>;
    listMine(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<{
        status: import(".prisma/client").$Enums.WithdrawalStatus;
        id: string;
        notes: string | null;
        requestedAt: Date;
        platformExpense: boolean;
        businessPartnerId: string;
        gstAmount: import("@prisma/client/runtime/library").Decimal | null;
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
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
            upiId: string | null;
            bankAccountNumber: string | null;
            bankIfsc: string | null;
        };
        status: import(".prisma/client").$Enums.WithdrawalStatus;
        id: string;
        notes: string | null;
        requestedAt: Date;
        platformExpense: boolean;
        businessPartnerId: string;
        gstAmount: import("@prisma/client/runtime/library").Decimal | null;
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
        status: import(".prisma/client").$Enums.WithdrawalStatus;
        id: string;
        notes: string | null;
        requestedAt: Date;
        platformExpense: boolean;
        businessPartnerId: string;
        requestedAmount: import("@prisma/client/runtime/library").Decimal;
        approvedAmount: import("@prisma/client/runtime/library").Decimal | null;
        processedAt: Date | null;
        processedById: string | null;
    }>;
    reject(user: AuthUser, id: string, notes?: string): Promise<{
        status: import(".prisma/client").$Enums.WithdrawalStatus;
        id: string;
        notes: string | null;
        requestedAt: Date;
        platformExpense: boolean;
        businessPartnerId: string;
        gstAmount: import("@prisma/client/runtime/library").Decimal | null;
        requestedAmount: import("@prisma/client/runtime/library").Decimal;
        approvedAmount: import("@prisma/client/runtime/library").Decimal | null;
        platformFeeAmount: import("@prisma/client/runtime/library").Decimal | null;
        netPayableAmount: import("@prisma/client/runtime/library").Decimal | null;
        processedAt: Date | null;
        processedById: string | null;
    }>;
}
