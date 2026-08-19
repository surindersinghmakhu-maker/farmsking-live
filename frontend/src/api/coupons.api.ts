import { apiClient } from './client';
import { Coupon, CouponRedemption, DiscountValueType } from '../types/api';

export interface CreateCouponPayload {
  businessPartnerId: string;
  kind?: 'GENERIC' | 'PERSONAL_INVITE';
  code?: string;
  commissionType: DiscountValueType;
  commissionValue: number;
  commissionMaxCap?: number;
  discountType: DiscountValueType;
  discountValue: number;
  discountMaxCap?: number;
  minOrderAmount?: number;
  expiresAt: string;
  usageLimit: number;
}

export interface CouponPreview {
  discountAmount: string;
  commissionAmount: string;
  finalAmount: string;
}

export type UpdateCouponPayload = Partial<Omit<CreateCouponPayload, 'businessPartnerId'>> & { isActive?: boolean };

export async function createCoupon(payload: CreateCouponPayload): Promise<Coupon> {
  const { data } = await apiClient.post<Coupon>('/coupons', payload);
  return data;
}

export async function listAllCoupons(): Promise<Coupon[]> {
  const { data } = await apiClient.get<Coupon[]>('/coupons');
  return data;
}

export async function listMyCoupons(): Promise<Coupon[]> {
  const { data } = await apiClient.get<Coupon[]>('/coupons/mine');
  return data;
}

export async function updateCoupon(id: string, payload: UpdateCouponPayload): Promise<Coupon> {
  const { data } = await apiClient.patch<Coupon>(`/coupons/${id}`, payload);
  return data;
}

export async function removeCoupon(id: string): Promise<Coupon> {
  const { data } = await apiClient.patch<Coupon>(`/coupons/${id}/remove`);
  return data;
}

export async function getCouponRedemptions(id: string): Promise<CouponRedemption[]> {
  const { data } = await apiClient.get<CouponRedemption[]>(`/coupons/${id}/redemptions`);
  return data;
}

export async function previewCoupon(code: string, amount: number): Promise<CouponPreview> {
  const { data } = await apiClient.get<CouponPreview>(`/coupons/${encodeURIComponent(code)}/preview`, { params: { amount } });
  return data;
}

export interface IssuePartnerCouponResult {
  issuedCount: number;
  coupons: Coupon[];
}

/** Issues a fresh Business-Partner-tier referral coupon (uses current AppSetting defaults) to one selected partner, or omit businessPartnerId to issue to every active partner. */
export async function issuePartnerCoupon(businessPartnerId?: string): Promise<IssuePartnerCouponResult> {
  const { data } = await apiClient.post<IssuePartnerCouponResult>('/coupons/issue-partner-coupon', { businessPartnerId });
  return data;
}
