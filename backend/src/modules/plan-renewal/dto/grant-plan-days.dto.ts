import { IsInt, IsUUID, Min } from 'class-validator';

export class GrantPlanDaysDto {
  @IsUUID()
  farmerId: string;

  @IsInt()
  @Min(1)
  daysGranted: number;
}
