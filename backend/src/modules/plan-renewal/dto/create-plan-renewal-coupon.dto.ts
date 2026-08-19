import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreatePlanRenewalCouponDto {
  @IsInt()
  @Min(1)
  daysGranted: number;

  /** Optionally lock the code to one farmer — if omitted, any farmer can redeem it once. */
  @IsOptional()
  @IsUUID()
  assignedFarmerId?: string;

  /** Optionally lock the code to one advisor instead — that advisor can then apply it to any of their assigned farmers. */
  @IsOptional()
  @IsUUID()
  assignedAdvisorId?: string;
}
