import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { MandiUnit } from '@prisma/client';

export class RecordArhtiyaCropSaleDto {
  @IsString()
  partyId: string;

  @IsString()
  cropName: string;

  @IsString()
  @IsOptional()
  cropCycleId?: string;

  @IsEnum(MandiUnit)
  @IsOptional()
  inputUnit?: MandiUnit;

  @IsNumber()
  @Min(0.01)
  inputQuantity: number;

  @IsNumber()
  @Min(1)
  ratePerQuintal: number;

  @IsDateString()
  transactionDate: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  commissionPercent?: number; // e.g. 2.5% commission

  @IsNumber()
  @IsOptional()
  @Min(0)
  otherCharges?: number; // labour, unloading, weighing charges

  @IsString()
  @IsOptional()
  jFormNumber?: string;

  @IsDateString()
  @IsOptional()
  jFormDate?: string;

  @IsString()
  @IsOptional()
  jFormPhotoUrl?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
