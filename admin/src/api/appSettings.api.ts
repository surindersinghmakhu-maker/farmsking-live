import { apiClient } from './client';

export interface AppSettings {
  id: string;
  appName: string;
  logoUrl: string | null;
  tagline: string | null;
  upiId: string | null;
  upiPayeeName: string | null;
  groupVoiceCallEnabled?: boolean;
  whatsappGroupSyncEnabled?: boolean;
  whatsappAutoAddEnabled?: boolean;
  whatsappAutoRemoveEnabled?: boolean;
  whatsappGroupJid?: string | null;
  referralSignupBonusAmount?: number;
  newUserSignupBonusAmount?: number;
  referralPaidPlanBonusAmount?: number;
  partnerReferralCommissionAmount?: number;
  partnerRefereeSignupBonusAmount?: number;
  partnerReferralPaidPlanBonusAmount?: number;
  referralOfferSchemeEnabled?: boolean;
  referralOfferExpiryDate?: string | null;
  referralOfferSchemeName?: string | null;
  referralOfferReferrerBonus?: number;
  referralOfferNewUserBonus?: number;
  referralOfferPaidPlanBonus?: number;
  partnerOfferSchemeEnabled?: boolean;
  partnerOfferExpiryDate?: string | null;
  partnerOfferSchemeName?: string | null;
  partnerOfferReferrerBonus?: number;
  partnerOfferNewUserBonus?: number;
  partnerOfferPaidPlanBonus?: number;
  appDownloadUrl?: string | null;
  latestAppVersion?: string | null;
  storefrontMaintenanceMode?: boolean;
  agriMaintenanceMode?: boolean;
  gardenMaintenanceMode?: boolean;
  walletMaintenanceMode?: boolean;
  doctorMaintenanceMode?: boolean;
  gardenAdvisorMaintenanceMode?: boolean;
  accountsMaintenanceMode?: boolean;
  freeTrialEnabled?: boolean;
  freeTrialDays?: number;
  freeTrialPlan?: 'PRO' | 'SMART' | 'SUPER';
  advisorCertificationFee?: number;
  advisorCertificationDiscount?: number;
  gardenExpertPlatformFeePercent?: number;
  gardenerProCardPrice?: number;
  gardenerVipCardPrice?: number;
  updatedAt: string;
  updatedById: string | null;
}

export interface UpdateAppSettingsPayload {
  appName?: string;
  logoUrl?: string;
  tagline?: string;
  upiId?: string;
  upiPayeeName?: string;
  adminName?: string;
  adminMobile?: string;
  adminEmail?: string;
  groupVoiceCallEnabled?: boolean;
  whatsappGroupSyncEnabled?: boolean;
  whatsappAutoAddEnabled?: boolean;
  whatsappAutoRemoveEnabled?: boolean;
  whatsappGroupJid?: string;
  referralSignupBonusAmount?: number;
  newUserSignupBonusAmount?: number;
  referralPaidPlanBonusAmount?: number;
  partnerReferralCommissionAmount?: number;
  partnerRefereeSignupBonusAmount?: number;
  partnerReferralPaidPlanBonusAmount?: number;
  referralOfferSchemeEnabled?: boolean;
  referralOfferExpiryDate?: string;
  referralOfferSchemeName?: string;
  referralOfferReferrerBonus?: number;
  referralOfferNewUserBonus?: number;
  referralOfferPaidPlanBonus?: number;
  partnerOfferSchemeEnabled?: boolean;
  partnerOfferExpiryDate?: string;
  partnerOfferSchemeName?: string;
  partnerOfferReferrerBonus?: number;
  partnerOfferNewUserBonus?: number;
  partnerOfferPaidPlanBonus?: number;
  appDownloadUrl?: string;
  latestAppVersion?: string;
  storefrontMaintenanceMode?: boolean;
  agriMaintenanceMode?: boolean;
  gardenMaintenanceMode?: boolean;
  walletMaintenanceMode?: boolean;
  doctorMaintenanceMode?: boolean;
  gardenAdvisorMaintenanceMode?: boolean;
  accountsMaintenanceMode?: boolean;
  freeTrialEnabled?: boolean;
  freeTrialDays?: number;
  freeTrialPlan?: 'PRO' | 'SMART' | 'SUPER';
  advisorCertificationFee?: number;
  advisorCertificationDiscount?: number;
  gardenExpertPlatformFeePercent?: number;
  gardenerProCardPrice?: number;
  gardenerVipCardPrice?: number;
}

export async function getAppSettings(): Promise<AppSettings> {
  const { data } = await apiClient.get<AppSettings>('/app-settings');
  return data;
}

export async function updateAppSettings(payload: UpdateAppSettingsPayload): Promise<AppSettings> {
  const { data } = await apiClient.patch<AppSettings>('/app-settings', payload);
  return data;
}

