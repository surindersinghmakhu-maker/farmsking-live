import { IsBoolean, IsEmail, IsEnum, IsIn, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';
import { AdvisorType, SoilType, WaterType } from '@prisma/client';
import { IsIndianMobile } from '../../../common/validators/is-indian-mobile.validator';

const ALLOWED_TANK_SIZES = [15, 20, 25];

/** Super Admin/Admin full-profile edit — covers the shared fields every account has plus every role-specific field, so one form can edit any user regardless of their role. */
export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIndianMobile()
  mobile?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @Matches(/^\d{6}$/, { message: 'PIN code must be exactly 6 digits.' })
  pincode?: string;

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
  @IsBoolean()
  notificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsappGroupEnabled?: boolean;

  @IsOptional()
  @IsString()
  whatsappGroupJid?: string;

  // Advisor-only fields
  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  yearsExperience?: number;

  @IsOptional()
  @IsIn(['FARM', 'GARDEN'])
  advisorType?: AdvisorType;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsString()
  profileTitle?: string;

  // Farmer-only fields
  @IsOptional()
  @IsIn(ALLOWED_TANK_SIZES)
  sprayTankSizeL?: number;

  @IsOptional()
  @IsEnum(SoilType)
  soilType?: SoilType;

  @IsOptional()
  @IsEnum(WaterType)
  waterType?: WaterType;

  // Business Partner / Advisor payout fields
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
  @IsString()
  billPrintingAddress?: string;
}
