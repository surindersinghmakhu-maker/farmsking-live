import { useQuery } from '@tanstack/react-query';
import { getCurrentWeather } from '../api/weather.api';

export function useCurrentWeather() {
  return useQuery({
    queryKey: ['weather', 'current'],
    queryFn: getCurrentWeather,
    staleTime: 15 * 60 * 1000,
  });
}
