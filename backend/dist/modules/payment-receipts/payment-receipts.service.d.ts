import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
export declare class PaymentReceiptsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findOneOrThrow(user: AuthUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        farmerId: string;
        partyId: string;
        partyName: string;
        previousBalance: import("@prisma/client/runtime/library").Decimal;
        receiptNo: string;
        isReceived: boolean;
        paymentAmount: import("@prisma/client/runtime/library").Decimal;
        netBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
    countMine(user: AuthUser): Promise<{
        count: number;
    }>;
}
