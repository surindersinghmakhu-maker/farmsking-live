import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RecordArhtiyaAdvanceDto {
  @IsString()
  partyId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsDateString()
  transactionDate: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  interestRateMonthly?: number; // e.g. 1.5 for 1.5% per month (₹1.50 per ₹100/month)

  @IsString()
  @IsOptional()
  notes?: string;
}
