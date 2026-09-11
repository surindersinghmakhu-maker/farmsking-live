import { useQuery } from '@tanstack/react-query';
import { getMyCropRates } from '../api/marketRates.api';

export function useMyCropRates() {
  return useQuery({
    queryKey: ['market-rates', 'my-crops'],
    queryFn: getMyCropRates,
    staleTime: 30_000, // Cache for 30 seconds
    refetchInterval: 60_000, // Refresh automatically every 60 seconds (1 minute)
    refetchOnWindowFocus: true,
  });
}
