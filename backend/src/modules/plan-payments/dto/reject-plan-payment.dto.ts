import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectPlanPaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
