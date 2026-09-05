import { useQuery } from '@tanstack/react-query';
import { getMyCropRates } from '../api/marketRates.api';

export function useMyCropRates() {
  return useQuery({
    queryKey: ['market-rates', 'my-crops'],
    queryFn: getMyCropRates,
    staleTime: 0,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
}
