import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object for public guest statement lookup.
 * Allows any crop purchaser, trader, or shopkeeper to view their statement
 * with a specific farmer without prior registration or password.
 */
export class LookupBuyerStatementDto {
  /**
   * The 10-digit mobile number of the purchaser/buyer.
   * Used as the username in the guest statement lookup flow.
   * @example "9876543210"
   */
  @ApiProperty({
    description: '10-digit mobile number of the crop buyer/shopkeeper',
    example: '9876543210',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  buyerMobile: string;

  /**
   * The farmer identifier: either the farmer's 10-digit mobile number or their 8-digit King ID.
   * Used as the verification token in the guest lookup flow.
   * @example "9872066901"
   */
  @ApiProperty({
    description: 'Farmer mobile number or 8-digit King ID used for verification',
    example: '9872066901',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  farmerMobileOrKingId: string;
}
