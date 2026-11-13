import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { DeliveryPricingType, NurseryCategoryType } from '@prisma/client';

export class CreateNurseryBatchDto {
  @ApiPropertyOptional({ description: 'Optional Plot ID if linked to on-farm plot' })
  @IsOptional()
  @IsString()
  plotId?: string;

  @ApiProperty({ enum: NurseryCategoryType, default: NurseryCategoryType.FLOWER_PLUG_EXPRESS })
  @IsNotEmpty()
  @IsEnum(NurseryCategoryType)
  category: NurseryCategoryType;

  @ApiProperty({ description: 'Plant variety name e.g. Marigold Calcutta, Seminis Tomato, PR-126' })
  @IsNotEmpty()
  @IsString()
  varietyName: string;

  @ApiPropertyOptional({ description: 'Date seed was sown (ISO format, optional for ready stock)' })
  @IsOptional()
  @IsDateString()
  sowingDate?: string;

  @ApiPropertyOptional({ description: 'Date seedlings become ready for transplanting (ISO format, optional)' })
  @IsOptional()
  @IsDateString()
  readyDate?: string;

  @ApiPropertyOptional({ description: 'Latest safe uprooting/dispatch date (ISO format, optional)' })
  @IsOptional()
  @IsDateString()
  uprootingDeadline?: string;

  @ApiPropertyOptional({ description: 'Photo URL of certified seed tag / bill' })
  @IsOptional()
  @IsString()
  seedTagPhotoUrl?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSeedCertified?: boolean;

  @ApiPropertyOptional({ description: 'Batch sowing verification photo URL' })
  @IsOptional()
  @IsString()
  sowingPhotoUrl?: string;

  @ApiPropertyOptional({ description: 'Batch uprooting readiness photo URL' })
  @IsOptional()
  @IsString()
  uprootingPhotoUrl?: string;

  @ApiPropertyOptional({ description: 'Tray cavities count (50, 104, 128) for flower/veg plugs', default: 104 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  trayCavityCount?: number;

  @ApiPropertyOptional({ description: 'Guaranteed bundles per acre for paddy', default: 300 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  guaranteedBundlesPerAcre?: number;

  @ApiProperty({ description: 'Price per unit (per Tray for plugs, or per Acre for paddy)' })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  pricePerUnit: number;

  @ApiProperty({ description: 'Estimated batch capacity (in Trays or Acres)' })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  estimatedCapacity: number;

  @ApiPropertyOptional({ description: 'Minimum order amount guard in INR', default: 2000 })
  @IsOptional()
  @IsNumber()
  @Min(2000)
  minOrderAmount?: number;

  @ApiPropertyOptional({ enum: DeliveryPricingType, default: DeliveryPricingType.INCLUDED })
  @IsOptional()
  @IsEnum(DeliveryPricingType)
  deliveryPricingType?: DeliveryPricingType;
}

