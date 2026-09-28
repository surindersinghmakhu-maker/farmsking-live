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
  referralPaidPlanBonusAmount?: number;

  @IsOptional()
  partnerReferralCommissionAmount?: number;

  @IsOptional()
  partnerRefereeSignupBonusAmount?: number;

  @IsOptional()
  partnerReferralPaidPlanBonusAmount?: number;

  @IsOptional()
  @IsBoolean()
  referralOfferSchemeEnabled?: boolean;

  @IsOptional()
  @IsString()
  referralOfferExpiryDate?: string;

  @IsOptional()
  @IsString()
  referralOfferSchemeName?: string;

  @IsOptional()
  referralOfferReferrerBonus?: number;

  @IsOptional()
  referralOfferNewUserBonus?: number;

  @IsOptional()
  referralOfferPaidPlanBonus?: number;

  @IsOptional()
  @IsBoolean()
  partnerOfferSchemeEnabled?: boolean;

  @IsOptional()
  @IsString()
  partnerOfferExpiryDate?: string;

  @IsOptional()
  @IsString()
  partnerOfferSchemeName?: string;

  @IsOptional()
  partnerOfferReferrerBonus?: number;

  @IsOptional()
  partnerOfferNewUserBonus?: number;

  @IsOptional()
  partnerOfferPaidPlanBonus?: number;

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

