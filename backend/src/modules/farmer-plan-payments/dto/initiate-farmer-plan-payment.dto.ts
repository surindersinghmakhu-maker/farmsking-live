import { IsIn } from 'class-validator';
import { FarmerSubscriptionPlan } from '@prisma/client';

export class InitiateFarmerPlanPaymentDto {
  @IsIn(['BASIC', 'STANDARD', 'PREMIUM'])
  targetPlan: FarmerSubscriptionPlan;
}
