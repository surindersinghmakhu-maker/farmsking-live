import { IsInt, IsUUID, Min } from 'class-validator';

export class GrantFarmerPlanDaysDto {
  @IsUUID()
  farmerId: string;

  @IsInt()
  @Min(1)
  daysGranted: number;
}
