import { PrismaService } from '../prisma/prisma.service';
import { AdvisorAssignmentService } from '../advisor-assignment/advisor-assignment.service';
import { AuthUser } from '../../common/types/auth-user.type';
export interface DailyForecastDay {
    date: string;
    dayName: string;
    maxTempC: number;
    minTempC: number;
    condition: string;
    isRaining: boolean;
    precipitationMm: number;
    windSpeedMs: number;
}
export interface CurrentWeather {
    locationLabel: string;
    temperatureC: number;
    feelsLikeC: number;
    condition: string;
    isRaining: boolean;
    humidityPct: number;
    windSpeedMs: number;
    observedAt: string;
    forecast?: DailyForecastDay[];
}
export type WeatherAlertTrigger = 'RAIN' | 'MIN_TEMP' | 'MAX_TEMP' | 'WIND';
export interface FarmerWeatherAlert {
    farmerId: string;
    farmerName: string;
    kingId: string | null;
    photoUrl: string | null;
    triggers: WeatherAlertTrigger[];
    currentTemperatureC: number;
    isRaining: boolean;
    condition: string;
    locationLabel: string;
    minTempC: number | null;
    maxTempC: number | null;
}
export declare class WeatherService {
    private readonly prisma;
    private readonly advisorAssignmentService;
    private readonly cache;
    constructor(prisma: PrismaService, advisorAssignmentService: AdvisorAssignmentService);
    private resolvePincodeToPlace;
    private placeFromProfile;
    private resolveLocation;
    private geocode;
    private fetchCurrent;
    private getCurrentForPlace;
    getCurrent(user: AuthUser, targetUserId?: string): Promise<CurrentWeather>;
    getAdvisorAlerts(advisor: AuthUser): Promise<FarmerWeatherAlert[]>;
}
