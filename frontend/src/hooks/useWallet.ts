import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { creditWallet, debitWallet, getMyWallet, getWalletForUser } from '../api/wallet.api';

export function useMyWallet() {
  return useQuery({ queryKey: ['wallet', 'mine'], queryFn: getMyWallet });
}

/** Admin: view any partner/advisor's full wallet ledger. */
export function useWalletForUser(userId: string | undefined) {
  return useQuery({
    queryKey: ['wallet', 'admin', userId],
    queryFn: () => getWalletForUser(userId as string),
    enabled: !!userId,
  });
}

/** Admin/Super Admin: manually add balance to any user's wallet. */
export function useCreditWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, amount, reason }: { userId: string; amount: number; reason?: string }) =>
      creditWallet(userId, amount, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'admin', variables.userId] });
    },
  });
}

/** Admin/Super Admin: manually deduct balance from any user's wallet. */
export function useDebitWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, amount, reason }: { userId: string; amount: number; reason?: string }) =>
      debitWallet(userId, amount, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'admin', variables.userId] });
    },
  });
}
