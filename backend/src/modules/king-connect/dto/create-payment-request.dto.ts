import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePaymentRequestDto {
  @IsNotEmpty()
  @IsString()
  receiverKingId: string;

  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  refBillNo?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
