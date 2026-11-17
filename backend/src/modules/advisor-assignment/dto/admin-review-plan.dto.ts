import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AdminApprovePlanDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(-1)
  callRequestLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(-1)
  inAppCallLimit?: number;

  @IsOptional()
  @IsBoolean()
  videoCallAllowed?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  videoCallLimit?: number;

  @IsOptional()
  @IsBoolean()
  chatEnabled?: boolean;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class AdminRejectPlanDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
