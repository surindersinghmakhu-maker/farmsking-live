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
    private ratesCache;
    private readonly CACHE_TTL_MS;
    constructor(prisma: PrismaService);
    getMyCropRates(user?: AuthUser | null): Promise<{
        state: string | null;
        rates: CropRateSummary[];
    }>;
    getCropWidgetSummary(rawCropName?: string, targetState?: string, targetUnit?: string): Promise<{
        success: boolean;
        cropName: string;
        category: string;
        unit: string;
        rates: {
            local: {
                mandi: string;
                state: string;
                minRate: number;
                maxRate: number;
                avgRate: number;
                modalRate: number;
                trend: string;
                change: string;
                sampleCount: number;
            };
            state: {
                stateName: string;
                minRate: number;
                maxRate: number;
                avgRate: number;
                sampleCount: number;
            };
            national: {
                hubName: string;
                minRate: number;
                maxRate: number;
                avgRate: number;
                sampleCount: number;
            };
        };
        weather: {
            temp: string;
            condition: string;
            humidity: string;
            windSpeed: string;
            spraySafe: boolean;
            sprayAdvice: string;
        };
        deepLinks: {
            scanDoctor: string;
            mandiRates: string;
            farmCare: string;
        };
        updatedAt: string;
        serverTimestamp: string;
    }>;
}
