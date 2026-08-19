import { SprayType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateSprayScheduleDto {
  @IsUUID()
  cropCycleId: string;

  @IsDateString()
  scheduledDate: string;

  @IsOptional()
  @IsEnum(SprayType)
  sprayType?: SprayType;

  @IsString()
  @MinLength(1)
  recommendedProduct: string;

  @IsOptional()
  @IsString()
  dosageInstructions?: string;

  @IsOptional()
  @IsString()
  alternativeOption?: string;

  @IsOptional()
  @IsString()
  alternativeOption2?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
