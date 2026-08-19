import { IsInt, IsISO8601, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateGardenerPlanCouponDto {
  @IsInt()
  @Min(1)
  daysGranted: number;

  /** Optional: lock coupon to a specific gardener */
  @IsOptional()
  @IsUUID()
  assignedGardenerId?: string;

  /** Optional: coupon itself expires on this date (ISO string) */
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}
