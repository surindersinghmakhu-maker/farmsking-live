import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
export interface CropRateSummary {
    cropName: string;
    unit: string;
    localMinRate: number | null;
    localMaxRate: number | null;
    localAvgRate: number | null;
    localSampleCount: number;
    nationalMinRate: number | null;
    nationalMaxRate: number | null;
    nationalAvgRate: number | null;
    nationalSampleCount: number;
}
export declare function toEnglishCropName(rawName: string): string;
export declare class MarketRatesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMyCropRates(user?: AuthUser | null): Promise<{
        state: string | null;
        rates: CropRateSummary[];
    }>;
}
