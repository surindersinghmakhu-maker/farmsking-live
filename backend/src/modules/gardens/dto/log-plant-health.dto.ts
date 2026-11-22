import { IsOptional, IsString, MinLength } from 'class-validator';

export class LogPlantHealthDto {
  @IsString()
  plantId: string;

  @IsString()
  @MinLength(1)
  photoUrl: string;

  @IsString()
  @MinLength(1)
  conditionStatus: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
