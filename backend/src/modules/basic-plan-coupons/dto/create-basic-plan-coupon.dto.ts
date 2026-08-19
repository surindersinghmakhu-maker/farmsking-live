import { IsInt, Min } from 'class-validator';

export class CreateBasicPlanCouponDto {
  @IsInt()
  @Min(1)
  daysGranted: number;
}
