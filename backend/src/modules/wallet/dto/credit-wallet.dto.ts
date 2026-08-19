import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreditWalletDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
