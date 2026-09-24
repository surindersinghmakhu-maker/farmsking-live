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
  GrantFarmerPlanDaysPayload,
  applyCouponToFarmerDirectly,
  getCouponFinancialSummary,
  getFarmerPlanPricing,
  updateFarmerPlanPricing,
  UpdateFarmerPlanPricingPayload,
  deleteFarmerPlanPricing,
  chooseAdvisor,
  getAdminDocsList,
  downloadAdminDocContent,
  getFarmerPlanHistory,
  activateTrial,
} from '../api/farmerPlans.api';


/** Plan display config */
export const PLAN_META: Record<FarmerPlanType, { label: string; emoji: string; color: string; bg: string; borderColor: string }> = {
  FREE: {
    label: 'Free Starter Plan',
    emoji: '🌱',
    color: '#166534',
    bg: '#ffffff',
    borderColor: '#86efac',
  },
  PRO: {
    label: 'PRO Plan',
    emoji: '⚡',
    color: '#0284c7',
    bg: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  SMART: {
    label: 'SMART Plan',
    emoji: '👑',
    color: '#1d4ed8',
    bg: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  SUPER: {
    label: 'SUPER Plan',
    emoji: '⭐',
    color: '#b45309',
    bg: '#fef3c7',
    borderColor: '#fde68a',
  },
  SILVER: {
    label: 'SILVER Plan',
    emoji: '🩺',
    color: '#475569',
    bg: '#f8fafc',
    borderColor: '#cbd5e1',
  },
  GOLD: {
    label: 'GOLD Plan',
    emoji: '🌾',
    color: '#d97706',
    bg: '#fffbeb',
    borderColor: '#fde68a',
  },
  ROYAL: {
    label: 'ROYAL Plan',
    emoji: '👑',
    color: '#7c3aed',
    bg: '#f5f3ff',
    borderColor: '#ddd6fe',
  },
};

export function useFarmerPlan() {
  const query = useQuery<MyFarmerPlanResponse>({
    queryKey: ['farmerPlan', 'mine'],
    queryFn: getMyFarmerPlan,
    staleTime: 10 * 1000, // 10s staleTime ensures instant plan upgrade updates
    retry: 1,
  });

  const plan = query.data?.plan ?? 'FREE';
  const meta = PLAN_META[plan];

  const hasActiveSoftwarePlan = plan !== 'FREE' && !(query.data?.isExpired ?? false);
  const canHireAdvisor = hasActiveSoftwarePlan;

  return {
    ...query,
    plan,
    meta,
    hasActiveSoftwarePlan,
    canHireAdvisor,
    hasUsedTrial: query.data?.hasUsedTrial ?? (plan !== 'FREE'),
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
      queryClient.invalidateQueries({ queryKey: ['farmerPlan'] });
      queryClient.invalidateQueries({ queryKey: ['farmerPlanHistory'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['advisor-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['farmer-plan-coupons'] });
    },
  });
}

export function useFarmerPlanHistory(farmerId?: string) {
  return useQuery({
    queryKey: ['farmerPlanHistory', farmerId ?? 'mine'],
    queryFn: () => getFarmerPlanHistory(farmerId),
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
    mutationFn: (payload: GrantFarmerPlanDaysPayload) => grantFarmerPlanDays(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmerPlan'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useApplyCouponToFarmerDirectly() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, farmerId }: { code: string; farmerId: string }) => applyCouponToFarmerDirectly(code, farmerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmerPlan'] });
      queryClient.invalidateQueries({ queryKey: ['farmer-plan-coupons'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
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

export function useDeleteFarmerPlanPricing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFarmerPlanPricing(id),
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

export function useCouponFinancialSummary() {
  return useQuery({ queryKey: ['farmer-plan-coupons', 'financial-summary'], queryFn: getCouponFinancialSummary });
}

export function useAdminDocsList() {
  return useQuery({ queryKey: ['admin-docs-list'], queryFn: getAdminDocsList });
}

export function useDownloadAdminDoc() {
  return useMutation({
    mutationFn: ({ docKey, lang }: { docKey: string; lang?: string }) => downloadAdminDocContent(docKey, lang || 'pa'),
  });
}

export function useActivateTrial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: activateTrial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmerPlan'] });
      queryClient.invalidateQueries({ queryKey: ['farmerPlanHistory'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}




