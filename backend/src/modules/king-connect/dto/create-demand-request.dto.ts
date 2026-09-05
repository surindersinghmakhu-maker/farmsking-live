import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDemandRequestDto {
  @IsNotEmpty()
  @IsString()
  farmerKingId: string; // Farmer's King ID or mobile

  @IsNotEmpty()
  @IsString()
  cropName: string;

  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  @IsString()
  unit: string;

  @IsOptional()
  @IsNumber()
  offeredPrice?: number;

  @IsOptional()
  @IsDateString()
  requiredByDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
