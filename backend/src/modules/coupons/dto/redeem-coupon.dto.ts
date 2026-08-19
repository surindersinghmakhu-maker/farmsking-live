import { IsNumber, Min } from 'class-validator';

export class RedeemCouponDto {
  @IsNumber()
  @Min(0.01)
  orderAmount: number;
}
