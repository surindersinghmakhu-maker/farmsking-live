import { IsISO8601, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePlantDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  species?: string;

  @IsOptional()
  @IsISO8601()
  plantedDate?: string;

  @IsOptional()
  @IsString()
  healthNotes?: string;
}
