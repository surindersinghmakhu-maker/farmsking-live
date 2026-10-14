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

export const DEFAULT_INTEGRATIONS_CONFIG: SystemIntegrationsConfig = {
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
      customHttp: { endpointUrl: '', method: 'POST', authHeaderKey: 'Authorization', authHeaderValue: '', payloadTemplate: '{"to":"{{mobile}}","text":"{{message}}"}' },
    },
  },
  gateway: {
    activeGateway: 'PHONEPE',
    isSandbox: true,
    providers: {
      phonepe: {
        merchantId: 'M22KMYD10AWD8_2607081836',
        clientId: 'M22KMYD10AWD8_2607081836',
        clientSecret: 'NTE0ODVkOGItZGFjNy00YTI3LWJlYjMtY2ViY2U1NWJhZmJl',
        saltKey: 'NTE0ODVkOGItZGFjNy00YTI3LWJlYjMtY2ViY2U1NWJhZmJl',
        saltIndex: '1',
        webhookUsername: 'farmsking_webhook',
        webhookPassword: '40dafb8d81cea253a8ca8a6f0b138eea',
      },
      cashfree: {
        appId: 'TEST11182203ad31d550761a69a282c430228111',
        secretKey: 'cfsk_ma_test_74368f9d19447b368a82aedc492b16a2_6e200fe7',
        webhookSecret: '',
      },
      razorpay: { keyId: '', keySecret: '', webhookSecret: '' },
      payu: { merchantKey: '', merchantSalt: '' },
      stripe: { publishableKey: '', secretKey: '', webhookSecret: '' },
      upiDirect: { upiId: 'surindersinghmakhu-8@okicici', payeeName: 'FarmsKing India', merchantCode: '0000' },
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
    },
  },
  product: {
    platformFeePercent: 5.0,
    defaultGstPercent: 5.0,
    freeDeliveryThreshold: 499,
    baseShippingCharge: 40,
    lowStockThreshold: 5,
    returnReplacementDays: 7,
    enableCod: true,
    allowDirectSales: false,
    autoApproveReviews: false,
    requireKycForSellers: true,
  },
  socialMedia: {
    facebookUrl: 'https://facebook.com/farmsking.india',
    instagramUrl: 'https://instagram.com/farmsking.india',
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
    maxResendAttempts: 5,
    enableRateLimiting: true,
  },
  about: {
    companyName: 'FarmsKing India Pvt Ltd',
    brandName: 'FarmsKing',
    tagline: 'Direct Farmer Marketplace for All India | Headquartered in Makhu, Punjab',
    logoUrl: 'https://farmsking.in/assets/logo.png',
    faviconUrl: 'https://farmsking.in/favicon.ico',
    registeredAddress: 'Near Bus Stand, Makhu, Tehsil Zira, District Ferozepur, Punjab 142044',
    headquarters: 'Makhu Town, District Ferozepur, Punjab, India',
    gstin: '03AAAAF0000A1Z5',
    cin: 'U01100PB2026PTC000000',
    pan: 'AAAAF0000A',
    fssaiLicense: '10023064000123',
    supportEmail: 'support@farmsking.in',
    supportPhone: '+91 98888 12345',
    whatsappHelpline: '+91 98888 12345',
    grievanceOfficerName: 'Surinder Singh',
    grievanceOfficerEmail: 'grievance@farmsking.in',
    workingHours: 'Monday - Saturday: 9:00 AM - 6:00 PM IST',
    appVersion: '2.0.6',
  },
};
