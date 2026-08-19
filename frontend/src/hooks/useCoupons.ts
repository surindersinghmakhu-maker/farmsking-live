import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/coupons.api';

export function useAllCoupons() {
  return useQuery({ queryKey: ['coupons', 'all'], queryFn: api.listAllCoupons });
}

export function useMyCoupons() {
  return useQuery({ queryKey: ['coupons', 'mine'], queryFn: api.listMyCoupons });
}

export function useCouponRedemptions(id: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ['coupons', id, 'redemptions'],
    queryFn: () => api.getCouponRedemptions(id as string),
    enabled: !!id && enabled,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createCoupon,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: api.UpdateCouponPayload }) => api.updateCoupon(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  });
}

export function useRemoveCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.removeCoupon,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  });
}

export function useCouponPreview() {
  return useMutation({
    mutationFn: ({ code, amount }: { code: string; amount: number }) => api.previewCoupon(code, amount),
  });
}

export function useIssuePartnerCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (businessPartnerId?: string) => api.issuePartnerCoupon(businessPartnerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  });
}
