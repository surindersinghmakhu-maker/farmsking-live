import { IsEmail, IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SoilType, WaterType } from '@prisma/client';

const ALLOWED_TANK_SIZES = [15, 20, 25];

export class ConvertVerifiedLeadDto {
  @ApiProperty({ description: 'Full name for the new FarmsKing account' })
  @IsNotEmpty({ message: 'Full name is required to activate the user account.' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({ description: 'Account role', enum: ['CUSTOMER', 'FARMER', 'GARDENER'] })
  @IsIn(['CUSTOMER', 'FARMER', 'GARDENER'], { message: 'Role must be CUSTOMER, FARMER, or GARDENER.' })
  role: 'CUSTOMER' | 'FARMER' | 'GARDENER';

  @ApiPropertyOptional({ description: '6-digit Indian PIN code' })
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim() !== '')
  @Matches(/^\d{6}$/, { message: 'PIN code must be exactly 6 digits.' })
  pincode?: string;

  @ApiPropertyOptional({ description: 'Post office name' })
  @IsOptional()
  @IsString()
  postOffice?: string;

  @ApiPropertyOptional({ description: 'Village / Town name' })
  @IsOptional()
  @IsString()
  village?: string;

  @ApiPropertyOptional({ description: 'District name' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'State name' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Optional email address' })
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim() !== '')
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email?: string;

  @ApiPropertyOptional({ description: 'Farmer spray tank size in Liters (15, 20, or 25)' })
  @IsOptional()
  @IsInt()
  @IsIn(ALLOWED_TANK_SIZES)
  sprayTankSizeL?: number;

  @ApiPropertyOptional({ enum: SoilType })
  @IsOptional()
  @IsEnum(SoilType)
  soilType?: SoilType;

  @ApiPropertyOptional({ enum: WaterType })
  @IsOptional()
  @IsEnum(WaterType)
  waterType?: WaterType;

  @ApiPropertyOptional({ description: 'Optional referral code or King ID' })
  @IsOptional()
  @IsString()
  referralCode?: string;

  @ApiPropertyOptional({ description: 'Admin follow-up call notes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNotes?: string;
}

export class UpdateVerifiedLeadNotesDto {
  @ApiPropertyOptional({ description: 'Follow-up notes recorded by Admin' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNotes?: string;

  @ApiPropertyOptional({ description: 'Caller / user full name' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  capturedName?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim() !== '')
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  capturedEmail?: string;

  @ApiPropertyOptional({ description: '6-digit Indian PIN code' })
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim() !== '')
  @Matches(/^\d{6}$/, { message: 'PIN code must be exactly 6 digits.' })
  pincode?: string;

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
  village?: string;

  @ApiPropertyOptional({ enum: ['CUSTOMER', 'FARMER', 'GARDENER', 'ADVISOR', 'AGENT', 'SELLER', 'TRADER'] })
  @IsOptional()
  @IsIn(['CUSTOMER', 'FARMER', 'GARDENER', 'ADVISOR', 'AGENT', 'SELLER', 'TRADER'])
  intendedRole?: 'CUSTOMER' | 'FARMER' | 'GARDENER' | 'ADVISOR' | 'AGENT' | 'SELLER' | 'TRADER';

  @ApiPropertyOptional({ enum: ['OTP_CONFIRMED', 'DISMISSED'] })
  @IsOptional()
  @IsIn(['OTP_CONFIRMED', 'DISMISSED'])
  status?: 'OTP_CONFIRMED' | 'DISMISSED';
}
