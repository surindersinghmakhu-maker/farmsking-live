import { CropProblemStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class RespondCropProblemDto {
  @IsString()
  @MinLength(1)
  advisorResponse: string;

  @IsOptional()
  @IsString()
  recommendedProduct?: string;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @IsOptional()
  @IsEnum(CropProblemStatus)
  status?: CropProblemStatus;
}
