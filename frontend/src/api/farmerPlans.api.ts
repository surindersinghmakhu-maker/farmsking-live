import { apiClient } from './client';

export type FarmerPlanType = 'FREE' | 'BASIC' | 'STANDARD' | 'PREMIUM';

export interface MyFarmerPlanResponse {
  farmerId: string;
  plan: FarmerPlanType;
  startDate: string | null;
  endDate: string | null;
  isExpired: boolean;
  inGrace: boolean;
  expiringSoon: boolean;
  daysUntilExpiry: number | null;
  limits: {
    maxTotalCrops: number | null;
    maxActiveCrops: number | null;
    maxAdvisorCrops: number | null;
    fullCompletedCropDetails: boolean;
    advisorIncluded: boolean;
  };
}

export interface FarmerPlanCouponPreview {
  code: string;
  plan: FarmerPlanType;
  /** The plan the farmer will actually be on after redemption — same as `plan` unless they already
   * have a higher tier active, in which case the current (higher) tier is kept and the coupon's days
   * are just added on top of it instead of downgrading them. */
  resultPlan: FarmerPlanType;
  daysGranted: number;
  currentPlan: FarmerPlanType;
  newEndDate: string;
  extendsExisting: boolean;
  includesAdvisor: boolean;
}

export interface FarmerPlanCouponRedeemResult {
  plan: { plan: FarmerPlanType; endDate: string | null };
  daysGranted: number;
  newEndDate: string;
  extended: boolean;
  advisorHired: boolean;
  /** True if this coupon's tier was lower than the farmer's already-active plan — their current (higher) plan was kept and only extended by the coupon's days. */
  keptHigherPlan: boolean;
}

export interface FarmerPlanCoupon {
  id: string;
  code: string;
  plan: FarmerPlanType;
  daysGranted: number;
  assignedFarmerId: string | null;
  assignedFarmer?: { id: string; name: string; mobile: string } | null;
  assignedAdvisorId: string | null;
  assignedAdvisor?: { id: string; name: string; mobile: string } | null;
  assignedBusinessPartnerId: string | null;
  assignedBusinessPartner?: { id: string; name: string; mobile: string } | null;
  isUsed: boolean;
  usedAt: string | null;
  expiresAt: string | null;
  generationCostAmount: string | null;
  createdAt: string;
  createdById: string;
  createdBy?: { id: string; name: string } | null;
}

export interface CreateFarmerPlanCouponPayload {
  plan: 'BASIC' | 'STANDARD' | 'PREMIUM';
  daysGranted: number;
  quantity?: number;
  assignedFarmerId?: string;
  assignedAdvisorId?: string;
  assignedBusinessPartnerId?: string;
  expiresAt?: string;
}

export interface FarmerPlanPricing {
  id: string;
  plan: FarmerPlanType;
  price: string;
  billingPeriodDays: number;
  partnerShareType: 'PERCENTAGE' | 'FIXED';
  partnerShareValue: string;
  advisorShareValue: string | null;
  adminShareValue: string | null;
  partnerGenerationCostPercent: string | null;
  advisorGenerationCostPercent: string | null;
  updatedAt: string;
}

export interface UpdateFarmerPlanPricingPayload {
  price?: number;
  billingPeriodDays?: number;
  partnerShareType?: 'PERCENTAGE' | 'FIXED';
  partnerShareValue?: number;
  advisorShareValue?: number;
  adminShareValue?: number;
  partnerGenerationCostPercent?: number;
  advisorGenerationCostPercent?: number;
}

export async function getMyFarmerPlan(): Promise<MyFarmerPlanResponse> {
  const { data } = await apiClient.get<MyFarmerPlanResponse>('/farmer-plans/my-plan');
  return data;
}

export async function previewFarmerPlanCoupon(code: string, farmerId?: string): Promise<FarmerPlanCouponPreview> {
  const { data } = await apiClient.get<FarmerPlanCouponPreview>(`/farmer-plans/coupon/${code}/preview`, {
    params: farmerId ? { farmerId } : {},
  });
  return data;
}

export async function redeemFarmerPlanCoupon(code: string, farmerId?: string, advisorId?: string): Promise<FarmerPlanCouponRedeemResult> {
  const { data } = await apiClient.post<FarmerPlanCouponRedeemResult>('/farmer-plans/redeem', { code, farmerId, advisorId });
  return data;
}

export async function createFarmerPlanCoupon(payload: CreateFarmerPlanCouponPayload): Promise<FarmerPlanCoupon[]> {
  const { data } = await apiClient.post<FarmerPlanCoupon[]>('/farmer-plans/coupons', payload);
  return data;
}

export async function listAllFarmerPlanCoupons(): Promise<FarmerPlanCoupon[]> {
  const { data } = await apiClient.get<FarmerPlanCoupon[]>('/farmer-plans/coupons');
  return data;
}

/** Super Admin: deactivate an unused coupon so it can no longer be redeemed — never deleted, stays in history. */
export async function deactivateFarmerPlanCoupon(id: string): Promise<FarmerPlanCoupon> {
  const { data } = await apiClient.patch<FarmerPlanCoupon>(`/farmer-plans/coupons/${id}/deactivate`);
  return data;
}

export async function listMineFarmerPlanCoupons(): Promise<FarmerPlanCoupon[]> {
  const { data } = await apiClient.get<FarmerPlanCoupon[]>('/farmer-plans/coupons/mine');
  return data;
}

export interface GenerateAdvisorCouponPayload {
  plan: 'BASIC' | 'STANDARD' | 'PREMIUM';
  daysGranted: number;
  assignedFarmerId?: string;
  assignedBusinessPartnerId?: string;
}

/** Advisor self-service: generates their own plan coupon — the Super-Admin-configured generation cost is debited from their wallet. */
export async function generateOwnFarmerPlanCoupon(payload: GenerateAdvisorCouponPayload): Promise<FarmerPlanCoupon> {
  const { data } = await apiClient.post<FarmerPlanCoupon>('/farmer-plans/coupons/generate', payload);
  return data;
}

export interface GrantFarmerPlanDaysResult {
  plan: { plan: FarmerPlanType; endDate: string | null };
  daysAdded: number;
  newEndDate: string;
  advisorHired: boolean;
}

export async function grantFarmerPlanDays(farmerId: string, daysGranted: number): Promise<GrantFarmerPlanDaysResult> {
  const { data } = await apiClient.post<GrantFarmerPlanDaysResult>('/farmer-plans/grant-days', { farmerId, daysGranted });
  return data;
}

export async function listMinePartnerFarmerPlanCoupons(): Promise<FarmerPlanCoupon[]> {
  const { data } = await apiClient.get<FarmerPlanCoupon[]>('/farmer-plans/coupons/mine-partner');
  return data;
}

export async function getFarmerPlanPricing(): Promise<FarmerPlanPricing[]> {
  const { data } = await apiClient.get<FarmerPlanPricing[]>('/farmer-plans/pricing');
  return data;
}

export async function updateFarmerPlanPricing(plan: string, payload: UpdateFarmerPlanPricingPayload): Promise<FarmerPlanPricing> {
  const { data } = await apiClient.patch<FarmerPlanPricing>(`/farmer-plans/pricing/${plan}`, payload);
  return data;
}

/** Farmer on STANDARD/PREMIUM: pick a specific Farm Advisor instead of the auto-assigned one. */
export async function chooseAdvisor(advisorId: string) {
  const { data } = await apiClient.post('/farmer-plans/choose-advisor', { advisorId });
  return data;
}
