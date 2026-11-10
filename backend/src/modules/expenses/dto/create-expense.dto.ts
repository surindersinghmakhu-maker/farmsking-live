import { PaymentMode } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsUUID()
  farmId: string;

  @IsOptional()
  @IsUUID()
  plotId?: string;

  @IsOptional()
  @IsString()
  cropCycleId?: string;

  @IsString()
  categoryId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @IsDateString()
  expenseDate: string;

  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @IsOptional()
  @IsString()
  partyId?: string;

  @IsOptional()
  @IsString()
  vendorName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  receiptPhotoUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
