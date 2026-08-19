import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMyFarmerPlan,
  MyFarmerPlanResponse,
  FarmerPlanType,
  previewFarmerPlanCoupon,
  redeemFarmerPlanCoupon,
  createFarmerPlanCoupon,
  listAllFarmerPlanCoupons,
  deactivateFarmerPlanCoupon,
  listMineFarmerPlanCoupons,
  listMinePartnerFarmerPlanCoupons,
  CreateFarmerPlanCouponPayload,
  generateOwnFarmerPlanCoupon,
  GenerateAdvisorCouponPayload,
  grantFarmerPlanDays,
  getFarmerPlanPricing,
  updateFarmerPlanPricing,
  UpdateFarmerPlanPricingPayload,
  chooseAdvisor,
} from '../api/farmerPlans.api';

/** Plan display config */
export const PLAN_META: Record<FarmerPlanType, { label: string; emoji: string; color: string; bg: string; borderColor: string }> = {
  FREE: {
    label: 'Free User',
    emoji: '🌱',
    color: '#166534',
    bg: '#ffffff',
    borderColor: '#86efac',
  },
  BASIC: {
    label: 'Basic User',
    emoji: '⭐',
    color: '#92400e',
    bg: '#fef3c7',
    borderColor: '#fcd34d',
  },
  STANDARD: {
    label: 'Standard User',
    emoji: '🚀',
    color: '#1d4ed8',
    bg: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  PREMIUM: {
    label: 'Premium User',
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
    startDate: query.data?.startDate ?? null,
    endDate: query.data?.endDate ?? null,
    isExpired: query.data?.isExpired ?? false,
    inGrace: query.data?.inGrace ?? false,
    expiringSoon: query.data?.expiringSoon ?? false,
    daysUntilExpiry: query.data?.daysUntilExpiry ?? null,
    limits: query.data?.limits,
  };
}

export function usePreviewFarmerPlanCoupon() {
  return useMutation({
    mutationFn: ({ code, farmerId }: { code: string; farmerId?: string }) => previewFarmerPlanCoupon(code, farmerId),
  });
}

export function useRedeemFarmerPlanCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, farmerId, advisorId }: { code: string; farmerId?: string; advisorId?: string }) =>
      redeemFarmerPlanCoupon(code, farmerId, advisorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmerPlan', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['advisor-assignments'] });
    },
  });
}

export function useAllFarmerPlanCoupons() {
  return useQuery({ queryKey: ['farmer-plan-coupons', 'all'], queryFn: listAllFarmerPlanCoupons });
}

export function useDeactivateFarmerPlanCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateFarmerPlanCoupon(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farmer-plan-coupons'] }),
  });
}

export function useMineFarmerPlanCoupons() {
  return useQuery({ queryKey: ['farmer-plan-coupons', 'mine'], queryFn: listMineFarmerPlanCoupons });
}

export function useCreateFarmerPlanCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFarmerPlanCouponPayload) => createFarmerPlanCoupon(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farmer-plan-coupons'] }),
  });
}

export function useGenerateOwnFarmerPlanCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GenerateAdvisorCouponPayload) => generateOwnFarmerPlanCoupon(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmer-plan-coupons'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useGrantFarmerPlanDays() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ farmerId, daysGranted }: { farmerId: string; daysGranted: number }) => grantFarmerPlanDays(farmerId, daysGranted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmerPlan'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

/** Business Partner's own wallet of plan coupons issued to them, to hand out to farmers — earns a commission on redemption. */
export function useMinePartnerFarmerPlanCoupons() {
  return useQuery({ queryKey: ['farmer-plan-coupons', 'mine-partner'], queryFn: listMinePartnerFarmerPlanCoupons });
}

export function useFarmerPlanPricing() {
  return useQuery({ queryKey: ['farmer-plan-pricing'], queryFn: getFarmerPlanPricing });
}

export function useUpdateFarmerPlanPricing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ plan, payload }: { plan: string; payload: UpdateFarmerPlanPricingPayload }) => updateFarmerPlanPricing(plan, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farmer-plan-pricing'] }),
  });
}

/** Farmer on STANDARD/PREMIUM: pick a specific Farm Advisor instead of the auto-assigned one. */
export function useChooseAdvisor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (advisorId: string) => chooseAdvisor(advisorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisor-assignments', 'my-advisor'] });
      queryClient.invalidateQueries({ queryKey: ['advisor-assignments', 'available'] });
      queryClient.invalidateQueries({ queryKey: ['advisor-assignments', 'my-pending-request'] });
    },
  });
}
