import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';

export class ScheduleGroupCallDto {
  @IsString()
  title: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsString()
  targetAudienceType?: string; // 'ALL_FARMERS' | 'PLAN_MEMBERS' | 'SPECIFIC_FARMERS' | 'CROP_SPECIAL'

  @IsOptional()
  @IsString()
  targetPlanType?: string;

  @IsOptional()
  @IsString()
  targetCropName?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  invitedFarmerIds?: string[];

  @IsOptional()
  @IsString()
  alertMessage?: string;
}

export class SendGroupAlertDto {
  @IsOptional()
  @IsString()
  message?: string;
}
