import { DiscountValueType } from '@prisma/client';
export declare class UpdateCouponDto {
    commissionType?: DiscountValueType;
    commissionValue?: number;
    discountType?: DiscountValueType;
    discountValue?: number;
    minOrderAmount?: number;
    expiresAt?: string;
    usageLimit?: number;
    isActive?: boolean;
}
