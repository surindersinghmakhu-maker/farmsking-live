import { CropProblemStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateCropProblemStatusDto {
  @IsEnum(CropProblemStatus)
  status: CropProblemStatus;
}
