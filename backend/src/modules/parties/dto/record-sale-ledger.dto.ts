import { IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class RecordSaleLedgerDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  totalAmount: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amountReceived?: number;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  saleBillId?: string;
}
