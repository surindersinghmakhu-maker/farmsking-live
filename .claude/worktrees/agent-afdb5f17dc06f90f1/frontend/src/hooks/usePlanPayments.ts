import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/planPayments.api';

export function useMinePlanPayments() {
  return useQuery({ queryKey: ['plan-payments', 'mine'], queryFn: api.listMinePlanPayments });
}

export function usePendingPlanPayments() {
  return useQuery({ queryKey: ['plan-payments', 'pending'], queryFn: api.listPendingPlanPayments });
}

export function useInitiatePlanPayment() {
  return useMutation({
    mutationFn: (farmerId?: string) => api.initiatePlanPayment(farmerId),
  });
}

export function useSubmitPlanPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, utr }: { id: string; utr?: string }) => api.submitPlanPayment(id, utr),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plan-payments'] }),
  });
}

export function useConfirmPlanPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.confirmPlanPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-payments'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['advisor-assignments'] });
    },
  });
}

export function useRejectPlanPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => api.rejectPlanPayment(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plan-payments'] }),
  });
}
