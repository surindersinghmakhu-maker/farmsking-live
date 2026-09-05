import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateLabourWorkerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  defaultRate?: number;

  @IsString()
  @IsOptional()
  defaultUnit?: string; // HOURLY, DAILY, LUMPSUM

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  farmId?: string;
}

export class UpdateLabourWorkerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  defaultRate?: number;

  @IsString()
  @IsOptional()
  defaultUnit?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
