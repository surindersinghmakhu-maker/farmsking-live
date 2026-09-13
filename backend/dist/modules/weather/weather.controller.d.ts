import type { AuthUser } from '../../common/types/auth-user.type';
import { WeatherService } from './weather.service';
export declare class WeatherController {
    private readonly weatherService;
    constructor(weatherService: WeatherService);
    getCurrent(user: AuthUser, userId?: string): Promise<import("./weather.service").CurrentWeather>;
    getAdvisorAlerts(user: AuthUser): Promise<import("./weather.service").FarmerWeatherAlert[]>;
}
