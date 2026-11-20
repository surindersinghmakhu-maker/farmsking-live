import type { AuthUser } from '../../common/types/auth-user.type';
import { MarketRatesService } from './market-rates.service';
export declare class MarketRatesController {
    private readonly marketRatesService;
    constructor(marketRatesService: MarketRatesService);
    getMyCropRates(user?: AuthUser | null): Promise<{
        state: string | null;
        rates: import("./market-rates.service").CropRateSummary[];
    }>;
    getWidgetSummary(cropName?: string, state?: string, unit?: string): Promise<{
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
    getSummary(cropName?: string, state?: string, unit?: string): Promise<{
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
