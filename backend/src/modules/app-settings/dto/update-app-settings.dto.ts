import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateAppSettingsDto {
  @IsOptional()
  @IsString()
  appName?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsString()
  upiId?: string;

  @IsOptional()
  @IsString()
  upiPayeeName?: string;

  @IsOptional()
  @IsString()
  adminName?: string;

  @IsOptional()
  @IsString()
  adminMobile?: string;

  @IsOptional()
  @IsString()
  adminEmail?: string;

  @IsOptional()
  @IsBoolean()
  groupVoiceCallEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsappGroupSyncEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsappAutoAddEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsappAutoRemoveEnabled?: boolean;

  @IsOptional()
  @IsString()
  whatsappGroupJid?: string;

  @IsOptional()
  @IsString()
  otpDeliveryChannel?: string;

  @IsOptional()
  referralSignupBonusAmount?: number;

  @IsOptional()
  newUserSignupBonusAmount?: number;

  @IsOptional()
  @IsString()
  appDownloadUrl?: string;

  @IsOptional()
  @IsString()
  latestAppVersion?: string;

  @IsOptional()
  @IsBoolean()
  storefrontMaintenanceMode?: boolean;

  @IsOptional()
  @IsBoolean()
  freeTrialEnabled?: boolean;

  @IsOptional()
  freeTrialDays?: number;

  @IsOptional()
  @IsString()
  freeTrialPlan?: string;
}

