import type { AuthUser } from '../../common/types/auth-user.type';
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { ApproveWithdrawalDto } from './dto/approve-withdrawal.dto';
export declare class WithdrawalsController {
    private readonly withdrawalsService;
    constructor(withdrawalsService: WithdrawalsService);
    create(user: AuthUser, dto: CreateWithdrawalDto): Promise<{
        id: string;
        businessPartnerId: string;
        status: import(".prisma/client").$Enums.WithdrawalStatus;
        notes: string | null;
        requestedAt: Date;
        requestedAmount: import("@prisma/client/runtime/library").Decimal;
        approvedAmount: import("@prisma/client/runtime/library").Decimal | null;
        processedAt: Date | null;
        processedById: string | null;
    }>;
    listMine(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        businessPartnerId: string;
        status: import(".prisma/client").$Enums.WithdrawalStatus;
        notes: string | null;
        requestedAt: Date;
        requestedAmount: import("@prisma/client/runtime/library").Decimal;
        approvedAmount: import("@prisma/client/runtime/library").Decimal | null;
        processedAt: Date | null;
        processedById: string | null;
    }[]>;
    listAll(): import(".prisma/client").Prisma.PrismaPromise<({
        businessPartner: {
            id: string;
            mobile: string;
            name: string;
        };
    } & {
        id: string;
        businessPartnerId: string;
        status: import(".prisma/client").$Enums.WithdrawalStatus;
        notes: string | null;
        requestedAt: Date;
        requestedAmount: import("@prisma/client/runtime/library").Decimal;
        approvedAmount: import("@prisma/client/runtime/library").Decimal | null;
        processedAt: Date | null;
        processedById: string | null;
    })[]>;
    approve(user: AuthUser, id: string, dto: ApproveWithdrawalDto): Promise<{
        id: string;
        businessPartnerId: string;
        status: import(".prisma/client").$Enums.WithdrawalStatus;
        notes: string | null;
        requestedAt: Date;
        requestedAmount: import("@prisma/client/runtime/library").Decimal;
        approvedAmount: import("@prisma/client/runtime/library").Decimal | null;
        processedAt: Date | null;
        processedById: string | null;
    }>;
    reject(user: AuthUser, id: string, notes?: string): Promise<{
        id: string;
        businessPartnerId: string;
        status: import(".prisma/client").$Enums.WithdrawalStatus;
        notes: string | null;
        requestedAt: Date;
        requestedAmount: import("@prisma/client/runtime/library").Decimal;
        approvedAmount: import("@prisma/client/runtime/library").Decimal | null;
        processedAt: Date | null;
        processedById: string | null;
    }>;
}
