import type { AuthUser } from '../../common/types/auth-user.type';
import { CreatePriceLockDto, MandiAIService } from './mandi-ai.service';
export declare class MandiAIController {
    private readonly mandiAIService;
    constructor(mandiAIService: MandiAIService);
    get30DayPricePrediction(cropName?: string, mandiName?: string): Promise<{
        id: string;
        createdAt: Date;
        cropName: string;
        mandiName: string;
        predictedDate: Date;
        predictedPrice: import("@prisma/client/runtime/library").Decimal;
        confidenceScore: number;
    }[]>;
    createPriceLockContract(user: AuthUser, dto: CreatePriceLockDto): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        farmerId: string;
        cropName: string;
        buyerId: string;
        quantityQuintal: import("@prisma/client/runtime/library").Decimal;
        lockedRate: import("@prisma/client/runtime/library").Decimal;
        escrowDeposit: import("@prisma/client/runtime/library").Decimal;
    }>;
    getMyPriceLockContracts(user: AuthUser): Promise<({
        farmer: {
            id: string;
            kingId: string | null;
            name: string;
        };
        buyer: {
            id: string;
            kingId: string | null;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: string;
        farmerId: string;
        cropName: string;
        buyerId: string;
        quantityQuintal: import("@prisma/client/runtime/library").Decimal;
        lockedRate: import("@prisma/client/runtime/library").Decimal;
        escrowDeposit: import("@prisma/client/runtime/library").Decimal;
    })[]>;
}
