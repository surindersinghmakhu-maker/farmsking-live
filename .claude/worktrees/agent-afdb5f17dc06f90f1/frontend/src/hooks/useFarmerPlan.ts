import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMyFarmerPlan,
  MyFarmerPlanResponse,
  FarmerPlanType,
  previewFarmerPlanCoupon,
  redeemFarmerPlanCoupon,
} from '../api/farmerPlans.api';

/** Plan display config */
export const PLAN_META: Record<FarmerPlanType, { label: string; emoji: string; color: string; bg: string; borderColor: string }> = {
  FREE: {
    label: 'Free Plan',
    emoji: '🌱',
    color: '#166534',
    bg: '#ffffff',
    borderColor: '#86efac',
  },
  BASIC: {
    label: 'Basic Plan',
    emoji: '⭐',
    color: '#92400e',
    bg: '#fef3c7',
    borderColor: '#fcd34d',
  },
  PREMIUM: {
    label: 'Premium Plan',
    emoji: '👑',
    color: '#4c1d95',
    bg: '#ede9fe',
    borderColor: '#c4b5fd',
  },
};

export function useFarmerPlan() {
  const query = useQuery<MyFarmerPlanResponse>({
    queryKey: ['farmerPlan', 'mine'],
    queryFn: getMyFarmerPlan,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });

  const plan = query.data?.plan ?? 'FREE';
  const meta = PLAN_META[plan];

  return {
    ...query,
    plan,
    meta,
    endDate: query.data?.endDate ?? null,
    isExpired: query.data?.isExpired ?? false,
    inGrace: query.data?.inGrace ?? false,
    expiringSoon: query.data?.expiringSoon ?? false,
    daysUntilExpiry: query.data?.daysUntilExpiry ?? null,
    limits: query.data?.limits,
  };
}

export function usePreviewFarmerPlanCoupon() {
  return useMutation({ mutationFn: (code: string) => previewFarmerPlanCoupon(code) });
}

export function useRedeemFarmerPlanCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => redeemFarmerPlanCoupon(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmerPlan', 'mine'] });
    },
  });
}
