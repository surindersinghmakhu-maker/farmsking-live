import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { SprayScheduleStatus } from '@prisma/client';
import { CreateSprayScheduleDto } from './create-spray-schedule.dto';

export class UpdateSprayScheduleDto extends PartialType(OmitType(CreateSprayScheduleDto, ['cropCycleId'] as const)) {
  @IsOptional()
  @IsEnum(SprayScheduleStatus)
  status?: SprayScheduleStatus;
}
