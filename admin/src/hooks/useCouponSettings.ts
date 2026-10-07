import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/couponSettings.api';

export function useCouponSettings() {
  return useQuery({
    queryKey: ['coupon-settings'],
    queryFn: api.getCouponSettings,
  });
}

export function useUpdateCouponSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.UpdateCouponSettingsPayload) => api.updateCouponSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupon-settings'] });
    },
  });
}
