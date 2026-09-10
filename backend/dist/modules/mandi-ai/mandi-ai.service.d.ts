import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
export declare class CreatePriceLockDto {
    cropName: string;
    quantityQuintal: number;
    lockedRate: number;
    buyerId?: string;
}
export declare class MandiAIService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    get30DayPricePrediction(cropName?: string, mandiName?: string): Promise<{
        id: string;
        createdAt: Date;
        cropName: string;
        mandiName: string;
        predictedDate: Date;
        predictedPrice: Prisma.Decimal;
        confidenceScore: number;
    }[]>;
    createPriceLockContract(user: AuthUser, dto: CreatePriceLockDto): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        farmerId: string;
        cropName: string;
        buyerId: string;
        quantityQuintal: Prisma.Decimal;
        lockedRate: Prisma.Decimal;
        escrowDeposit: Prisma.Decimal;
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
        quantityQuintal: Prisma.Decimal;
        lockedRate: Prisma.Decimal;
        escrowDeposit: Prisma.Decimal;
    })[]>;
}
