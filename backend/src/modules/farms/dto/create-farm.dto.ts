import { AreaUnit } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateFarmDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsNumber()
  @IsPositive()
  totalArea: number;

  @IsOptional()
  @IsEnum(AreaUnit)
  areaUnit?: AreaUnit;

  @IsOptional()
  @IsString()
  soilType?: string;

  @IsOptional()
  @IsString()
  irrigationSource?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
