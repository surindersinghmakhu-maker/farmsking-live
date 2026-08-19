import { IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { DiscountValueType } from '@prisma/client';

export class UpdateCouponDto {
  @IsOptional()
  @IsIn(['PERCENTAGE', 'FIXED'])
  commissionType?: DiscountValueType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionValue?: number;

  @IsOptional()
  @IsIn(['PERCENTAGE', 'FIXED'])
  discountType?: DiscountValueType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
