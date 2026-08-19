import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitPlanPaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  utr?: string;
}
