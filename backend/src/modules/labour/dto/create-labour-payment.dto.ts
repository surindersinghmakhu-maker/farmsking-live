import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMode } from '@prisma/client';

export class CreateLabourPaymentDto {
  @IsString()
  @IsNotEmpty()
  workerId: string;

  @IsString()
  @IsNotEmpty()
  paymentDate: string; // ISO date string YYYY-MM-DD

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(PaymentMode)
  @IsOptional()
  paymentMode?: PaymentMode;

  @IsString()
  @IsOptional()
  notes?: string;
}
