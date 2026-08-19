import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';
import { CouponKind, DiscountValueType } from '@prisma/client';

export class CreateCouponDto {
  @IsUUID()
  businessPartnerId: string;

  @IsOptional()
  @IsIn([CouponKind.GENERIC, CouponKind.PERSONAL_INVITE])
  kind?: 'GENERIC' | 'PERSONAL_INVITE';

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9]{4,20}$/, { message: 'Code must be 4-20 uppercase letters/numbers.' })
  code?: string;

  @IsIn(['PERCENTAGE', 'FIXED'])
  commissionType: DiscountValueType;

  @IsNumber()
  @Min(0)
  commissionValue: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionMaxCap?: number;

  @IsIn(['PERCENTAGE', 'FIXED'])
  discountType: DiscountValueType;

  @IsNumber()
  @Min(0)
  discountValue: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountMaxCap?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @IsDateString()
  expiresAt: string;

  @IsInt()
  @Min(1)
  usageLimit: number;
}
