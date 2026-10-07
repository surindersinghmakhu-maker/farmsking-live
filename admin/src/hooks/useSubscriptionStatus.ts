import { useQuery } from '@tanstack/react-query';
import { getMySubscription } from '../api/subscriptions.api';

/** Real source of truth for "is this farmer a paid Advisor Plan subscriber" — used to gate paid-only features. */
export function useSubscriptionStatus() {
  const query = useQuery({
    queryKey: ['subscriptions', 'mine'],
    queryFn: getMySubscription,
    staleTime: 5 * 60 * 1000,
  });

  return { ...query, isPaid: query.data?.status === 'ACTIVE' };
}
