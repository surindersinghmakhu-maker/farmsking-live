import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateActivityScheduleDto } from './create-activity-schedule.dto';

export class UpdateActivityScheduleDto extends PartialType(
  OmitType(CreateActivityScheduleDto, ['cropCycleId'] as const),
) {}
