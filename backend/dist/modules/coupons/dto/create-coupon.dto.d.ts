import { DiscountValueType } from '@prisma/client';
export declare class CreateCouponDto {
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
