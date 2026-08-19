import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/basicPlanCoupons.api';

export function useCreateBasicPlanCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (daysGranted: number) => api.createBasicPlanCoupon(daysGranted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['basic-plan-coupons'] });
    },
  });
}

export function useAllBasicPlanCoupons() {
  return useQuery({
    queryKey: ['basic-plan-coupons', 'all'],
    queryFn: api.listAllBasicPlanCoupons,
  });
}

export function useAvailableBasicPlanCoupons() {
  return useQuery({
    queryKey: ['basic-plan-coupons', 'available'],
    queryFn: api.listAvailableBasicPlanCoupons,
  });
}

export function useMyPurchasedBasicPlanCoupons() {
  return useQuery({
    queryKey: ['basic-plan-coupons', 'mine'],
    queryFn: api.listMyPurchasedBasicPlanCoupons,
  });
}

export function usePurchaseBasicPlanCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.purchaseBasicPlanCoupon(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['basic-plan-coupons'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useRedeemBasicPlanCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.redeemBasicPlanCoupon(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmerPlan'] });
    },
  });
}
