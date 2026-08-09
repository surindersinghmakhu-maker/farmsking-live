import { AreaUnit } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MinLength } from 'class-validator';

export class CreatePlotDto {
  @IsUUID()
  farmId: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsNumber()
  @IsPositive()
  area: number;

  @IsOptional()
  @IsEnum(AreaUnit)
  areaUnit?: AreaUnit;

  @IsOptional()
  @IsString()
  soilType?: string;

  @IsOptional()
  @IsString()
  irrigationType?: string;

  @IsOptional()
  @IsString()
  waterSource?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
