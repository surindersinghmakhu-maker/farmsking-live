import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { FarmerSubscriptionPlan } from '@prisma/client';

export class GenerateAdvisorCouponDto {
  @IsEnum(FarmerSubscriptionPlan)
  plan: FarmerSubscriptionPlan;

  @IsInt()
  @Min(1)
  daysGranted: number;

  /** Optional: lock the coupon to one of this advisor's currently/previously assigned farmers. */
  @IsOptional()
  @IsUUID()
  assignedFarmerId?: string;

  /** Optional: share the coupon with a Business Partner instead — mutually exclusive with assignedFarmerId. */
  @IsOptional()
  @IsUUID()
  assignedBusinessPartnerId?: string;

  /** How many coupons to generate at once (default 1) */
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}
