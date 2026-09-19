import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { FarmerSubscriptionPlan, PlanCouponCategory } from '@prisma/client';

export class GenerateAdvisorCouponDto {
  @IsOptional()
  @IsEnum(PlanCouponCategory)
  category?: PlanCouponCategory;

  @IsEnum(FarmerSubscriptionPlan)
  plan: FarmerSubscriptionPlan;

  @IsInt()
  @Min(1)
  daysGranted: number;

  /** Doctor Consultation Fee set by doctor for this coupon (e.g. 500) */
  @IsOptional()
  @IsNumber()
  @Min(0)
  doctorFeeAmount?: number;

  /** Whether doctor chose to include an App Membership alongside consultation */
  @IsOptional()
  @IsBoolean()
  includeMembership?: boolean;

  /** Included App Membership tier (e.g. PRO or SMART) */
  @IsOptional()
  @IsEnum(FarmerSubscriptionPlan)
  includedMembershipPlan?: FarmerSubscriptionPlan;

  /** Included App Membership duration in days (e.g. 365 or 30) */
  @IsOptional()
  @IsInt()
  @Min(1)
  includedMembershipDays?: number;

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
