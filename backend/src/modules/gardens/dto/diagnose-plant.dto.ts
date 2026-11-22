import { IsOptional, IsString, MinLength } from 'class-validator';

export class DiagnosePlantDto {
  @IsOptional()
  @IsString()
  plantId?: string;

  @IsString()
  @MinLength(1)
  leafPhotoUrl: string;

  @IsOptional()
  @IsString()
  leafDescription?: string;
}
