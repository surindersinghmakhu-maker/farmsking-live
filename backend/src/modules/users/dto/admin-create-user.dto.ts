import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SellerType, SoilType, WaterType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export const ADMIN_CREATE_CATEGORIES = ['STAFF', 'PARTNERS', 'CLIENTS'] as const;
export type AdminCreateCategory = (typeof ADMIN_CREATE_CATEGORIES)[number];

export const ADMIN_CREATE_ROLES = [
  'ADMIN',
  'MANAGER',
  'OPERATOR',
  'TECHNICAL_TRAINER',
  'ACCOUNTANT',
  'AGENT',
  'SELLER',
  'FARM_ADVISOR',
  'GARDEN_ADVISOR',
  'TRADER',
  'FARMER',
  'GARDENER',
  'CUSTOMER',
  'SUPERVISOR',
] as const;
export type AdminCreateRoleKey = (typeof ADMIN_CREATE_ROLES)[number];

export class AdminCreateSendOtpDto {
  @ApiProperty({ description: '10-digit Indian mobile number to verify before onboarding' })
  @IsNotEmpty({ message: 'Mobile number is required.' })
  @IsString()
  mobile: string;
}

export class AdminCreateVerifyOtpDto {
  @ApiProperty({ description: '10-digit Indian mobile number' })
  @IsNotEmpty({ message: 'Mobile number is required.' })
  @IsString()
  mobile: string;

  @ApiProperty({ description: '6-digit verification OTP' })
  @IsNotEmpty({ message: '6-digit OTP is required.' })
  @IsString()
  otp: string;
}

export class AdminCreateUserDto {
  @ApiProperty({ description: 'Signed server OTP verification token returned by verify-otp' })
  @IsNotEmpty({ message: 'Mobile OTP verification is required before creating an account.' })
  @IsString()
  otpVerificationToken: string;

  @ApiProperty({ enum: ADMIN_CREATE_CATEGORIES })
  @IsIn(ADMIN_CREATE_CATEGORIES, { message: 'Category must be STAFF, PARTNERS, or CLIENTS.' })
  category: AdminCreateCategory;

  @ApiProperty({ enum: ADMIN_CREATE_ROLES })
  @IsIn(ADMIN_CREATE_ROLES, { message: 'Invalid role selected for user creation.' })
  role: AdminCreateRoleKey;

  @ApiProperty({ description: '10-digit verified mobile number' })
  @IsNotEmpty({ message: 'Mobile number is required.' })
  @IsString()
  mobile: string;

  @ApiProperty({ description: 'Full name of the user' })
  @IsNotEmpty({ message: 'Full name is required.' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim() !== '')
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email?: string;

  @ApiPropertyOptional({ description: 'Optional initial password (auto-generated for Staff if omitted)' })
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim() !== '')
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim() !== '')
  @Matches(/^\d{6}$/, { message: 'PIN code must be exactly 6 digits.' })
  pincode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postOffice?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  village?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  // Farmer fields
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsIn([15, 20, 25])
  sprayTankSizeL?: number;

  @ApiPropertyOptional({ enum: SoilType })
  @IsOptional()
  @IsEnum(SoilType)
  soilType?: SoilType;

  @ApiPropertyOptional({ enum: WaterType })
  @IsOptional()
  @IsEnum(WaterType)
  waterType?: WaterType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  farmName?: string;

  // Advisor fields
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qualification?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(70)
  yearsExperience?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(25000)
  doctorConsultationFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  // Partner / Seller / Trader KYC & Payout fields
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim() !== '')
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, { message: 'Invalid PAN format (e.g. ABCDE1234F).' })
  panNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  upiId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  alternativeMobile?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccountHolderName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim() !== '')
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/i, { message: 'Invalid 11-character IFSC code.' })
  bankIfsc?: string;

  // Seller Store fields
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  storeName?: string;

  @ApiPropertyOptional({ enum: SellerType })
  @IsOptional()
  @IsEnum(SellerType)
  sellerType?: SellerType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gstin?: string;

  // Supervisor field
  @ApiPropertyOptional({ description: 'Employer Farmer King ID or 10-digit mobile number' })
  @IsOptional()
  @IsString()
  employerFarmerKingIdOrMobile?: string;
}

