import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ApproveWithdrawalDto {
  /** Admin can edit the payout amount at approval time — defaults to the requested amount if omitted. */
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  approvedAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
