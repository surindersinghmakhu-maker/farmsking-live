import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyCropRates } from '../api/marketRates.api';
import { getChatSocket } from '../lib/socket';

export function useMyCropRates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let isMounted = true;
    let socketRef: any = null;

    getChatSocket()
      .then((sock) => {
        if (!isMounted) return;
        socketRef = sock;
        const handleRateUpdate = () => {
          queryClient.invalidateQueries({ queryKey: ['market-rates'] });
        };
        sock.on('market_rate_updated', handleRateUpdate);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      if (socketRef) {
        socketRef.off('market_rate_updated');
      }
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['market-rates', 'my-crops'],
    queryFn: getMyCropRates,
    staleTime: 5_000, // Cache for 5 seconds
    refetchInterval: 15_000, // Refresh automatically every 15 seconds
    refetchOnWindowFocus: true,
    retry: 1,
  });
}


