import { IsOptional, IsString } from 'class-validator';

export class MarkPaidDto {
  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SubmitUtrDto {
  @IsString()
  utrNumber: string;
}

