import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class RedeemFarmerPlanCouponDto {
  @IsString()
  @MinLength(3)
  code: string;

  /** Required when an advisor redeems on behalf of one of their assigned farmers. */
  @IsOptional()
  @IsUUID()
  farmerId?: string;

  /** Farmer redeeming their own fresh STANDARD/PREMIUM coupon: the advisor they picked in the same step. */
  @IsOptional()
  @IsUUID()
  advisorId?: string;
}
