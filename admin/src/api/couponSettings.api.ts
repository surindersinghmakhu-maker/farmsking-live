import { apiClient } from './client';

export interface CouponSettings {
  id: string;
  partnerCouponDiscountPercent: string;
  partnerCouponCommissionPercent: string;
  partnerCouponMinOrderAmount: string;
  partnerCouponMaxDiscountCap: string;
  partnerCouponValidityDays: number;
  referralCommissionPercent: string;
  referralDiscountPercent: string;
  referralMaxDiscountCap: string;
  referralOrderLimit: number;
  referralCouponValidityDays: number;
  commissionCouponDiscountPercent: string;
  commissionCouponCommissionPercent: string;
  commissionCouponMinOrderAmount: string;
  commissionCouponMaxDiscountCap: string;
  commissionCouponValidityDays: number;
  inviteCouponDiscountPercent: string;
  inviteCouponCommissionPercent: string;
  inviteCouponValidityDays: number;
  inviteCouponUsageLimit: number;
  updatedAt: string;
  updatedById: string | null;
}

export interface UpdateCouponSettingsPayload {
  partnerCouponDiscountPercent?: number;
  partnerCouponCommissionPercent?: number;
  partnerCouponMinOrderAmount?: number;
  partnerCouponMaxDiscountCap?: number;
  partnerCouponValidityDays?: number;
  referralCommissionPercent?: number;
  referralDiscountPercent?: number;
  referralMaxDiscountCap?: number;
  referralOrderLimit?: number;
  referralCouponValidityDays?: number;
  commissionCouponDiscountPercent?: number;
  commissionCouponCommissionPercent?: number;
  commissionCouponMinOrderAmount?: number;
  commissionCouponMaxDiscountCap?: number;
  commissionCouponValidityDays?: number;
  inviteCouponDiscountPercent?: number;
  inviteCouponCommissionPercent?: number;
  inviteCouponValidityDays?: number;
  inviteCouponUsageLimit?: number;
}

export async function getCouponSettings(): Promise<CouponSettings> {
  const { data } = await apiClient.get<CouponSettings>('/coupon-settings');
  return data;
}

export async function updateCouponSettings(payload: UpdateCouponSettingsPayload): Promise<CouponSettings> {
  const { data } = await apiClient.patch<CouponSettings>('/coupon-settings', payload);
  return data;
}
