import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/withdrawals.api';

export function useMyWithdrawals() {
  return useQuery({ queryKey: ['withdrawals', 'mine'], queryFn: api.listMyWithdrawals });
}

export function useAllWithdrawals() {
  return useQuery({ queryKey: ['withdrawals', 'all'], queryFn: api.listAllWithdrawals });
}

export function useCreateWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createWithdrawal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useApproveWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approvedAmount, notes }: { id: string; approvedAmount?: number; notes?: string }) =>
      api.approveWithdrawal(id, approvedAmount, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useRejectWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => api.rejectWithdrawal(id, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['withdrawals'] }),
  });
}
