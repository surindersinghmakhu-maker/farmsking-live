import { IsBoolean, IsEmail, IsOptional, IsString, Matches } from 'class-validator';
import { IsIndianMobile } from '../../../common/validators/is-indian-mobile.validator';

/** Agent self-service: payout details required before their wallet can be withdrawn from. */
export class UpdatePartnerProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIndianMobile()
  alternativeMobile?: string;

  @IsOptional()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/, { message: 'PAN must be a valid 10-character PAN (e.g. ABCDE1234F).' })
  panNumber?: string;

  @IsOptional()
  @Matches(/^[\w.\-]+@[\w.\-]+$/, { message: 'Enter a valid UPI ID (e.g. name@bank).' })
  upiId?: string;

  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @IsOptional()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Enter a valid 11-character IFSC code.' })
  bankIfsc?: string;

  @IsOptional()
  @IsString()
  bankAccountHolderName?: string;

  @IsOptional()
  @Matches(/^\d{4}$/, { message: 'Aadhaar last 4 digits must be numeric.' })
  aadhaarLast4?: string;

  @IsOptional()
  @IsString()
  aadhaarDocUrl?: string;

  @IsOptional()
  @IsString()
  panDocUrl?: string;

  @IsOptional()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, { message: 'Enter a valid 15-character GSTIN.' })
  gstin?: string;

  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;
}
