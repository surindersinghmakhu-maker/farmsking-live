import { IsIn, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { IsIndianMobile } from '../../../common/validators/is-indian-mobile.validator';

export class RegisterDto {
  @IsIndianMobile()
  mobile: string;

  /** What the user chose to register as — CUSTOMER (default) just buys products; FARMER/GARDENER also get their plan + the BUSINESS_PARTNER role provisioned. */
  @IsOptional()
  @IsIn(['CUSTOMER', 'FARMER', 'GARDENER'])
  accountType?: 'CUSTOMER' | 'FARMER' | 'GARDENER';

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

  /** The referring user's King ID, typed in at signup (or arrived via a shared referral link). */
  @IsOptional()
  @IsString()
  referralCode?: string;
}
