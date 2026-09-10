import type { AuthUser } from '../../common/types/auth-user.type';
import { PaymentReceiptsService } from './payment-receipts.service';
export declare class PaymentReceiptsController {
    private readonly paymentReceiptsService;
    constructor(paymentReceiptsService: PaymentReceiptsService);
    countMine(user: AuthUser): Promise<{
        count: number;
    }>;
    findOne(user: AuthUser, id: string): Promise<{
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
}
