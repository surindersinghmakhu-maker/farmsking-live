import { CropCategory, CropCycleStage, CropHarvestType, CropStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateCropDto {
  @IsUUID()
  plotId: string;

  @IsOptional()
  @IsEnum(CropCategory)
  category?: CropCategory;

  @IsString()
  @MinLength(1)
  cropName: string;

  @IsOptional()
  @IsString()
  variety?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  area?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  plantCount?: number;

  @IsOptional()
  @IsDateString()
  sowingDate?: string;

  @IsOptional()
  @IsDateString()
  transplantDate?: string;

  @IsOptional()
  @IsDateString()
  expectedHarvestDate?: string;

  @IsOptional()
  @IsDateString()
  actualHarvestDate?: string;

  @IsOptional()
  @IsEnum(CropStatus)
  status?: CropStatus;

  @IsOptional()
  @IsEnum(CropCycleStage)
  stage?: CropCycleStage;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  pricePerUnit?: number;

  @IsOptional()
  @IsEnum(CropHarvestType)
  harvestType?: CropHarvestType;

  @IsOptional()
  @IsString()
  notes?: string;
}
