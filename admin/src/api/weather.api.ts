import { apiClient } from './client';

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

export async function getCurrentWeather(userId?: string): Promise<CurrentWeather> {
  const { data } = await apiClient.get<CurrentWeather>('/weather/current', { params: userId ? { userId } : {} });
  return data;
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

/** Advisor dashboard's Weather Alerts tab — assigned farmers whose weather-alert thresholds are currently triggered. */
export async function getAdvisorWeatherAlerts(): Promise<FarmerWeatherAlert[]> {
  const { data } = await apiClient.get<FarmerWeatherAlert[]>('/weather/advisor-alerts');
  return data;
}
