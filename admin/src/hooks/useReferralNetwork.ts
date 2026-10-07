import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyReferralNetwork, linkReferralOnSignUp } from '../api/referrals.api';

export function useMyReferralNetwork() {
  return useQuery({
    queryKey: ['referral-network', 'mine'],
    queryFn: getMyReferralNetwork,
  });
}

export function useLinkReferralOnSignUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (referrerKingId: string) => linkReferralOnSignUp(referrerKingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-network'] });
    },
  });
}
