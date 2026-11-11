import type { AuthUser } from '../../common/types/auth-user.type';
import { CreatePriceLockDto, MandiAIService } from './mandi-ai.service';
export declare class MandiAIController {
    private readonly mandiAIService;
    constructor(mandiAIService: MandiAIService);
    get30DayPricePrediction(cropName?: string, mandiName?: string): Promise<{
        id: string;
        createdAt: Date;
        mandiName: string;
        cropName: string;
        confidenceScore: number;
        predictedDate: Date;
        predictedPrice: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    createPriceLockContract(user: AuthUser, dto: CreatePriceLockDto): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        farmerId: string;
        buyerId: string;
        cropName: string;
        quantityQuintal: import("@prisma/client/runtime/library").Decimal;
        lockedRate: import("@prisma/client/runtime/library").Decimal;
        escrowDeposit: import("@prisma/client/runtime/library").Decimal;
    }>;
    getMyPriceLockContracts(user: AuthUser): Promise<({
        farmer: {
            id: string;
            name: string;
            kingId: string | null;
        };
        buyer: {
            id: string;
            name: string;
            kingId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        status: string;
        farmerId: string;
        buyerId: string;
        cropName: string;
        quantityQuintal: import("@prisma/client/runtime/library").Decimal;
        lockedRate: import("@prisma/client/runtime/library").Decimal;
        escrowDeposit: import("@prisma/client/runtime/library").Decimal;
    })[]>;
}
