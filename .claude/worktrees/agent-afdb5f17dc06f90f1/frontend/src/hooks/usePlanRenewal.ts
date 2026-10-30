import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/planRenewal.api';

export function useAllPlanRenewalCoupons() {
  return useQuery({ queryKey: ['plan-renewal-coupons', 'all'], queryFn: api.listAllPlanRenewalCoupons });
}

export function useMinePlanRenewalCoupons() {
  return useQuery({ queryKey: ['plan-renewal-coupons', 'mine'], queryFn: api.listMinePlanRenewalCoupons });
}

export function useCreatePlanRenewalCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createPlanRenewalCoupon,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plan-renewal-coupons'] }),
  });
}

export function usePreviewPlanRenewalCoupon() {
  return useMutation({
    mutationFn: ({ code, farmerId }: { code: string; farmerId?: string }) => api.previewPlanRenewalCoupon(code, farmerId),
  });
}

export function useRedeemPlanRenewalCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, farmerId }: { code: string; farmerId?: string }) => api.redeemPlanRenewalCoupon(code, farmerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['advisor-assignments'] });
    },
  });
}

export function useGrantPlanDays() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ farmerId, daysGranted }: { farmerId: string; daysGranted: number }) => api.grantPlanDays(farmerId, daysGranted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['advisor-assignments'] });
    },
  });
}
