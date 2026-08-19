import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateCouponSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  partnerCouponDiscountPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  partnerCouponCommissionPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  partnerCouponMinOrderAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  partnerCouponMaxDiscountCap?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  partnerCouponValidityDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  referralCommissionPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  referralDiscountPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  referralMaxDiscountCap?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  referralOrderLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  referralCouponValidityDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionCouponDiscountPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionCouponCommissionPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionCouponMinOrderAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionCouponMaxDiscountCap?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  commissionCouponValidityDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  inviteCouponDiscountPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  inviteCouponCommissionPercent?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  inviteCouponValidityDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  inviteCouponUsageLimit?: number;
}
