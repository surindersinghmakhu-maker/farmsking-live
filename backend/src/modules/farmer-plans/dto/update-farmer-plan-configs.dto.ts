import { IsBoolean, IsOptional, IsObject } from 'class-validator';

export class UpdateFarmerPlanConfigsDto {
  @IsOptional()
  @IsObject()
  configs?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  storeCodEnabled?: boolean;
}