export interface SupportContact {
  name: string;
  mobile: string;
  email: string | null;
}

export async function getSupportContact(): Promise<SupportContact> {
  const { data } = await apiClient.get<SupportContact>('/app-settings/support-contact');
  return data;
}

export interface SystemIntegrationsConfig {
  sms: {
    activeProvider: 'FAST2SMS' | 'MSG91' | 'TWILIO' | 'TEXTLOCAL' | 'GUPSHUP' | 'FIREBASE' | 'CUSTOM_HTTP';
    isEnabled: boolean;
    providers: {
      fast2sms: { apiKey: string; route: string; senderId: string; entityId: string };
      msg91: { authKey: string; senderId: string; dltFlowId: string; route: string };
      twilio: { accountSid: string; authToken: string; fromNumber: string };
      textlocal: { apiKey: string; senderName: string };
      gupshup: { userId: string; password: string; senderMask: string };
      firebase: {
        apiKey: string;
        authDomain: string;
        projectId: string;
        storageBucket: string;
        messagingSenderId: string;
        appId: string;
        measurementId: string;
        serviceAccountJson: string;
      };
      customHttp: { endpointUrl: string; method: string; authHeaderKey: string; authHeaderValue: string; payloadTemplate: string };
    };
  };
  gateway: {
    activeGateway: 'PHONEPE' | 'CASHFREE' | 'RAZORPAY' | 'PAYU' | 'STRIPE' | 'UPI_DIRECT';
    isSandbox: boolean;
    providers: {
      phonepe: { merchantId: string; clientId: string; clientSecret: string; saltKey: string; saltIndex: string; webhookUsername: string; webhookPassword: string };
      cashfree: { appId: string; secretKey: string; webhookSecret: string };
      razorpay: { keyId: string; keySecret: string; webhookSecret: string };
      payu: { merchantKey: string; merchantSalt: string };
      stripe: { publishableKey: string; secretKey: string; webhookSecret: string };
      upiDirect: { upiId: string; payeeName: string; merchantCode: string };
    };
  };
  whatsapp: {
    activeProvider: 'META_CLOUD' | 'BAILEYS_QR' | 'GUPSHUP' | 'WATI' | 'INTERAKT';
    isEnabled: boolean;
    providers: {
      metaCloud: { phoneNumberId: string; wabaId: string; accessToken: string; verifyToken: string; templateNamespace: string };
      baileys: { autoReconnect: boolean; groupJid: string; sessionActive: boolean };
      gupshup: { appName: string; appToken: string; sourceNumber: string };
      wati: { endpointUrl: string; accessToken: string };
      interakt: { apiKey: string };
    };
  };
  product: {
    platformFeePercent: number;
    defaultGstPercent: number;
    freeDeliveryThreshold: number;
    baseShippingCharge: number;
    lowStockThreshold: number;
    returnReplacementDays: number;
    enableCod: boolean;
    allowDirectSales: boolean;
    autoApproveReviews: boolean;
    requireKycForSellers: boolean;
  };
  socialMedia: {
    facebookUrl: string;
    instagramUrl: string;
    youtubeUrl: string;
    twitterUrl: string;
    linkedinUrl: string;
    telegramUrl: string;
    whatsappChannelUrl: string;
    googleClientId: string;
  };
  otp: {
    deliveryMode: 'ANY_SINGLE' | 'EMAIL_ONLY' | 'SMS_ONLY' | 'WHATSAPP_ONLY' | 'ANY_TWO' | 'ALL_CHANNELS';
    channelsEnabled: { email: boolean; sms: boolean; whatsapp: boolean };
    codeLength: 4 | 6;
    expirySeconds: number;
    maxResendAttempts: number;
    enableRateLimiting: boolean;
  };
  about: {
    companyName: string;
    brandName: string;
    tagline: string;
    logoUrl: string;
    faviconUrl: string;
    registeredAddress: string;
    headquarters: string;
    gstin: string;
    cin: string;
    pan: string;
    fssaiLicense: string;
    supportEmail: string;
    supportPhone: string;
    whatsappHelpline: string;
    grievanceOfficerName: string;
    grievanceOfficerEmail: string;
    workingHours: string;
    appVersion: string;
  };
}

export async function getSystemIntegrations(): Promise<SystemIntegrationsConfig> {
  const { data } = await apiClient.get<SystemIntegrationsConfig>('/app-settings/integrations');
  return data;
}

export async function updateSystemIntegrations(payload: Partial<SystemIntegrationsConfig>): Promise<SystemIntegrationsConfig> {
  const { data } = await apiClient.patch<SystemIntegrationsConfig>('/app-settings/integrations', payload);
  return data;
}
