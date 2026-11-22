import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { PlantCareType } from '@prisma/client';

export class PrescribePlantCareDto {
  @IsString()
  gardenerId: string;

  @IsOptional()
  @IsString()
  plantId?: string;

  @IsOptional()
  @IsString()
  gardenId?: string;

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

  @IsOptional()
  @IsString()
  nextDueDate?: string;
}

export class DoctorConsultationNoteDto {
  @IsString()
  gardenerId: string;

  @IsString()
  plantId: string;

  @IsString()
  @MinLength(1)
  notes: string;

  @IsOptional()
  @IsString()
  conditionStatus?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
