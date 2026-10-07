import { apiClient } from './client';

export interface BasicPlanCoupon {
  id: string;
  code: string;
  daysGranted: number;
  listPrice: number;
  createdById: string;
  createdBy?: { id: string; name: string; kingId: string | null };
  purchasedById: string | null;
  purchasedBy?: { id: string; name: string; kingId: string | null } | null;
  purchasePrice: number | null;
  purchasedAt: string | null;
  isUsed: boolean;
  usedByFarmerId: string | null;
  usedByFarmer?: { id: string; name: string; kingId: string | null } | null;
  usedAt: string | null;
  createdAt: string;
}

export async function createBasicPlanCoupon(daysGranted: number): Promise<BasicPlanCoupon> {
  const { data } = await apiClient.post<BasicPlanCoupon>('/basic-plan-coupons', { daysGranted });
  return data;
}

export async function listAllBasicPlanCoupons(): Promise<BasicPlanCoupon[]> {
  const { data } = await apiClient.get<BasicPlanCoupon[]>('/basic-plan-coupons');
  return data;
}

export async function listAvailableBasicPlanCoupons(): Promise<BasicPlanCoupon[]> {
  const { data } = await apiClient.get<BasicPlanCoupon[]>('/basic-plan-coupons/available');
  return data;
}

export async function listMyPurchasedBasicPlanCoupons(): Promise<BasicPlanCoupon[]> {
  const { data } = await apiClient.get<BasicPlanCoupon[]>('/basic-plan-coupons/mine');
  return data;
}

export async function purchaseBasicPlanCoupon(code: string): Promise<BasicPlanCoupon> {
  const { data } = await apiClient.post<BasicPlanCoupon>(`/basic-plan-coupons/${code}/purchase`, {});
  return data;
}

export async function redeemBasicPlanCoupon(code: string): Promise<{ plan: { plan: string; endDate: string }; daysAdded: number; newEndDate: string }> {
  const { data } = await apiClient.post(`/basic-plan-coupons/${code}/redeem`, {});
  return data;
}
