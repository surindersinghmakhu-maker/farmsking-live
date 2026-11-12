import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { IsIndianMobile } from '../../../common/validators/is-indian-mobile.validator';
import { AADHAAR_LAST4_REGEX, GSTIN_REGEX, PAN_REGEX } from '../../../common/utils/tax-compliance.util';

/**
 * Data Transfer Object for Stage 2 Trader Self-Registration.
 * Allows a crop purchaser/shopkeeper who viewed their statement to upgrade into a full
 * authenticated account with TRADER + CUSTOMER roles and an auto-assigned King ID.
 */
export class RegisterTraderDto {
  /**
   * The 10-digit Indian mobile number of the trader/shopkeeper.
   * Serves as their primary login identifier and multi-farmer billing aggregation key.
   * @example "9876543210"
   */
  @ApiProperty({
    description: '10-digit Indian mobile number of the trader/shopkeeper',
    example: '9876543210',
    required: true,
  })
  @IsIndianMobile()
  mobile: string;

  /**
   * Secure account password selected by the trader (minimum 6 characters).
   * @example "StrongPass@2026"
   */
  @ApiProperty({
    description: 'Account password (minimum 6 characters)',
    example: 'StrongPass@2026',
    minLength: 6,
    required: true,
  })
  @IsString()
  @MinLength(6)
  password: string;

  /**
   * Full name of the trader or authorized proprietor.
   * @example "Gurpreet Singh"
   */
  @ApiProperty({
    description: 'Full name of the trader or shop proprietor',
    example: 'Gurpreet Singh',
    minLength: 2,
    required: true,
  })
  @IsString()
  @MinLength(2)
  name: string;

  /**
   * Name of the trading firm, shop, or commission agency.
   * @example "Singh Grain Traders"
   */
  @ApiPropertyOptional({
    description: 'Name of the trading shop or grain enterprise',
    example: 'Singh Grain Traders',
  })
  @IsOptional()
  @IsString()
  shopName?: string;

  /**
   * Grain market / Mandi where the trading firm operates.
   * @example "Makhu Grain Market"
   */
  @ApiPropertyOptional({
    description: 'Associated APMC Mandi or grain market name',
    example: 'Makhu Grain Market',
  })
  @IsOptional()
  @IsString()
  mandiName?: string;

  /**
   * District where the shopkeeper/trader is based.
   * @example "Ferozepur"
   */
  @ApiPropertyOptional({
    description: 'District of operation',
    example: 'Ferozepur',
  })
  @IsOptional()
  @IsString()
  district?: string;

  /**
   * State of operation.
   * @example "Punjab"
   */
  @ApiPropertyOptional({
    description: 'State of operation',
    example: 'Punjab',
  })
  @IsOptional()
  @IsString()
  state?: string;

  /** Firebase Phone Auth ID Token passed from OTP verification */
  @ApiPropertyOptional({
    description: 'Firebase ID Token from phone auth OTP verification',
  })
  @IsOptional()
  @IsString()
  firebaseIdToken?: string;

  @ApiPropertyOptional({ description: '15-character GSTIN (if GST registered)' })
  @IsOptional()
  @Matches(GSTIN_REGEX, { message: 'GSTIN must be a valid 15-character GSTIN.' })
  gstin?: string;

  @ApiPropertyOptional({ description: '10-character PAN for TDS Sec 194H/194Q/194O compliance' })
  @IsOptional()
  @Matches(PAN_REGEX, { message: 'PAN must be a valid 10-character PAN.' })
  panNumber?: string;

  @ApiPropertyOptional({ description: 'APMC / State Mandi Trader License Number' })
  @IsOptional()
  @IsString()
  mandiLicenseNo?: string;

  @ApiPropertyOptional({ description: 'Last 4 digits of Aadhaar for KYC verification' })
  @IsOptional()
  @Matches(AADHAAR_LAST4_REGEX, { message: 'Aadhaar last 4 digits must be numeric.' })
  aadhaarLast4?: string;

  @ApiPropertyOptional({ description: 'Terms & Privacy acceptance consent' })
  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;
}
