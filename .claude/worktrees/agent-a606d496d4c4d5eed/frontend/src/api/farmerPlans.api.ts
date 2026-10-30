import { apiClient } from './client';

export type FarmerPlanType = 'FREE' | 'BASIC' | 'PREMIUM';

export interface MyFarmerPlanResponse {
  farmerId: string;
  plan: FarmerPlanType;
  endDate: string | null;
  isExpired: boolean;
  inGrace: boolean;
  expiringSoon: boolean;
  daysUntilExpiry: number | null;
  limits: {
    maxTotalCrops: number | null;
    maxActiveCrops: number | null;
    fullCompletedCropDetails: boolean;
    advisorIncluded: boolean;
  };
}

export interface FarmerPlanCouponPreview {
  code: string;
  plan: FarmerPlanType;
  daysGranted: number;
  currentPlan: FarmerPlanType;
  newEndDate: string;
  extendsExisting: boolean;
}

export interface FarmerPlanCouponRedeemResult {
  plan: { plan: FarmerPlanType; endDate: string | null };
  daysGranted: number;
  newEndDate: string;
  extended: boolean;
}

export async function getMyFarmerPlan(): Promise<MyFarmerPlanResponse> {
  const { data } = await apiClient.get<MyFarmerPlanResponse>('/farmer-plans/my-plan');
  return data;
}

export async function previewFarmerPlanCoupon(code: string): Promise<FarmerPlanCouponPreview> {
  const { data } = await apiClient.get<FarmerPlanCouponPreview>(`/farmer-plans/coupon/${code}/preview`);
  return data;
}

export async function redeemFarmerPlanCoupon(code: string): Promise<FarmerPlanCouponRedeemResult> {
  const { data } = await apiClient.post<FarmerPlanCouponRedeemResult>('/farmer-plans/redeem', { code });
  return data;
}
