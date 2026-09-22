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
  area?: number;

  @IsOptional()
  @IsInt()
  plantCount?: number;

  @IsOptional()
  @IsString()
  sowingDate?: string;

  @IsOptional()
  @IsString()
  transplantDate?: string;

  @IsOptional()
  @IsString()
  expectedHarvestDate?: string;

  @IsOptional()
  @IsString()
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
  @IsEnum(CropHarvestType)
  harvestType?: CropHarvestType;

  @IsOptional()
  @IsString()
  notes?: string;
}
