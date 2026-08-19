import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/farmerPlanPayments.api';
import type { FarmerPlanType } from '../api/farmerPlans.api';

export function useMineFarmerPlanPayments() {
  return useQuery({ queryKey: ['farmer-plan-payments', 'mine'], queryFn: api.listMineFarmerPlanPayments });
}

export function usePendingFarmerPlanPayments() {
  return useQuery({ queryKey: ['farmer-plan-payments', 'pending'], queryFn: api.listPendingFarmerPlanPayments });
}

export function useInitiateFarmerPlanPayment() {
  return useMutation({
    mutationFn: ({ targetPlan, farmerId }: { targetPlan: FarmerPlanType; farmerId?: string }) =>
      api.initiateFarmerPlanPayment(targetPlan, farmerId),
  });
}

export function useSubmitFarmerPlanPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, utr }: { id: string; utr?: string }) => api.submitFarmerPlanPayment(id, utr),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farmer-plan-payments'] }),
  });
}

export function useConfirmFarmerPlanPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.confirmFarmerPlanPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmer-plan-payments'] });
      queryClient.invalidateQueries({ queryKey: ['farmerPlan'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['advisor-assignments'] });
    },
  });
}

export function useRejectFarmerPlanPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => api.rejectFarmerPlanPayment(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farmer-plan-payments'] }),
  });
}
