export type SupportedPaymentGateway = 'PHONEPE' | 'CASHFREE' | 'RAZORPAY' | 'PAYU' | 'STRIPE' | 'UPI_DIRECT' | 'PAYTM' | 'CCAVENUE' | 'INSTAMOJO' | 'EASEBUZZ';
export interface ModulePaymentFeatureConfig {
    gateway: SupportedPaymentGateway;
    checkoutMode: 'UPI_ONLY' | 'UPI_AND_NETBANKING' | 'ALL_METHODS' | 'CUSTOM';
    bypassPlayBilling: boolean;
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
            fast2sms: {
                apiKey: string;
                route: string;
                senderId: string;
                entityId: string;
            };
            msg91: {
                authKey: string;
                senderId: string;
                dltFlowId: string;
                route: string;
            };
            twilio: {
                accountSid: string;
                authToken: string;
                fromNumber: string;
            };
            textlocal: {
                apiKey: string;
                senderName: string;
            };
            gupshup: {
                userId: string;
                password: string;
                senderMask: string;
            };
            kaleyra?: {
                apiKey: string;
                sid: string;
                senderId: string;
            };
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
            customHttp: {
                endpointUrl: string;
                method: string;
                authHeaderKey: string;
                authHeaderValue: string;
                payloadTemplate: string;
            };
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
            phonepe: {
                merchantId: string;
                clientId: string;
                clientSecret: string;
                saltKey: string;
                saltIndex: string;
                webhookUsername: string;
                webhookPassword: string;
            };
            cashfree: {
                appId: string;
                secretKey: string;
                webhookSecret: string;
            };
            razorpay: {
                keyId: string;
                keySecret: string;
                webhookSecret: string;
            };
            payu: {
                merchantKey: string;
                merchantSalt: string;
            };
            stripe: {
                publishableKey: string;
                secretKey: string;
                webhookSecret: string;
            };
            upiDirect: {
                upiId: string;
                payeeName: string;
                merchantCode: string;
            };
            paytm?: {
                mid: string;
                merchantKey: string;
                website: string;
            };
            ccavenue?: {
                merchantId: string;
                accessCode: string;
                workingKey: string;
            };
            instamojo?: {
                apiKey: string;
                authToken: string;
                clientSecret: string;
            };
            easebuzz?: {
                merchantKey: string;
                salt: string;
                env: string;
            };
        };
    };
    whatsapp: {
        activeProvider: 'META_CLOUD' | 'BAILEYS_QR' | 'GUPSHUP' | 'WATI' | 'INTERAKT' | 'AISENSY' | 'TWILIO_WHATSAPP';
        isEnabled: boolean;
        providers: {
            metaCloud: {
                phoneNumberId: string;
                wabaId: string;
                accessToken: string;
                verifyToken: string;
                templateNamespace: string;
            };
            baileys: {
                autoReconnect: boolean;
                groupJid: string;
                sessionActive: boolean;
            };
            gupshup: {
                appName: string;
                appToken: string;
                sourceNumber: string;
            };
            wati: {
                endpointUrl: string;
                accessToken: string;
            };
            interakt: {
                apiKey: string;
            };
            aisensy?: {
                apiKey: string;
                campaignName: string;
            };
            twilioWhatsapp?: {
                accountSid: string;
                authToken: string;
                fromNumber: string;
            };
        };
    };
    ai: {
        activeProvider: 'GEMINI' | 'OPENAI' | 'CLAUDE' | 'LLAMA' | 'MISTRAL' | 'GROQ' | 'HUGGINGFACE';
        isEnabled: boolean;
        providers: {
            gemini: {
                apiKey: string;
                model: string;
                dailyQuota: number;
            };
            openai: {
                apiKey: string;
                model: string;
            };
            claude: {
                apiKey: string;
                model: string;
            };
            llama: {
                endpointUrl: string;
                apiKey: string;
            };
            mistral?: {
                apiKey: string;
                model: string;
            };
            groq?: {
                apiKey: string;
                model: string;
            };
            huggingface?: {
                apiKey: string;
                modelEndpoint: string;
            };
        };
    };
    telecom: {
        activeProvider: 'AGORA' | 'LIVEKIT' | 'HUNDRED_MS' | 'TWILIO_VIDEO' | 'DAILY_CO' | 'JITSI';
        isEnabled: boolean;
        providers: {
            agora: {
                appId: string;
                appCertificate: string;
                customerId: string;
                freeMinutesQuota: number;
            };
            livekit: {
                host: string;
                apiKey: string;
                apiSecret: string;
            };
            hundredMs?: {
                appId: string;
                appSecret: string;
                tokenEndpoint: string;
            };
            twilioVideo?: {
                accountSid: string;
                apiKey: string;
                apiSecret: string;
            };
            dailyCo?: {
                apiKey: string;
                domain: string;
            };
            jitsi?: {
                domain: string;
                appId: string;
                appSecret: string;
            };
        };
    };
    weather: {
        activeProvider: 'OPEN_METEO' | 'OPEN_WEATHER_MAP' | 'WEATHER_API' | 'IMD' | 'ACCUWEATHER' | 'TOMORROW_IO';
        isEnabled: boolean;
        providers: {
            openMeteo: {
                endpointUrl: string;
                autoSprayAlerts: boolean;
            };
            openWeatherMap: {
                apiKey: string;
            };
            weatherApi: {
                apiKey: string;
            };
            imd?: {
                apiKey: string;
                endpointUrl: string;
            };
            accuweather?: {
                apiKey: string;
            };
            tomorrowIo?: {
                apiKey: string;
            };
        };
    };
    satellite: {
        activeProvider: 'AGROMONITORING' | 'SENTINEL_HUB' | 'COPERNICUS' | 'GOOGLE_EARTH_ENGINE' | 'ISRO_BHUVAN' | 'PLANET_LABS';
        isEnabled: boolean;
        providers: {
            agromonitoring: {
                apiKey: string;
                autoSyncPolygons: boolean;
            };
            sentinelHub: {
                clientId: string;
                clientSecret: string;
                instanceId: string;
            };
            copernicus: {
                username: string;
                password: string;
                clientId: string;
            };
            googleEarthEngine: {
                serviceAccountEmail: string;
                privateKey: string;
                projectId: string;
            };
            isroBhuvan: {
                token: string;
                endpointUrl: string;
            };
            planetLabs: {
                apiKey: string;
            };
        };
    };
    logistics: {
        activeProvider: 'SHIPROCKET' | 'DELHIVERY' | 'NIMBUSPOST' | 'SHADOWFAX' | 'BLUEDART' | 'DTDC' | 'BORZO';
        isEnabled: boolean;
        providers: {
            shiprocket: {
                email: string;
                password: string;
                token: string;
                autoAssignCourier: boolean;
            };
            delhivery: {
                apiKey: string;
                clientName: string;
            };
            nimbuspost?: {
                email: string;
                password: string;
            };
            shadowfax?: {
                apiKey: string;
                clientCode: string;
            };
            bluedart?: {
                loginId: string;
                licenceKey: string;
                customerCode: string;
            };
            dtdc?: {
                customerId: string;
                apiKey: string;
            };
            borzo?: {
                authKey: string;
            };
        };
    };
    push: {
        activeProvider: 'FIREBASE_FCM' | 'ONE_SIGNAL' | 'PUSHER' | 'EXPO_PUSH';
        isEnabled: boolean;
        providers: {
            firebaseFcm: {
                serverKey: string;
                vapidKey: string;
                topicWeatherSiren: string;
                topicMandiAlerts: string;
            };
            oneSignal: {
                appId: string;
                apiKey: string;
            };
            pusher?: {
                appId: string;
                secret: string;
                instanceId: string;
            };
            expoPush?: {
                accessToken: string;
            };
        };
    };
    storage: {
        activeProvider: 'CLOUDFLARE_R2' | 'NEON_S3' | 'SUPABASE' | 'AWS_S3' | 'GOOGLE_GCS' | 'MINIO' | 'BUNNY_CDN';
        providers: {
            cloudflareR2: {
                accountId: string;
                accessKeyId: string;
                secretAccessKey: string;
                bucketName: string;
                publicUrl: string;
            };
            supabase: {
                projectUrl: string;
                anonKey: string;
                bucketName: string;
            };
            awsS3: {
                region: string;
                accessKeyId: string;
                secretAccessKey: string;
                bucketName: string;
            };
            googleGcs?: {
                bucketName: string;
                clientEmail: string;
                privateKey: string;
            };
            minio?: {
                endpoint: string;
                accessKey: string;
                secretKey: string;
                bucketName: string;
            };
            bunnyCdn?: {
                storageZoneName: string;
                accessKey: string;
                pullZoneUrl: string;
            };
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
        channelsEnabled: {
            email: boolean;
            sms: boolean;
            whatsapp: boolean;
        };
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
    projectMasterData?: ProjectMasterDataConfig;
}
export interface ProjectMasterDataConfig {
    companyLegalName: string;
    brandDisplayName: string;
    shortName: string;
    tagline: string;
    mcaSrn: string;
    crcApprovalStatus: string;
    crcApprovalDate: string;
    approvingAuthority: string;
    nicCodes: string;
    activityDescription: string;
    logoUrl: string;
    faviconUrl: string;
    premisesName: string;
    landmark: string;
    registeredAddress: string;
    operationalHq: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    rocJurisdiction: string;
    primaryMobile: string;
    alternateMobile: string;
    contactEmail: string;
    govtEmail: string;
    supportEmail: string;
    grievanceOfficerName: string;
    grievanceOfficerEmail: string;
    websiteUrl: string;
    dateFormat: string;
    timeFormat: string;
    timezone: string;
    currency: string;
    currencySymbol: string;
    themeColors: {
        primaryColor: string;
        secondaryColor: string;
        buttonColor: string;
    };
    socialMedia: {
        facebookUrl: string;
        instagramUrl: string;
        youtubeUrl: string;
        googleBusinessUrl: string;
        twitterUrl: string;
        linkedinUrl: string;
    };
    smtp: {
        host: string;
        port: number;
        encryption: 'ssl' | 'tls' | 'none';
        fromEmail: string;
        fromName: string;
        username: string;
        password: string;
    };
    emailTemplates: {
        registration: {
            subject: string;
            body: string;
        };
        otp: {
            subject: string;
            body: string;
        };
        feeReceipt: {
            subject: string;
            body: string;
        };
        resultPublished: {
            subject: string;
            body: string;
        };
        certificateIssued: {
            subject: string;
            body: string;
        };
    };
    otpLogin: {
        enabled: boolean;
        expiryMinutes: number;
        attemptsLimit: number;
        channels: {
            sms: boolean;
            whatsapp: boolean;
            email: boolean;
        };
    };
    maintenance: {
        enabled: boolean;
        message: string;
        storefrontMaintenance: boolean;
        scannerMaintenance: boolean;
        walletMaintenance: boolean;
    };
    taxGst: {
        enabled: boolean;
        gstNumber: string;
        taxPercentage: number;
        invoicePrefix: string;
        panNumber: string;
        hsnSacCode: string;
    };
    promotersAndCapital?: {
        authorizedEquityCapitalInr: number;
        authorizedSharesCount: number;
        faceValuePerShareInr: number;
        paidUpCapitalInr: number;
        firstDirectors: string;
        founderAndChiefAiArchitect: string;
        generalManager: string;
        leadAgronomists: string;
    };
    cropSessions?: {
        activeSessionName: string;
        activeSeasonType: 'RABI' | 'KHARIF' | 'ZAID' | 'ANNUAL';
        startDate: string;
        endDate: string;
        isDataIsolated: boolean;
        autoSwitchMandiRates: boolean;
        majorCrops: string;
    };
    backupSettings?: {
        autoBackupEnabled: boolean;
        frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
        retentionDays: number;
        storageTarget: 'R2_AND_LOCAL' | 'R2_ONLY' | 'LOCAL_ONLY';
        lastBackupTimestamp: string;
        encryptionStandard: string;
    };
    certificateConfig?: {
        certificatePrefix: string;
        verificationPortalUrl: string;
        requireApproval: boolean;
        digitalQrEnabled: boolean;
        defaultValidityYears: number;
        certificateAuthority: string;
    };
    franchiseRules?: {
        mandiAgentCommissionPercent: number;
        dealerAreaAllocationType: 'VILLAGE' | 'TEHSIL' | 'DISTRICT';
        centralizedApprovalRequired: boolean;
        securityDepositInr: number;
        minimumMonthlyTurnoverInr: number;
    };
}
export declare const DEFAULT_PROJECT_MASTER_DATA: ProjectMasterDataConfig;
export declare const DEFAULT_INTEGRATIONS_CONFIG: SystemIntegrationsConfig;
