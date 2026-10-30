import { apiClient } from './client';

export interface CurrentWeather {
  locationLabel: string;
  temperatureC: number;
  feelsLikeC: number;
  condition: string;
  isRaining: boolean;
  humidityPct: number;
  windSpeedMs: number;
  observedAt: string;
}

export async function getCurrentWeather(): Promise<CurrentWeather> {
  const { data } = await apiClient.get<CurrentWeather>('/weather/current');
  return data;
}
