import { Type } from 'class-transformer';
import { ActivityType } from '@prisma/client';
import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsOptional, IsString, IsUUID, MinLength, ValidateNested } from 'class-validator';

class ActivityScheduleItemDto {
  @IsEnum(ActivityType)
  activityType: ActivityType;

  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  scheduledDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkCreateActivityScheduleDto {
  @IsUUID()
  cropCycleId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ActivityScheduleItemDto)
  items: ActivityScheduleItemDto[];
}
