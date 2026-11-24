import { IsOptional, IsString } from 'class-validator';

export class CancelFarmerPlanDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  requestId?: string;
}
