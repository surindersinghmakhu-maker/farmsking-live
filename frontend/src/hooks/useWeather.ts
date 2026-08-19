import { useQuery } from '@tanstack/react-query';
import { getAdvisorWeatherAlerts, getCurrentWeather } from '../api/weather.api';

export function useCurrentWeather() {
  return useQuery({
    queryKey: ['weather', 'current'],
    queryFn: () => getCurrentWeather(),
    staleTime: 15 * 60 * 1000,
  });
}

/** Advisor viewing one of their assigned farmers'/gardeners' local weather (e.g. while chatting with them). */
export function useUserWeather(userId?: string) {
  return useQuery({
    queryKey: ['weather', 'user', userId],
    queryFn: () => getCurrentWeather(userId),
    enabled: !!userId,
    staleTime: 15 * 60 * 1000,
    retry: false,
  });
}

/** Advisor dashboard's Weather Alerts tab — assigned farmers currently crossing their configured thresholds. */
export function useAdvisorWeatherAlerts() {
  return useQuery({
    queryKey: ['weather', 'advisor-alerts'],
    queryFn: getAdvisorWeatherAlerts,
    staleTime: 15 * 60 * 1000,
  });
}
