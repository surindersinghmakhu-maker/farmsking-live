import { CropProblemSeverity } from '@prisma/client';
import { ArrayMaxSize, IsArray, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateCropProblemDto {
  @IsUUID()
  cropCycleId: string;

  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  description: string;

  @IsOptional()
  @IsEnum(CropProblemSeverity)
  severity?: CropProblemSeverity;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  photoUrls?: string[];
}
