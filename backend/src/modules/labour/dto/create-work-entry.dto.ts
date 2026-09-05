import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateWorkEntryDto {
  @IsString()
  @IsNotEmpty()
  workerId: string;

  @IsString()
  @IsNotEmpty()
  workDate: string; // ISO date string YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  workType: string; // e.g. Harvesting, Weeding, Spraying, General

  @IsString()
  @IsNotEmpty()
  unit: string; // HOURLY, DAILY, LUMPSUM

  @IsNumber()
  @Min(0.01)
  quantity: number; // e.g. 1 day, 5 hours

  @IsNumber()
  @Min(0)
  rate: number; // Rate per unit

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  farmId?: string;

  @IsString()
  @IsOptional()
  plotId?: string;

  @IsString()
  @IsOptional()
  cropCycleId?: string;
}
