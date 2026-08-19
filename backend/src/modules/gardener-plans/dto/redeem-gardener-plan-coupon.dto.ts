import { IsString, MinLength } from 'class-validator';

export class RedeemGardenerPlanCouponDto {
  @IsString()
  @MinLength(3)
  code: string;
}
