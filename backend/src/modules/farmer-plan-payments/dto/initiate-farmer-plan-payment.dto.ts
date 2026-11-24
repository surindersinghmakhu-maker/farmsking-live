import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { FarmerSubscriptionPlan } from '@prisma/client';

export class InitiateFarmerPlanPaymentDto {
  @IsEnum(FarmerSubscriptionPlan)
  targetPlan: FarmerSubscriptionPlan;

  @IsOptional()
  @IsInt()
  @Min(1)
  billingPeriodDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  customAmount?: number;

  @IsOptional()
  @IsBoolean()
  isAutoDebit?: boolean;

  @IsOptional()
  @IsString()
  preferredGateway?: 'CASHFREE' | 'RAZORPAY' | 'PHONEPE' | 'UPI_DIRECT';

  @IsOptional()
  selectedDoctorId?: string;

  @IsOptional()
  selectedAdvisorId?: string;

  @IsOptional()
  doctorKingId?: string;

  @IsOptional()
  advisorKingId?: string;

  @IsOptional()
  @IsString()
  cropCycleId?: string;

  @IsOptional()
  @IsBoolean()
  useWalletPoints?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  pointsToDeduct?: number;
}
