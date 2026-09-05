import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { FarmerSubscriptionPlan } from '@prisma/client';

export class InitiateFarmerPlanPaymentDto {
  @IsEnum(FarmerSubscriptionPlan)
  targetPlan: FarmerSubscriptionPlan;

  @IsOptional()
  @IsInt()
  @Min(1)
  billingPeriodDays?: number;
}

