export interface SubCategoryFlag {
  namePa: string;
  nameEn: string;
  enabled: boolean;
}

export interface CategoryFlag {
  namePa: string;
  nameEn: string;
  enabled: boolean;
  subCategories: Record<string, SubCategoryFlag>;
}

export type FeatureFlagsMap = Record<string, CategoryFlag>;

export const DEFAULT_FEATURE_FLAGS: FeatureFlagsMap = {
  user_accounts: {
    namePa: 'ਯੂਜ਼ਰ ਅਤੇ ਖਾਤਾ ਪ੍ਰਬੰਧਨ',
    nameEn: 'User Accounts & Auth Domain',
    enabled: true,
    subCategories: {
      auth: { namePa: 'ਲੌਗਇਨ ਤੇ ਰਜਿਸਟ੍ਰੇਸ਼ਨ', nameEn: 'Authentication', enabled: true },
      users: { namePa: 'ਯੂਜ਼ਰ ਪ੍ਰੋਫਾਈਲ', nameEn: 'User Profiles', enabled: true },
      addresses: { namePa: 'ਐਡਰੈੱਸ ਬੁੱਕ', nameEn: 'Address Book', enabled: true },
      audit: { namePa: 'ਆਡਿਟ ਤੇ ਸੁਰੱਖਿਆ', nameEn: 'Audit Logs', enabled: true },
      uploads: { namePa: 'ਅਪਲੋਡਜ਼ ਸਿਸਟਮ', nameEn: 'File Uploads', enabled: true },
    },
  },
  farmer_operations: {
    namePa: 'ਕਿਸਾਨ ਅਤੇ ਖੇਤੀਬਾੜੀ ਮੋਡਿਊਲ',
    nameEn: 'Farmer & Agriculture Domain',
    enabled: true,
    subCategories: {
      farms: { namePa: 'ਮੇਰੇ ਖੇਤ ਤੇ ਪਲਾਟ', nameEn: 'Farms & Plots', enabled: true },
      crops: { namePa: 'ਐਕਟਿਵ ਫਸਲਾਂ', nameEn: 'Crop Cycles', enabled: true },
      cropProblems: { namePa: 'ਫਸਲ ਦੀਆਂ ਬੀਮਾਰੀਆਂ', nameEn: 'Crop Problems', enabled: true },
      spraySchedules: { namePa: 'ਛਿੜਕਾਅ ਸ਼ਡਿਊਲ', nameEn: 'Spray Schedules', enabled: true },
      labour: { namePa: 'ਮਜ਼ਦੂਰ ਰਿਕਾਰਡ', nameEn: 'Labour & Wages', enabled: true },
      expenses: { namePa: 'ਖੇਤ ਦੇ ਖਰਚੇ', nameEn: 'Farm Expenses', enabled: true },
    },
  },
  shopping: {
    namePa: 'ਸ਼ਾਪਿੰਗ ਅਤੇ ਆਰਡਰ ਸਿਸਟਮ',
    nameEn: 'Shopping & E-Commerce Domain',
    enabled: true,
    subCategories: {
      products: { namePa: 'ਪ੍ਰੋਡਕਟ ਲਿਸਟਿੰਗ', nameEn: 'Products Catalog', enabled: true },
      orders: { namePa: 'ਆਰਡਰ ਮੈਨੇਜਮੈਂਟ', nameEn: 'Customer Orders', enabled: true },
      saleBills: { namePa: 'ਸੇਲ ਬਿੱਲ', nameEn: 'Digital Sale Bills', enabled: true },
      parties: { namePa: 'ਆੜ੍ਹਤੀ ਤੇ ਖਾਤੇ', nameEn: 'Parties & Ledger', enabled: true },
      paymentReceipts: { namePa: 'ਪੇਮੈਂਟ ਰਸੀਦਾਂ', nameEn: 'Payment Receipts', enabled: true },
    },
  },
  advisor_support: {
    namePa: 'ਐਡਵਾਈਜ਼ਰ ਅਤੇ ਸਲਾਹਕਾਰੀ',
    nameEn: 'Advisor & Support Domain',
    enabled: true,
    subCategories: {
      advisorAssignment: { namePa: 'ਐਡਵਾਈਜ਼ਰ ਅਸਾਈਨਮੈਂਟ', nameEn: 'Advisor Assignment', enabled: true },
      advisorChat: { namePa: 'ਐਡਵਾਈਜ਼ਰ ਚੈਟ', nameEn: 'Advisor Live Chat', enabled: true },
      callRequests: { namePa: 'ਕਾਲ ਰਿਕਵੈਸਟ', nameEn: 'Call Requests', enabled: true },
      adminChat: { namePa: 'ਐਡਮਿਨ ਹੈਲਪਲਾਈਨ', nameEn: 'Admin Support Chat', enabled: true },
    },
  },
  coupons_financial: {
    namePa: 'ਕੂਪਨ, ਪਲਾਨ ਅਤੇ ਵਿੱਤੀ ਮੋਡਿਊਲ',
    nameEn: 'Coupons, Plans & Financial Domain',
    enabled: true,
    subCategories: {
      coupons: { namePa: 'ਡਿਸਕਾਊਂਟ ਕੂਪਨ', nameEn: 'Coupons System', enabled: true },
      subscriptions: { namePa: 'ਸਬਸਕ੍ਰਿਪਸ਼ਨ ਪਲਾਨ', nameEn: 'Subscription Plans', enabled: true },
      planPayments: { namePa: 'ਪਲਾਨ ਪੇਮੈਂਟਸ', nameEn: 'Plan Payments & UPI', enabled: true },
      wallet: { namePa: 'ਮਾਈ ਵਾਲੇਟ', nameEn: 'My Wallet', enabled: true },
      withdrawals: { namePa: 'ਪੈਸੇ ਕਢਵਾਉਣਾ', nameEn: 'Withdrawals', enabled: true },
      phonepe: { namePa: 'PhonePe ਗੇਟਵੇਅ', nameEn: 'PhonePe Integration', enabled: true },
    },
  },
  telephony_comm: {
    namePa: 'ਕਾਲਿੰਗ ਅਤੇ ਵਟਸਐਪ ਸਿਸਟਮ',
    nameEn: 'Telephony & Communication Domain',
    enabled: true,
    subCategories: {
      whatsapp: { namePa: 'ਵਟਸਐਪ ਮੈਸੇਜਿੰਗ', nameEn: 'WhatsApp Bot & Sync', enabled: true },
      voiceCall: { namePa: 'ਆਡੀਓ ਕਾਲਿੰਗ', nameEn: 'Group Voice Call', enabled: true },
      voiceAi: { namePa: 'ਵਾਇਸ AI', nameEn: 'Voice AI Automated Calls', enabled: true },
      notifications: { namePa: 'ਪੁਸ਼ ਨੋਟੀਫਿਕੇਸ਼ਨ', nameEn: 'Push Notifications', enabled: true },
    },
  },
  weather_intelligence: {
    namePa: 'ਮੌਸਮ ਅਤੇ ਸੈਟੇਲਾਇਟ',
    nameEn: 'Weather & Satellite Intelligence',
    enabled: true,
    subCategories: {
      weather: { namePa: 'ਲਾਈਵ ਮੌਸਮ', nameEn: 'Live Weather Forecast', enabled: true },
      satellite: { namePa: 'ਸੈਟੇਲਾਇਟ ਫਸਲ ਨਿਗਰਾਨੀ', nameEn: 'Satellite NDVI Scans', enabled: true },
      mandiAi: { namePa: 'ਮੰਡੀ AI ਤੇ ਭਾਅ', nameEn: 'Mandi AI & Rates', enabled: true },
    },
  },
  system_infra: {
    namePa: 'ਸਿਸਟਮ ਅਤੇ ਬੈਕਅੱਪ',
    nameEn: 'System & Infrastructure Domain',
    enabled: true,
    subCategories: {
      appSettings: { namePa: 'ਐਪ ਸੈਟਿੰਗਜ਼', nameEn: 'App Settings', enabled: true },
      driveBackup: { namePa: 'ਡਰਾਈਵ ਬੈਕਅੱਪ', nameEn: 'Drive Database Backup', enabled: true },
      referrals: { namePa: 'ਰੈਫਰਲ ਸਿਸਟਮ', nameEn: 'Referrals System', enabled: true },
    },
  },
};
