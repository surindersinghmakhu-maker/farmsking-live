import { IsEnum, IsInt, IsISO8601, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { FarmerSubscriptionPlan, PlanCouponCategory } from '@prisma/client';

export class CreateFarmerPlanCouponDto {
  @IsEnum(FarmerSubscriptionPlan)
  plan: FarmerSubscriptionPlan;

  /** Optional: FARMER_PLAN or ADVISOR_PLAN (defaults to FARMER_PLAN) */
  @IsOptional()
  @IsEnum(PlanCouponCategory)
  category?: PlanCouponCategory;

  @IsInt()
  @Min(1)
  daysGranted: number;

  /** How many coupons to issue in this one action — each gets its own unique code. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  quantity?: number;

  /** Optional: lock coupon to a specific farmer */
  @IsOptional()
  @IsUUID()
  assignedFarmerId?: string;

  /** Optional: issue to an advisor instead — they can apply it to any of their assigned farmers */
  @IsOptional()
  @IsUUID()
  assignedAdvisorId?: string;

  /** Optional: issue to a business partner instead — they earn a commission when it's redeemed */
  @IsOptional()
  @IsUUID()
  assignedBusinessPartnerId?: string;

  /** Optional: coupon itself expires on this date (ISO string) */
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}
