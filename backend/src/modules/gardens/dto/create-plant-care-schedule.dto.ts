import { IsEnum, IsISO8601, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { PlantCareType } from '@prisma/client';

export class CreatePlantCareScheduleDto {
  @IsString()
  plantId: string;

  @IsEnum(PlantCareType)
  careType: PlantCareType;

  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsInt()
  @Min(1)
  intervalDays: number;

  @IsISO8601()
  nextDueDate: string;
}
