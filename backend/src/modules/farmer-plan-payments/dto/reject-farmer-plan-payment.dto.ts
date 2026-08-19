import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectFarmerPlanPaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
