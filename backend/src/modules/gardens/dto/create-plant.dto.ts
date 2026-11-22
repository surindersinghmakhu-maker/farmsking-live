import { IsISO8601, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePlantDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  customName?: string;

  @IsOptional()
  @IsString()
  species?: string;

  @IsOptional()
  @IsString()
  variety?: string;

  @IsOptional()
  @IsString()
  gardenId?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  locationType?: string;

  @IsOptional()
  @IsNumber()
  potSizeInches?: number;

  @IsOptional()
  @IsString()
  potType?: string;

  @IsOptional()
  @IsString()
  healthStatus?: string;

  @IsOptional()
  @IsISO8601()
  plantedDate?: string;

  @IsOptional()
  @IsString()
  healthNotes?: string;
}
