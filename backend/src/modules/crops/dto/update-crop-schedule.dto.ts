import { IsString, MinLength } from 'class-validator';

export class UpdateCropScheduleDto {
  @IsString()
  @MinLength(1)
  assignedSchedule: string;
}
