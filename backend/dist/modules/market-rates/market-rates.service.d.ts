import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
export interface CropRateSummary {
    cropName: string;
    unit: string;
    localAvgRate: number | null;
    localSampleCount: number;
    nationalAvgRate: number | null;
    nationalSampleCount: number;
}
export declare class MarketRatesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMyCropRates(user: AuthUser): Promise<{
        state: string | null;
        rates: CropRateSummary[];
    }>;
}
