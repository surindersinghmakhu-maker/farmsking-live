import type { AuthUser } from '../../common/types/auth-user.type';
import { MarketRatesService } from './market-rates.service';
export declare class MarketRatesController {
    private readonly marketRatesService;
    constructor(marketRatesService: MarketRatesService);
    getMyCropRates(user?: AuthUser | null): Promise<{
        state: string | null;
        rates: import("./market-rates.service").CropRateSummary[];
    }>;
}
