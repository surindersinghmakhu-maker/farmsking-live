import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdvisorType, SellerType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class PartnerApplyDto {
  @ApiProperty({ description: '10-digit Indian mobile number' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?\d{10,15}$/, { message: 'Valid 10-digit mobile number is required.' })
  mobile: string;

  @ApiProperty({ enum: ['AGENT', 'ADVISOR', 'SELLER', 'NURSERY_OWNER'] })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsIn(['AGENT', 'ADVISOR', 'SELLER', 'NURSERY_OWNER'], {
    message: 'requestedRole must be one of: AGENT, ADVISOR, SELLER, NURSERY_OWNER',
  })
  requestedRole: 'AGENT' | 'ADVISOR' | 'SELLER' | 'NURSERY_OWNER';

  @ApiPropertyOptional({ enum: AdvisorType })
  @IsOptional()
  @IsEnum(AdvisorType)
  advisorType?: AdvisorType;

  @ApiProperty({ description: 'Applicant full legal name' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed.toLowerCase() : undefined;
    }
    return undefined;
  })
  @ValidateIf((o) => typeof o.email === 'string' && o.email.length > 0)
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email?: string;

  @ApiPropertyOptional({ description: 'Partner portal password (minimum 8 characters)' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
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
  qualification?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  yearsExperience?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ description: '10-character PAN number' })
  @IsNotEmpty()
  @IsString()
  panNumber: string;

  @ApiProperty({ description: 'Uploaded PAN card document URL' })
  @IsNotEmpty()
  @IsString()
  panDocUrl: string;

  @ApiProperty({ description: 'Last 4 digits of Aadhaar' })
  @IsNotEmpty()
  @IsString()
  aadhaarLast4: string;

  @ApiProperty({ description: 'Uploaded Aadhaar front document URL' })
  @IsNotEmpty()
  @IsString()
  aadhaarDocUrl: string;

  @ApiPropertyOptional({ description: 'Uploaded Aadhaar back document URL' })
  @IsOptional()
  @IsString()
  aadhaarBackUrl?: string;

  @ApiPropertyOptional({ description: '15-character GSTIN (mandatory for Commercial Sellers)' })
  @IsOptional()
  @IsString()
  gstin?: string;

  @ApiPropertyOptional({ description: 'GST Certificate document URL' })
  @IsOptional()
  @IsString()
  gstDocUrl?: string;

  @ApiProperty({ description: 'Bank account holder legal name' })
  @IsNotEmpty()
  @IsString()
  bankAccountHolderName: string;

  @ApiProperty({ description: 'Bank account number' })
  @IsNotEmpty()
  @IsString()
  bankAccountNumber: string;

  @ApiProperty({ description: '11-character bank IFSC code' })
  @IsNotEmpty()
  @IsString()
  bankIfsc: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  upiId?: string;

  @ApiProperty({ description: 'Cancelled cheque or bank passbook copy URL' })
  @IsNotEmpty()
  @IsString()
  chequeDocUrl: string;

  @ApiProperty({ description: 'Passport-size profile photo URL' })
  @IsNotEmpty()
  @IsString()
  photoUrl: string;

  @ApiPropertyOptional({ description: 'Store display name (for SELLER applications)' })
  @IsOptional()
  @IsString()
  storeName?: string;

  @ApiPropertyOptional({ description: 'Legal business/firm name (for SELLER applications)' })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({ enum: SellerType })
  @IsOptional()
  @IsEnum(SellerType)
  sellerType?: SellerType;

  @ApiPropertyOptional({ description: 'Warehouse / shop pickup address (for SELLER applications)' })
  @IsOptional()
  @IsString()
  pickupAddress?: string;

  @ApiProperty({ description: 'Acceptance of FarmsKing Partner & TDS statutory terms' })
  @IsBoolean()
  termsAccepted: boolean;

  @ApiPropertyOptional({ description: 'Optional Firebase phone verification ID token' })
  @IsOptional()
  @IsString()
  firebaseIdToken?: string;
}

