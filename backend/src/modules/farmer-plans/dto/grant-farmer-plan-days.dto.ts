import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { FarmerSubscriptionPlan } from '@prisma/client';

export class GrantFarmerPlanDaysDto {
  @IsUUID()
  farmerId: string;

  @IsInt()
  @Min(1)
  daysGranted: number;

  /** Optional: Admin can select a specific plan tier (e.g. PRO, SMART, SUPER) */
  @IsOptional()
  @IsEnum(FarmerSubscriptionPlan)
  plan?: FarmerSubscriptionPlan;

  /** Optional: Admin can select an Advisor when activating plan for the farmer */
  @IsOptional()
  @IsUUID()
  advisorId?: string;
}
