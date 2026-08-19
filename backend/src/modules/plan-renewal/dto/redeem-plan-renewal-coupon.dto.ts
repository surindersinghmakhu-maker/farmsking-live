import { IsOptional, IsUUID } from 'class-validator';

export class RedeemPlanRenewalCouponDto {
  /** Required when the caller is an ADVISOR (or admin) redeeming on behalf of a farmer; ignored for a FARMER redeeming their own plan. */
  @IsOptional()
  @IsUUID()
  farmerId?: string;
}
