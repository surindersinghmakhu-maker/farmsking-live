import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { HiringModelType } from '@prisma/client';

export class CreateAdvisorPlanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(HiringModelType)
  hiringModel: HiringModelType;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  billingCycle?: string;

  @IsOptional()
  @IsNumber()
  @Min(-1)
  callRequestLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(-1)
  inAppCallLimit?: number;

  @IsOptional()
  @IsBoolean()
  videoCallAllowed?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  videoCallLimit?: number;

  @IsOptional()
  @IsBoolean()
  chatEnabled?: boolean;
}
