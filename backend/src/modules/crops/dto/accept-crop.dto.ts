import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { CropCycleStage } from '@prisma/client';

export class AcceptCropByAdvisorDto {
  @IsOptional()
  @IsNumber()
  plantCount?: number;

  @IsOptional()
  @IsEnum(CropCycleStage)
  stage?: CropCycleStage;
}
