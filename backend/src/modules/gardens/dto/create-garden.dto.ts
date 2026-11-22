import { IsEnum, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { GardenType } from '@prisma/client';

export class CreateGardenDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsEnum(GardenType)
  gardenType?: GardenType;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  area?: number;

  @IsOptional()
  @IsString()
  sunlightExposure?: string;

  @IsOptional()
  @IsString()
  wateringSource?: string;
}
