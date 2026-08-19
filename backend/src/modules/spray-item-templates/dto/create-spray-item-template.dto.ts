import { SprayType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSprayItemTemplateDto {
  @IsOptional()
  @IsEnum(SprayType)
  sprayType?: SprayType;

  @IsString()
  @MinLength(1)
  item: string;

  @IsOptional()
  @IsString()
  dose?: string;

  @IsOptional()
  @IsString()
  alternative1?: string;

  @IsOptional()
  @IsString()
  alternative2?: string;
}
