import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { DiscountValueType } from '@prisma/client';

export class UpdateFarmerPlanPricingDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  billingPeriodDays?: number;

  @IsOptional()
  @IsEnum(DiscountValueType)
  partnerShareType?: DiscountValueType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  partnerShareValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  advisorShareValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  adminShareValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  partnerGenerationCostPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  advisorGenerationCostPercent?: number;
}
