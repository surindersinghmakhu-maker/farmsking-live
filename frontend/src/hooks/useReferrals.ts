import { useQuery } from '@tanstack/react-query';
import { getMyReferrals } from '../api/users.api';

export function useMyReferrals() {
  return useQuery({ queryKey: ['users', 'me', 'referrals'], queryFn: getMyReferrals });
}
