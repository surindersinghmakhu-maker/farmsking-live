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
        mandiName: string;
        cropName: string;
        confidenceScore: number;
        predictedDate: Date;
        predictedPrice: Prisma.Decimal;
    }[]>;
    createPriceLockContract(user: AuthUser, dto: CreatePriceLockDto): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        farmerId: string;
        buyerId: string;
        cropName: string;
        quantityQuintal: Prisma.Decimal;
        lockedRate: Prisma.Decimal;
        escrowDeposit: Prisma.Decimal;
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
        quantityQuintal: Prisma.Decimal;
        lockedRate: Prisma.Decimal;
        escrowDeposit: Prisma.Decimal;
    })[]>;
}
