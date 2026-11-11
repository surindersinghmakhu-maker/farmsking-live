import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SaveCropRemarkDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  remarksText?: string;
}

