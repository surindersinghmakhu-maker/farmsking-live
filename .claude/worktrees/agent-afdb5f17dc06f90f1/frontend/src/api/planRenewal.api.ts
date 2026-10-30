import { apiClient } from './client';
import { PlanRenewalCoupon } from '../types/api';

export interface CreatePlanRenewalCouponPayload {
  daysGranted: number;
  assignedFarmerId?: string;
  assignedAdvisorId?: string;
}

export interface RedeemPlanRenewalResponse {
  daysAdded: number;
  bonusDayApplied: boolean;
  newEndDate: string;
}

export interface PreviewPlanRenewalResponse {
  daysGranted: number;
  bonusDayApplied: boolean;
  newEndDate: string;
}

export interface GrantPlanDaysResponse {
  daysAdded: number;
  newEndDate: string;
}

export async function createPlanRenewalCoupon(payload: CreatePlanRenewalCouponPayload): Promise<PlanRenewalCoupon> {
  const { data } = await apiClient.post<PlanRenewalCoupon>('/plan-renewal-coupons', payload);
  return data;
}

export async function listAllPlanRenewalCoupons(): Promise<PlanRenewalCoupon[]> {
  const { data } = await apiClient.get<PlanRenewalCoupon[]>('/plan-renewal-coupons');
  return data;
}

export async function listMinePlanRenewalCoupons(): Promise<PlanRenewalCoupon[]> {
  const { data } = await apiClient.get<PlanRenewalCoupon[]>('/plan-renewal-coupons/mine');
  return data;
}

export async function previewPlanRenewalCoupon(code: string, farmerId?: string): Promise<PreviewPlanRenewalResponse> {
  const { data } = await apiClient.get<PreviewPlanRenewalResponse>(`/plan-renewal-coupons/${code}/preview`, {
    params: farmerId ? { farmerId } : {},
  });
  return data;
}

export async function redeemPlanRenewalCoupon(code: string, farmerId?: string): Promise<RedeemPlanRenewalResponse> {
  const { data } = await apiClient.post<RedeemPlanRenewalResponse>(`/plan-renewal-coupons/${code}/redeem`, { farmerId });
  return data;
}

export async function grantPlanDays(farmerId: string, daysGranted: number): Promise<GrantPlanDaysResponse> {
  const { data } = await apiClient.post<GrantPlanDaysResponse>('/plan-renewal-coupons/grant-days', { farmerId, daysGranted });
  return data;
}
