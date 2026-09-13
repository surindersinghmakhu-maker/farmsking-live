import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { ApproveWithdrawalDto } from './dto/approve-withdrawal.dto';
export declare class WithdrawalsService {
    private readonly prisma;
    private readonly walletService;
    constructor(prisma: PrismaService, walletService: WalletService);
    private assertPayoutProfileComplete;
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
    private findOneOrThrow;
    approve(admin: AuthUser, id: string, dto: ApproveWithdrawalDto): Promise<{
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
    reject(admin: AuthUser, id: string, notes?: string): Promise<{
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
