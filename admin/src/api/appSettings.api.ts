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

export type SupportedPaymentGateway =
  | 'PHONEPE'
  | 'CASHFREE'
  | 'RAZORPAY'
  | 'PAYU'
  | 'STRIPE'
  | 'UPI_DIRECT'
  | 'PAYTM'
  | 'CCAVENUE'
  | 'INSTAMOJO'
  | 'EASEBUZZ';

export interface ModulePaymentFeatureConfig {
  gateway: SupportedPaymentGateway;
  checkoutMode: 'UPI_ONLY' | 'UPI_AND_NETBANKING' | 'ALL_METHODS' | 'CUSTOM';
  bypassPlayBilling: boolean; // Bypass 15-30% Google Play cut via UPI Intent / Direct Web
  allowedMethods: {
    upi: boolean;
    cards: boolean;
    netbanking: boolean;
    wallets: boolean;
    cod: boolean;
    emi: boolean;
  };
  customNote?: string;
}

export interface SystemIntegrationsConfig {
  sms: {
    activeProvider: 'FAST2SMS' | 'MSG91' | 'TWILIO' | 'TEXTLOCAL' | 'GUPSHUP' | 'FIREBASE' | 'CUSTOM_HTTP' | 'KALEYRA';
    isEnabled: boolean;
    providers: {
      fast2sms: { apiKey: string; route: string; senderId: string; entityId: string };
      msg91: { authKey: string; senderId: string; dltFlowId: string; route: string };
      twilio: { accountSid: string; authToken: string; fromNumber: string };
      textlocal: { apiKey: string; senderName: string };
      gupshup: { userId: string; password: string; senderMask: string };
      kaleyra?: { apiKey: string; sid: string; senderId: string };
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
    activeGateway: SupportedPaymentGateway;
    isSandbox: boolean;
    routing?: {
      farmerPlanGateway: SupportedPaymentGateway;
      advisorBookingGateway: SupportedPaymentGateway;
      gardenStoreGateway: SupportedPaymentGateway;
      ecommerceStoreGateway: SupportedPaymentGateway;
    };
    moduleRules?: {
      farmerPlans: ModulePaymentFeatureConfig;
      advisorBookings: ModulePaymentFeatureConfig;
      gardenStore: ModulePaymentFeatureConfig;
      ecommerceStore: ModulePaymentFeatureConfig;
    };
    providers: {
      phonepe: { merchantId: string; clientId: string; clientSecret: string; saltKey: string; saltIndex: string; webhookUsername: string; webhookPassword: string };
      cashfree: { appId: string; secretKey: string; webhookSecret: string };
      razorpay: { keyId: string; keySecret: string; webhookSecret: string };
      payu: { merchantKey: string; merchantSalt: string };
      stripe: { publishableKey: string; secretKey: string; webhookSecret: string };
      upiDirect: { upiId: string; payeeName: string; merchantCode: string };
      paytm?: { mid: string; merchantKey: string; website: string };
      ccavenue?: { merchantId: string; accessCode: string; workingKey: string };
      instamojo?: { apiKey: string; authToken: string; clientSecret: string };
      easebuzz?: { merchantKey: string; salt: string; env: string };
    };
  };
  whatsapp: {
    activeProvider: 'META_CLOUD' | 'BAILEYS_QR' | 'GUPSHUP' | 'WATI' | 'INTERAKT' | 'AISENSY' | 'TWILIO_WHATSAPP';
    isEnabled: boolean;
    providers: {
      metaCloud: { phoneNumberId: string; wabaId: string; accessToken: string; verifyToken: string; templateNamespace: string };
      baileys: { autoReconnect: boolean; groupJid: string; sessionActive: boolean };
      gupshup: { appName: string; appToken: string; sourceNumber: string };
      wati: { endpointUrl: string; accessToken: string };
      interakt: { apiKey: string };
      aisensy?: { apiKey: string; campaignName: string };
      twilioWhatsapp?: { accountSid: string; authToken: string; fromNumber: string };
    };
  };
  ai: {
    activeProvider: 'GEMINI' | 'OPENAI' | 'CLAUDE' | 'LLAMA' | 'MISTRAL' | 'GROQ' | 'HUGGINGFACE';
    isEnabled: boolean;
    providers: {
      gemini: { apiKey: string; model: string; dailyQuota: number };
      openai: { apiKey: string; model: string };
      claude: { apiKey: string; model: string };
      llama: { endpointUrl: string; apiKey: string };
      mistral?: { apiKey: string; model: string };
      groq?: { apiKey: string; model: string };
      huggingface?: { apiKey: string; modelEndpoint: string };
    };
  };
  telecom: {
    activeProvider: 'AGORA' | 'LIVEKIT' | 'HUNDRED_MS' | 'TWILIO_VIDEO' | 'DAILY_CO' | 'JITSI';
    isEnabled: boolean;
    providers: {
      agora: { appId: string; appCertificate: string; customerId: string; freeMinutesQuota: number };
      livekit: { host: string; apiKey: string; apiSecret: string };
      hundredMs?: { appId: string; appSecret: string; tokenEndpoint: string };
      twilioVideo?: { accountSid: string; apiKey: string; apiSecret: string };
      dailyCo?: { apiKey: string; domain: string };
      jitsi?: { domain: string; appId: string; appSecret: string };
    };
  };
  weather: {
    activeProvider: 'OPEN_METEO' | 'OPEN_WEATHER_MAP' | 'WEATHER_API' | 'IMD' | 'ACCUWEATHER' | 'TOMORROW_IO';
    isEnabled: boolean;
    providers: {
      openMeteo: { endpointUrl: string; autoSprayAlerts: boolean };
      openWeatherMap: { apiKey: string };
      weatherApi: { apiKey: string };
      imd?: { apiKey: string; endpointUrl: string };
      accuweather?: { apiKey: string };
      tomorrowIo?: { apiKey: string };
    };
  };
  satellite: {
    activeProvider: 'AGROMONITORING' | 'SENTINEL_HUB' | 'COPERNICUS' | 'GOOGLE_EARTH_ENGINE' | 'ISRO_BHUVAN' | 'PLANET_LABS';
    isEnabled: boolean;
    providers: {
      agromonitoring: { apiKey: string; autoSyncPolygons: boolean };
      sentinelHub: { clientId: string; clientSecret: string; instanceId: string };
      copernicus: { username: string; password: string; clientId: string };
      googleEarthEngine: { serviceAccountEmail: string; privateKey: string; projectId: string };
      isroBhuvan: { token: string; endpointUrl: string };
      planetLabs: { apiKey: string };
    };
  };
  logistics: {
    activeProvider: 'SHIPROCKET' | 'DELHIVERY' | 'NIMBUSPOST' | 'SHADOWFAX' | 'BLUEDART' | 'DTDC' | 'BORZO';
    isEnabled: boolean;
    providers: {
      shiprocket: { email: string; password: string; token: string; autoAssignCourier: boolean };
      delhivery: { apiKey: string; clientName: string };
      nimbuspost?: { email: string; password: string };
      shadowfax?: { apiKey: string; clientCode: string };
      bluedart?: { loginId: string; licenceKey: string; customerCode: string };
      dtdc?: { customerId: string; apiKey: string };
      borzo?: { authKey: string };
    };
  };
  push: {
    activeProvider: 'FIREBASE_FCM' | 'ONE_SIGNAL' | 'PUSHER' | 'EXPO_PUSH';
    isEnabled: boolean;
    providers: {
      firebaseFcm: { serverKey: string; vapidKey: string; topicWeatherSiren: string; topicMandiAlerts: string };
      oneSignal: { appId: string; apiKey: string };
      pusher?: { appId: string; secret: string; instanceId: string };
      expoPush?: { accessToken: string };
    };
  };
  storage: {
    activeProvider: 'CLOUDFLARE_R2' | 'NEON_S3' | 'SUPABASE' | 'AWS_S3' | 'GOOGLE_GCS' | 'MINIO' | 'BUNNY_CDN';
    providers: {
      cloudflareR2: { accountId: string; accessKeyId: string; secretAccessKey: string; bucketName: string; publicUrl: string };
      supabase: { projectUrl: string; anonKey: string; bucketName: string };
      awsS3: { region: string; accessKeyId: string; secretAccessKey: string; bucketName: string };
      googleGcs?: { bucketName: string; clientEmail: string; privateKey: string };
      minio?: { endpoint: string; accessKey: string; secretKey: string; bucketName: string };
      bunnyCdn?: { storageZoneName: string; accessKey: string; pullZoneUrl: string };
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

export const DEFAULT_SYSTEM_INTEGRATIONS_CONFIG: SystemIntegrationsConfig = {
  sms: {
    activeProvider: 'FIREBASE',
    isEnabled: true,
    providers: {
      firebase: {
        apiKey: 'AIzaSyC4ZPSAJcbb7xHzPdWlmqNo0yX2rnLeIgo',
        authDomain: 'farmsking-510606.firebaseapp.com',
        projectId: 'farmsking-510606',
        storageBucket: 'farmsking-510606.firebasestorage.app',
        messagingSenderId: '742233980320',
        appId: '1:742233980320:web:baebebe2a59b7a4857b8c5',
        measurementId: 'G-42NJGE0F0D',
        serviceAccountJson: '',
      },
      fast2sms: { apiKey: '', route: 'otp', senderId: 'FRMKNG', entityId: '' },
      msg91: { authKey: '', senderId: 'FRMKNG', dltFlowId: '', route: '4' },
      twilio: { accountSid: '', authToken: '', fromNumber: '' },
      textlocal: { apiKey: '', senderName: 'FRMKNG' },
      gupshup: { userId: '', password: '', senderMask: 'FRMKNG' },
      kaleyra: { apiKey: '', sid: '', senderId: 'FRMKNG' },
      customHttp: { endpointUrl: '', method: 'POST', authHeaderKey: 'Authorization', authHeaderValue: '', payloadTemplate: '{"to":"{{mobile}}","text":"{{message}}"}' },
    },
  },
  gateway: {
    activeGateway: 'PHONEPE',
    isSandbox: true,
    routing: {
      farmerPlanGateway: 'UPI_DIRECT',
      advisorBookingGateway: 'RAZORPAY',
      gardenStoreGateway: 'PHONEPE',
      ecommerceStoreGateway: 'CASHFREE',
    },
    moduleRules: {
      farmerPlans: {
        gateway: 'UPI_DIRECT',
        checkoutMode: 'UPI_ONLY',
        bypassPlayBilling: true,
        allowedMethods: {
          upi: true,
          cards: false,
          netbanking: false,
          wallets: false,
          cod: false,
          emi: false,
        },
        customNote: 'Direct NPCI UPI (0% Fee, Zero Google Play Cut)',
      },
      advisorBookings: {
        gateway: 'RAZORPAY',
        checkoutMode: 'ALL_METHODS',
        bypassPlayBilling: true,
        allowedMethods: {
          upi: true,
          cards: true,
          netbanking: true,
          wallets: true,
          cod: false,
          emi: false,
        },
        customNote: 'Agronomist & Doctor Video Session Bookings',
      },
      gardenStore: {
        gateway: 'PHONEPE',
        checkoutMode: 'ALL_METHODS',
        bypassPlayBilling: false,
        allowedMethods: {
          upi: true,
          cards: true,
          netbanking: true,
          wallets: true,
          cod: true,
          emi: false,
        },
        customNote: 'Urban Plants, Seeds & Potting Soil Kits',
      },
      ecommerceStore: {
        gateway: 'CASHFREE',
        checkoutMode: 'ALL_METHODS',
        bypassPlayBilling: false,
        allowedMethods: {
          upi: true,
          cards: true,
          netbanking: true,
          wallets: true,
          cod: true,
          emi: true,
        },
        customNote: 'AgriStore Multi-Vendor Marketplace (Automated Splits)',
      },
    },
    providers: {
      phonepe: {
        merchantId: 'M22KMYD10AWD8_2607081836',
        clientId: 'M22KMYD10AWD8_2607081836',
        clientSecret: '',
        saltKey: '',
        saltIndex: '1',
        webhookUsername: 'farmsking_webhook',
        webhookPassword: '',
      },
      cashfree: { appId: '', secretKey: '', webhookSecret: '' },
      razorpay: { keyId: '', keySecret: '', webhookSecret: '' },
      payu: { merchantKey: '', merchantSalt: '' },
      stripe: { publishableKey: '', secretKey: '', webhookSecret: '' },
      upiDirect: { upiId: 'surindersinghmakhu-8@okicici', payeeName: 'FarmsKing India', merchantCode: '0000' },
      paytm: { mid: '', merchantKey: '', website: 'DEFAULT' },
      ccavenue: { merchantId: '', accessCode: '', workingKey: '' },
      instamojo: { apiKey: '', authToken: '', clientSecret: '' },
      easebuzz: { merchantKey: '', salt: '', env: 'test' },
    },
  },
  whatsapp: {
    activeProvider: 'META_CLOUD',
    isEnabled: true,
    providers: {
      metaCloud: {
        phoneNumberId: '9577622000',
        wabaId: '1098234712039',
        accessToken: '',
        verifyToken: 'farmsking_verify_token_2026',
        templateNamespace: 'farmsking_templates',
      },
      baileys: { autoReconnect: true, groupJid: '', sessionActive: false },
      gupshup: { appName: '', appToken: '', sourceNumber: '' },
      wati: { endpointUrl: '', accessToken: '' },
      interakt: { apiKey: '' },
      aisensy: { apiKey: '', campaignName: 'farmsking_advisory' },
      twilioWhatsapp: { accountSid: '', authToken: '', fromNumber: 'whatsapp:+14155238886' },
    },
  },
  ai: {
    activeProvider: 'GEMINI',
    isEnabled: true,
    providers: {
      gemini: { apiKey: '', model: 'gemini-1.5-flash', dailyQuota: 1500 },
      openai: { apiKey: '', model: 'gpt-4o-mini' },
      claude: { apiKey: '', model: 'claude-3-5-sonnet-20241022' },
      llama: { endpointUrl: 'https://api.groq.com/openai/v1', apiKey: '' },
      mistral: { apiKey: '', model: 'pixtral-12b-2409' },
      groq: { apiKey: '', model: 'llama-3.2-11b-vision-preview' },
      huggingface: { apiKey: '', modelEndpoint: 'https://api-inference.huggingface.co/models/crop-disease-detection' },
    },
  },
  telecom: {
    activeProvider: 'AGORA',
    isEnabled: true,
    providers: {
      agora: { appId: '3a0f6aee857c4c048adad7170098b60e', appCertificate: '82dac728be6c4cc3bb242c4c0715c640', customerId: '', freeMinutesQuota: 10000 },
      livekit: { host: '', apiKey: '', apiSecret: '' },
      hundredMs: { appId: '', appSecret: '', tokenEndpoint: '' },
      twilioVideo: { accountSid: '', apiKey: '', apiSecret: '' },
      dailyCo: { apiKey: '', domain: '' },
      jitsi: { domain: 'meet.jit.si', appId: '', appSecret: '' },
    },
  },
  weather: {
    activeProvider: 'OPEN_METEO',
    isEnabled: true,
    providers: {
      openMeteo: { endpointUrl: 'https://api.open-meteo.com/v1/forecast', autoSprayAlerts: true },
      openWeatherMap: { apiKey: '' },
      weatherApi: { apiKey: '' },
      imd: { apiKey: '', endpointUrl: 'https://internal.imd.gov.in/agrimet' },
      accuweather: { apiKey: '' },
      tomorrowIo: { apiKey: '' },
    },
  },
  satellite: {
    activeProvider: 'AGROMONITORING',
    isEnabled: true,
    providers: {
      agromonitoring: { apiKey: '', autoSyncPolygons: true },
      sentinelHub: { clientId: '', clientSecret: '', instanceId: '' },
      copernicus: { username: '', password: '', clientId: '' },
      googleEarthEngine: { serviceAccountEmail: '', privateKey: '', projectId: 'farmsking-geospatial' },
      isroBhuvan: { token: '', endpointUrl: 'https://bhuvan-app1.nrsc.gov.in/agri' },
      planetLabs: { apiKey: '' },
    },
  },
  logistics: {
    activeProvider: 'SHIPROCKET',
    isEnabled: true,
    providers: {
      shiprocket: { email: '', password: '', token: '', autoAssignCourier: true },
      delhivery: { apiKey: '', clientName: '' },
      nimbuspost: { email: '', password: '' },
      shadowfax: { apiKey: '', clientCode: '' },
      bluedart: { loginId: '', licenceKey: '', customerCode: '' },
      dtdc: { customerId: '', apiKey: '' },
      borzo: { authKey: '' },
    },
  },
  push: {
    activeProvider: 'FIREBASE_FCM',
    isEnabled: true,
    providers: {
      firebaseFcm: { serverKey: '', vapidKey: '', topicWeatherSiren: 'farmsking_weather', topicMandiAlerts: 'farmsking_mandi' },
      oneSignal: { appId: '', apiKey: '' },
      pusher: { appId: '', secret: '', instanceId: '' },
      expoPush: { accessToken: '' },
    },
  },
  storage: {
    activeProvider: 'CLOUDFLARE_R2',
    providers: {
      cloudflareR2: { accountId: '', accessKeyId: '', secretAccessKey: '', bucketName: 'farmsking-media', publicUrl: 'https://media.farmsking.in' },
      supabase: { projectUrl: '', anonKey: '', bucketName: 'farmsking-vault' },
      awsS3: { region: 'ap-south-1', accessKeyId: '', secretAccessKey: '', bucketName: '' },
      googleGcs: { bucketName: '', clientEmail: '', privateKey: '' },
      neonS3: { endpoint: '', accessKey: '', secretKey: '', bucketName: '' },
      minio: { endpoint: '', accessKey: '', secretKey: '', bucketName: '' },
      bunnyCdn: { storageZoneName: '', accessKey: '', pullZoneUrl: '' },
    },
  },
  product: {
    platformFeePercent: 5,
    defaultGstPercent: 0,
    freeDeliveryThreshold: 499,
    baseShippingCharge: 40,
    lowStockThreshold: 10,
    returnReplacementDays: 7,
    enableCod: true,
    allowDirectSales: true,
    autoApproveReviews: false,
    requireKycForSellers: false,
  },
  socialMedia: {
    facebookUrl: 'https://facebook.com/farmsking',
    instagramUrl: 'https://instagram.com/farmsking',
    youtubeUrl: 'https://youtube.com/@farmsking',
    twitterUrl: 'https://twitter.com/farmsking',
    linkedinUrl: 'https://linkedin.com/company/farmsking',
    telegramUrl: 'https://t.me/farmsking',
    whatsappChannelUrl: 'https://whatsapp.com/channel/farmsking',
    googleClientId: '',
  },
  otp: {
    deliveryMode: 'ANY_SINGLE',
    channelsEnabled: { email: true, sms: true, whatsapp: true },
    codeLength: 6,
    expirySeconds: 300,
    maxResendAttempts: 3,
    enableRateLimiting: true,
  },
  about: {
    companyName: 'FARMSKING TECHNOLOGIES PRIVATE LIMITED',
    brandName: 'FarmsKing',
    tagline: 'National Agritech Platform | AI Crop Doctor, Live Mandi, Organic Fertilizers & Floriculture',
    logoUrl: 'https://farmsking.in/assets/logo.png',
    faviconUrl: 'https://farmsking.in/favicon.ico',
    registeredAddress: 'VPO Goindwal Sahib, Tehsil Khadur Sahib, District Tarn Taran, Punjab - 143422, India',
    headquarters: 'Near Grain Market, Makhu, District Ferozepur, Punjab - 142044, India',
    gstin: '',
    cin: '',
    pan: '',
    fssaiLicense: '',
    supportEmail: 'support@farmsking.in',
    supportPhone: '+91 95776 22000',
    whatsappHelpline: '+91 95776 22000',
    grievanceOfficerName: 'Surinder Singh',
    grievanceOfficerEmail: 'grievance@farmsking.in',
    workingHours: 'Monday - Saturday: 9:00 AM - 7:00 PM IST',
    appVersion: '2.1.0',
  },
};

export function mergeSystemIntegrationsWithDefaults(
  remote?: Partial<SystemIntegrationsConfig> | null
): SystemIntegrationsConfig {
  if (!remote) return JSON.parse(JSON.stringify(DEFAULT_SYSTEM_INTEGRATIONS_CONFIG));

  return {
    ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG,
    ...remote,
    sms: {
      ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.sms,
      ...(remote.sms || {}),
      isEnabled: remote.sms?.isEnabled ?? DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.sms.isEnabled,
      providers: {
        ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.sms.providers,
        ...(remote.sms?.providers || {}),
      },
    },
    gateway: {
      ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway,
      ...(remote.gateway || {}),
      routing: {
        farmerPlanGateway: remote.gateway?.routing?.farmerPlanGateway ?? DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.routing.farmerPlanGateway,
        advisorBookingGateway: remote.gateway?.routing?.advisorBookingGateway ?? DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.routing.advisorBookingGateway,
        gardenStoreGateway: remote.gateway?.routing?.gardenStoreGateway ?? DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.routing.gardenStoreGateway,
        ecommerceStoreGateway: remote.gateway?.routing?.ecommerceStoreGateway ?? DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.routing.ecommerceStoreGateway,
      },
      moduleRules: {
        ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.moduleRules,
        ...(remote.gateway?.moduleRules || {}),
        farmerPlans: {
          ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.moduleRules!.farmerPlans,
          ...(remote.gateway?.moduleRules?.farmerPlans || {}),
          allowedMethods: {
            ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.moduleRules!.farmerPlans.allowedMethods,
            ...(remote.gateway?.moduleRules?.farmerPlans?.allowedMethods || {}),
          },
        },
        advisorBookings: {
          ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.moduleRules!.advisorBookings,
          ...(remote.gateway?.moduleRules?.advisorBookings || {}),
          allowedMethods: {
            ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.moduleRules!.advisorBookings.allowedMethods,
            ...(remote.gateway?.moduleRules?.advisorBookings?.allowedMethods || {}),
          },
        },
        gardenStore: {
          ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.moduleRules!.gardenStore,
          ...(remote.gateway?.moduleRules?.gardenStore || {}),
          allowedMethods: {
            ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.moduleRules!.gardenStore.allowedMethods,
            ...(remote.gateway?.moduleRules?.gardenStore?.allowedMethods || {}),
          },
        },
        ecommerceStore: {
          ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.moduleRules!.ecommerceStore,
          ...(remote.gateway?.moduleRules?.ecommerceStore || {}),
          allowedMethods: {
            ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.moduleRules!.ecommerceStore.allowedMethods,
            ...(remote.gateway?.moduleRules?.ecommerceStore?.allowedMethods || {}),
          },
        },
      },
      providers: {
        ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.providers,
        ...(remote.gateway?.providers || {}),
      },
    },
    whatsapp: {
      ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.whatsapp,
      ...(remote.whatsapp || {}),
      isEnabled: remote.whatsapp?.isEnabled ?? DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.whatsapp.isEnabled,
      providers: {
        ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.whatsapp.providers,
        ...(remote.whatsapp?.providers || {}),
      },
    },
    ai: {
      ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.ai,
      ...(remote.ai || {}),
      isEnabled: remote.ai?.isEnabled ?? DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.ai.isEnabled,
      providers: {
        ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.ai.providers,
        ...(remote.ai?.providers || {}),
      },
    },
    telecom: {
      ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.telecom,
      ...(remote.telecom || {}),
      isEnabled: remote.telecom?.isEnabled ?? DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.telecom.isEnabled,
      providers: {
        ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.telecom.providers,
        ...(remote.telecom?.providers || {}),
      },
    },
    weather: {
      ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.weather,
      ...(remote.weather || {}),
      isEnabled: remote.weather?.isEnabled ?? DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.weather.isEnabled,
      providers: {
        ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.weather.providers,
        ...(remote.weather?.providers || {}),
      },
    },
    satellite: {
      ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.satellite,
      ...(remote.satellite || {}),
      isEnabled: remote.satellite?.isEnabled ?? DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.satellite.isEnabled,
      providers: {
        ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.satellite.providers,
        ...(remote.satellite?.providers || {}),
      },
    },
    logistics: {
      ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.logistics,
      ...(remote.logistics || {}),
      isEnabled: remote.logistics?.isEnabled ?? DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.logistics.isEnabled,
      providers: {
        ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.logistics.providers,
        ...(remote.logistics?.providers || {}),
      },
    },
    push: {
      ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.push,
      ...(remote.push || {}),
      isEnabled: remote.push?.isEnabled ?? DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.push.isEnabled,
      providers: {
        ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.push.providers,
        ...(remote.push?.providers || {}),
      },
    },
    storage: {
      ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.storage,
      ...(remote.storage || {}),
      providers: {
        ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.storage.providers,
        ...(remote.storage?.providers || {}),
      },
    },
    product: {
      ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.product,
      ...(remote.product || {}),
    },
    socialMedia: {
      ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.socialMedia,
      ...(remote.socialMedia || {}),
    },
    otp: {
      ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.otp,
      ...(remote.otp || {}),
      channelsEnabled: {
        ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.otp.channelsEnabled,
        ...(remote.otp?.channelsEnabled || {}),
      },
    },
    about: {
      ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.about,
      ...(remote.about || {}),
    },
  };
}
