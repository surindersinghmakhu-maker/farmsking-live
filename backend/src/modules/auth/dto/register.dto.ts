import { IsIn, IsOptional, IsString, IsEnum, Matches, MinLength } from 'class-validator';
import { SoilType, WaterType } from '@prisma/client';
import { IsIndianMobile } from '../../../common/validators/is-indian-mobile.validator';

const ALLOWED_TANK_SIZES = [15, 20, 25];

export class RegisterDto {
  @IsIndianMobile()
  mobile: string;

  /** What the user chose to register as — CUSTOMER (default) just buys products; FARMER/GARDENER also get their plan + the BUSINESS_PARTNER role provisioned. */
  @IsOptional()
  @IsIn(['CUSTOMER', 'FARMER', 'GARDENER'])
  accountType?: 'CUSTOMER' | 'FARMER' | 'GARDENER';

  @IsOptional()
  @IsIn(ALLOWED_TANK_SIZES)
  sprayTankSizeL?: number;

  @IsOptional()
  @IsEnum(SoilType)
  soilType?: SoilType;

  @IsOptional()
  @IsEnum(WaterType)
  waterType?: WaterType;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  name: string;

  @Matches(/^\d{6}$/, { message: 'PIN code must be exactly 6 digits.' })
  pincode: string;

  @IsOptional()
  @IsString()
  postOffice?: string;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsIn(['en', 'hi', 'pa'])
  preferredLanguage?: string;

  /** Used later by forgot-password to verify identity before a reset. */
  @IsOptional()
  @IsString()
  securityQuestion?: string;

  @IsOptional()
  @IsString()
  securityAnswer?: string;

  /** Optional UPI ID for farmers to receive payments via QR Code on their bills. */
  @IsOptional()
  @IsString()
  upiId?: string;

  /** The referring user's King ID, typed in at signup (or arrived via a shared referral link). */
  @IsOptional()
  @IsString()
  referralCode?: string;
}
