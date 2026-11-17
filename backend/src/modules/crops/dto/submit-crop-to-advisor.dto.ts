import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { HiringModelType } from '@prisma/client';

export class SubmitCropToAdvisorDto {
  @IsOptional()
  @IsUUID()
  advisorId?: string;

  @IsOptional()
  @IsEnum(HiringModelType)
  hiringModel?: HiringModelType;

  @IsOptional()
  @IsString()
  notes?: string;
}
