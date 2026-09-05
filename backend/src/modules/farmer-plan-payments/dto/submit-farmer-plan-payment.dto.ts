import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitFarmerPlanPaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  utr?: string;

  @IsOptional()
  @IsString()
  screenshotUrl?: string;
}
