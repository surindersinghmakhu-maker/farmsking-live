import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';
import { DEFAULT_FEATURE_FLAGS, FeatureFlagsMap } from '../../common/constants/feature-flags.constant';
import { DEFAULT_INTEGRATIONS_CONFIG, SystemIntegrationsConfig } from './constants/system-integrations.constant';

const SINGLETON_ID = 'default';

@Injectable()
export class AppSettingsService {
  private cache: { data: any; timestamp: number } | null = null;
  private readonly CACHE_TTL_MS = 15000;

  constructor(private readonly prisma: PrismaService) {}

  clearCache() {
    this.cache = null;
  }

  async getSeo() {
    const settings = await this.get();
    const flags = ((settings as any).featureFlags as Record<string, any>) || {};
    const seo = flags.seoSettings || {};
    return {
      seoTitle: seo.seoTitle || (settings as any).seoTitle || "FarmsKing: Smart Farming Platform & Agriculture App India | Farming Easy, Farming Smart (farmsking.in)",
      metaDescription: seo.metaDescription || (settings as any).metaDescription || "FarmsKing (farmsking.in) is India's premier Smart Farming Platform & Agriculture App. Farming Easy, Farming Smart. Access real-time AI Crop Doctor pathology, live APMC mandi rates across 50+ crops, satellite crop telemetry, certified organic inputs, and farm bahi-khata for farmers across India.",
      metaKeywords: seo.metaKeywords || (settings as any).metaKeywords || "FarmsKing, farmsking.in, farmsking app, farmsking platform, farmsking india, farmsking farmers, smart farming, farming easy farming smart, smart farming app, smart farming platform india, smart agriculture india, AI Crop Doctor, live mandi rates, kisan app, Punjab kheti, digital agriculture India, Garden King, Nature King, AI King, Organic King, Account King, Pure Organic Food, Zero Fake Products, No Hardware Sales, No Equipment Rental, Rare Technology Agritech, Real Human Agronomy Service, Live Plants Delivery, Makhu, Goindwal Sahib, Punjab",
      locationHeadquarters: seo.locationHeadquarters || (settings as any).locationHeadquarters || "Registered Office: Goindwal Sahib, Tarn Taran - 143422 | Operational Office: Makhu, Ferozepur, Punjab - 142044",
      noscriptHtmlContent: seo.noscriptHtmlContent || (settings as any).noscriptHtmlContent || "🌾 FarmsKing: Smart Farming Platform & Agriculture App India | Farming Easy, Farming Smart (farmsking.in). FarmsKing Technologies Private Limited is India's leading Smart Farming Platform and Agriculture App. Guided by the motto 'Farming Easy, Farming Smart', FarmsKing empowers Indian farmers and plant lovers with multimodal AI Crop Doctor pathology, live APMC wholesale mandi rates across 50+ crops, 6-constellation satellite remote sensing, certified organic bio-fertilizers, and transparent digital bahi-khata accounting. Headquartered in Makhu (Punjab) with registered office in Goindwal Sahib. Board of Directors: Bakshish Singh and Gagandeep Kaur; Lead Founder & Chief AI Architect: Surinder Singh; General Manager: Gurnam Singh; Tech Support: Engg. Gurdit Singh.",
    };
  }

  async updateSeo(dto: { seoTitle?: string; metaDescription?: string; metaKeywords?: string; locationHeadquarters?: string; noscriptHtmlContent?: string }) {
    this.clearCache();
    const settings = await this.get();
    const flags = ((settings as any).featureFlags as Record<string, any>) || {};
    const updatedFlags = {
      ...flags,
      seoSettings: {
        ...(flags.seoSettings || {}),
        ...dto,
      },
    };
    return this.prisma.appSetting.upsert({
      where: { id: SINGLETON_ID },
      create: {
        id: SINGLETON_ID,
        featureFlags: updatedFlags as any,
      },
      update: {
        featureFlags: updatedFlags as any,
      },
    });
  }

  async get() {
    const now = Date.now();
    if (this.cache && now - this.cache.timestamp < this.CACHE_TTL_MS) {
      return this.cache.data;
    }

    const settings = await this.prisma.appSetting.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: {
        id: SINGLETON_ID,
        upiId: 'surindersinghmakhu-5@oksbi',
        upiPayeeName: 'Surinder Singh',
      },
    });

    let logoUrl = settings.logoUrl;
    if (!logoUrl) {
      const superAdmin = await this.prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN', deletedAt: null },
        select: { photoUrl: true },
      });
      if (superAdmin?.photoUrl) {
        logoUrl = superAdmin.photoUrl;
      }
    }

    const flags = ((settings as any).featureFlags as Record<string, any>) || {};
    let faviconUrl = flags.faviconUrl;
    if (!faviconUrl || !logoUrl) {
      try {
        const integrations = await this.getIntegrations();
        if (!faviconUrl) {
          faviconUrl = integrations?.projectMasterData?.faviconUrl || 'https://farmsking.in/favicon.ico';
        }
        if (!logoUrl) {
          logoUrl = integrations?.projectMasterData?.logoUrl || logoUrl;
        }
      } catch {
        if (!faviconUrl) faviconUrl = 'https://farmsking.in/favicon.ico';
      }
    }

    const result = {
      ...settings,
      logoUrl,
      faviconUrl: faviconUrl || 'https://farmsking.in/favicon.ico',
      upiId: settings.upiId || 'surindersinghmakhu-5@oksbi',
      upiPayeeName: settings.upiPayeeName || 'Surinder Singh',
      referralSignupBonusAmount: (settings as any).referralSignupBonusAmount ?? 10,
      newUserSignupBonusAmount: (settings as any).newUserSignupBonusAmount ?? 10,
      referralPaidPlanBonusAmount: (settings as any).referralPaidPlanBonusAmount ?? 50,
      partnerReferralCommissionAmount: (settings as any).partnerReferralCommissionAmount ?? 100,
      partnerRefereeSignupBonusAmount: (settings as any).partnerRefereeSignupBonusAmount ?? 20,
      partnerReferralPaidPlanBonusAmount: (settings as any).partnerReferralPaidPlanBonusAmount ?? 100,
      referralOfferSchemeEnabled: (settings as any).referralOfferSchemeEnabled ?? false,
      referralOfferExpiryDate: (settings as any).referralOfferExpiryDate || '2026-12-31',
      referralOfferSchemeName: (settings as any).referralOfferSchemeName || 'Standard Welcome & Referral Offer',
      referralOfferReferrerBonus: (settings as any).referralOfferReferrerBonus ?? 1,
      referralOfferNewUserBonus: (settings as any).referralOfferNewUserBonus ?? 5,
      referralOfferPaidPlanBonus: (settings as any).referralOfferPaidPlanBonus ?? 9,
      partnerOfferSchemeEnabled: (settings as any).partnerOfferSchemeEnabled ?? false,
      partnerOfferExpiryDate: (settings as any).partnerOfferExpiryDate || '2026-12-31',
      partnerOfferSchemeName: (settings as any).partnerOfferSchemeName || 'Business Partner Referral Scheme',
      partnerOfferReferrerBonus: (settings as any).partnerOfferReferrerBonus ?? 100,
      partnerOfferNewUserBonus: (settings as any).partnerOfferNewUserBonus ?? 20,
      partnerOfferPaidPlanBonus: (settings as any).partnerOfferPaidPlanBonus ?? 100,
      storefrontMaintenanceMode: (settings as any).storefrontMaintenanceMode ?? false,
      agriMaintenanceMode: (settings as any).agriMaintenanceMode ?? false,
      gardenMaintenanceMode: (settings as any).gardenMaintenanceMode ?? false,
      walletMaintenanceMode: (settings as any).walletMaintenanceMode ?? false,
      trainerMaintenanceMode: (settings as any).trainerMaintenanceMode ?? false,
      freeTrialEnabled: (settings as any).freeTrialEnabled ?? true,
      freeTrialDays: (settings as any).freeTrialDays ?? 10,
      freeTrialPlan: ((settings as any).freeTrialPlan === 'FARMER_FREE' || !(settings as any).freeTrialPlan) ? 'SUPER' : (settings as any).freeTrialPlan,
      gardenExpertPlatformFeePercent: (settings as any).gardenExpertPlatformFeePercent ?? 20.0,
      gardenerProCardPrice: (settings as any).gardenerProCardPrice ?? 299.00,
      gardenerVipCardPrice: (settings as any).gardenerVipCardPrice ?? 999.00,
      allowDirectPlatformSales: (settings as any).allowDirectPlatformSales ?? false,
      withdrawalPlatformFeePercent: (settings as any).withdrawalPlatformFeePercent ?? 2.0,
      withdrawalGstPercent: (settings as any).withdrawalGstPercent ?? 18.0,
      walletUsagePlatformFeePercent: (settings as any).walletUsagePlatformFeePercent ?? 2.0,
      walletUsageGstPercent: (settings as any).walletUsageGstPercent ?? 18.0,
      walletTaxEnabled: (settings as any).walletTaxEnabled ?? true,
    };

    this.cache = { data: result, timestamp: now };
    return result;
  }

  /** Real contact details for the "Support"/"Contact Us" screens — pulled from Project Master Data, AppSetting or live Super Admin account. */
  async getSupportContact() {
    const settings = await this.get();
    const integrations = await this.getIntegrations();
    const pm = integrations?.projectMasterData || DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!;

    let name = (settings as any)?.adminName;
    let mobile = (settings as any)?.adminMobile;
    let email = (settings as any)?.adminEmail;

    if (!mobile || !name || !email) {
      const superAdmin = await this.prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN', deletedAt: null },
        select: { name: true, mobile: true, email: true },
        orderBy: { createdAt: 'asc' },
      });
      if (superAdmin) {
        name = name || superAdmin.name || 'Surinder Singh (Super Admin)';
        mobile = mobile || superAdmin.mobile || '+91 95776-22000';
        email = email || superAdmin.email || 'farmskingindia@gmail.com';
      }
    }

    const companyLegalName = pm.companyLegalName || 'FARMSKING TECHNOLOGIES PRIVATE LIMITED';
    const helplinePhone = pm.primaryMobile || mobile || '+91 95776-22000';
    const supportEmail = pm.contactEmail || pm.supportEmail || email || 'farmskingindia@gmail.com';
    const registeredAddress = pm.registeredAddress || 'M/s GURU NANAK COMPUTER ACADEMY, Near Co-operative Bank, Goindwal Sahib, Tehsil Khadoor Sahib, District Tarn Taran, Punjab - 143422, India';
    const operationalHqAddress = pm.operationalHq || 'Main Market, Makhu, Tehsil Zira, District Ferozepur, Punjab - 142044, India';

    const appDownloadUrl = (settings as any)?.appDownloadUrl || (pm as any)?.appDownloadUrl || 'https://www.farmsking.in';

    const supportFaviconUrl = (settings as any)?.faviconUrl || (settings as any)?.featureFlags?.faviconUrl || pm.faviconUrl || 'https://farmsking.in/favicon.ico';
    const supportLogoUrl = (settings as any)?.logoUrl || pm.logoUrl || 'https://farmsking.in/assets/logo.png';

    return {
      name: name || 'FarmsKing Executive Support',
      mobile: helplinePhone,
      email: supportEmail,
      helplinePhone,
      supportEmail,
      logoUrl: supportLogoUrl,
      faviconUrl: supportFaviconUrl,
      companyLegalName,
      registeredAddress,
      operationalHqAddress,
      websiteUrl: pm.websiteUrl || 'https://www.farmsking.in',
      appDownloadUrl,
      mcaSrn: pm.mcaSrn || 'AC6979718',
    };
  }

  /** Public-safe Project Master Data & Entity info (Zero private KYC, strictly public statutory & operational parameters) */
  async getPublicMasterData() {
    const integrations = await this.getIntegrations();
    const pm = integrations?.projectMasterData || DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!;
    return {
      companyLegalName: pm.companyLegalName,
      brandDisplayName: pm.brandDisplayName,
      shortName: pm.shortName,
      tagline: pm.tagline,
      logoUrl: pm.logoUrl || 'https://farmsking.in/assets/logo.png',
      faviconUrl: pm.faviconUrl || 'https://farmsking.in/favicon.ico',
      mcaSrn: pm.mcaSrn,
      crcApprovalStatus: pm.crcApprovalStatus,
      crcApprovalDate: pm.crcApprovalDate,
      approvingAuthority: pm.approvingAuthority,
      nicCodes: pm.nicCodes,
      activityDescription: pm.activityDescription,
      registeredAddress: pm.registeredAddress,
      operationalHq: pm.operationalHq,
      primaryMobile: pm.primaryMobile,
      alternateMobile: pm.alternateMobile,
      contactEmail: pm.contactEmail,
      govtEmail: pm.govtEmail,
      supportEmail: pm.supportEmail,
      websiteUrl: pm.websiteUrl,
      socialMedia: pm.socialMedia,
      promotersAndCapital: {
        authorizedEquityCapitalInr: pm.promotersAndCapital?.authorizedEquityCapitalInr,
        authorizedSharesCount: pm.promotersAndCapital?.authorizedSharesCount,
        faceValuePerShareInr: pm.promotersAndCapital?.faceValuePerShareInr,
        paidUpCapitalInr: pm.promotersAndCapital?.paidUpCapitalInr,
        firstDirectors: pm.promotersAndCapital?.firstDirectors,
        founderAndChiefAiArchitect: pm.promotersAndCapital?.founderAndChiefAiArchitect,
        generalManager: pm.promotersAndCapital?.generalManager,
        leadAgronomists: pm.promotersAndCapital?.leadAgronomists,
      },
      cropSessions: {
        activeSessionName: pm.cropSessions?.activeSessionName,
        activeSeasonType: pm.cropSessions?.activeSeasonType,
        startDate: pm.cropSessions?.startDate,
        endDate: pm.cropSessions?.endDate,
        isDataIsolated: pm.cropSessions?.isDataIsolated,
        autoSwitchMandiRates: pm.cropSessions?.autoSwitchMandiRates,
        majorCrops: pm.cropSessions?.majorCrops,
      },
      branding: {
        primaryColor: pm.themeColors?.primaryColor,
        secondaryColor: pm.themeColors?.secondaryColor,
        buttonColor: pm.themeColors?.buttonColor,
        logoUrl: pm.logoUrl,
        faviconUrl: pm.faviconUrl,
      },
      operational: {
        currency: pm.currency,
        currencySymbol: pm.currencySymbol,
        timezone: pm.timezone,
        dateFormat: pm.dateFormat,
        timeFormat: pm.timeFormat,
        taxGstEnabled: pm.taxGst?.enabled,
        taxPercentage: pm.taxGst?.taxPercentage,
        invoicePrefix: pm.taxGst?.invoicePrefix,
        gstNumber: pm.taxGst?.gstNumber,
        panNumber: pm.taxGst?.panNumber,
        hsnSacCode: pm.taxGst?.hsnSacCode,
      },
      certificates: pm.certificateConfig,
      franchise: pm.franchiseRules,
      backup: {
        autoBackupEnabled: pm.backupSettings?.autoBackupEnabled,
        frequency: pm.backupSettings?.frequency,
        storageTarget: pm.backupSettings?.storageTarget,
        retentionDays: pm.backupSettings?.retentionDays,
        lastBackupTimestamp: pm.backupSettings?.lastBackupTimestamp,
      },
    };
  }

  async update(admin: AuthUser, dto: UpdateAppSettingsDto) {
    this.clearCache();
    const fields: Record<string, unknown> = {};
    const keys: (keyof UpdateAppSettingsDto)[] = [
      'appName',
      'logoUrl',
      'faviconUrl',
      'tagline',
      'upiId',
      'upiPayeeName',
      'adminName',
      'adminMobile',
      'adminEmail',
      'groupVoiceCallEnabled',
      'whatsappGroupSyncEnabled',
      'whatsappAutoAddEnabled',
      'whatsappAutoRemoveEnabled',
      'whatsappGroupJid',
      'otpDeliveryChannel',
      'referralSignupBonusAmount',
      'newUserSignupBonusAmount',
      'referralPaidPlanBonusAmount',
      'partnerReferralCommissionAmount',
      'partnerRefereeSignupBonusAmount',
      'partnerReferralPaidPlanBonusAmount',
      'referralOfferSchemeEnabled',
      'referralOfferExpiryDate',
      'referralOfferSchemeName',
      'referralOfferReferrerBonus',
      'referralOfferNewUserBonus',
      'referralOfferPaidPlanBonus',
      'partnerOfferSchemeEnabled',
      'partnerOfferExpiryDate',
      'partnerOfferSchemeName',
      'partnerOfferReferrerBonus',
      'partnerOfferNewUserBonus',
      'partnerOfferPaidPlanBonus',
      'appDownloadUrl',
      'latestAppVersion',
      'storefrontMaintenanceMode',
      'agriMaintenanceMode',
      'gardenMaintenanceMode',
      'walletMaintenanceMode',
      'trainerMaintenanceMode',
      'freeTrialEnabled',
      'freeTrialDays',
      'freeTrialPlan',
      'gardenExpertPlatformFeePercent',
      'gardenerProCardPrice',
      'gardenerVipCardPrice',
      'allowDirectPlatformSales',
      'withdrawalPlatformFeePercent',
      'withdrawalGstPercent',
      'walletUsagePlatformFeePercent',
      'walletUsageGstPercent',
      'walletTaxEnabled',
    ];

    for (const key of keys) {
      if (dto[key] !== undefined) fields[key] = dto[key];
    }

    if (dto.adminName !== undefined || dto.adminMobile !== undefined || dto.adminEmail !== undefined || dto.upiId !== undefined || dto.logoUrl !== undefined || dto.appName !== undefined || dto.tagline !== undefined) {
      try {
        const userData: Record<string, unknown> = {};
        if (dto.adminName !== undefined) userData.name = dto.adminName;
        if (dto.adminEmail !== undefined) userData.email = dto.adminEmail;
        if (dto.upiId !== undefined) userData.upiId = dto.upiId;
        if (dto.tagline !== undefined) userData.bio = dto.tagline;
        if (dto.appName !== undefined) userData.specialization = dto.appName;
        if (dto.logoUrl !== undefined) userData.photoUrl = dto.logoUrl;

        // If adminMobile is specified, handle unique constraint gracefully
        if (dto.adminMobile !== undefined && dto.adminMobile) {
          const targetMobile = dto.adminMobile.trim();
          const targetUserId = admin?.id;

          // Check if another user has this mobile number
          const existingOwner = await this.prisma.user.findFirst({
            where: { mobile: targetMobile },
            select: { id: true, role: true },
          });

          if (existingOwner && existingOwner.id !== targetUserId) {
            // Free up mobile number on conflicting secondary account by appending prefix
            await this.prisma.user.update({
              where: { id: existingOwner.id },
              data: { mobile: `${targetMobile}_old_${Date.now().toString().slice(-4)}` },
            }).catch(() => {});
          }

          userData.mobile = targetMobile;
        }

        if (Object.keys(userData).length > 0) {
          // Update performing admin user record
          if (admin && admin.id) {
            await this.prisma.user.update({
              where: { id: admin.id },
              data: userData as any,
            }).catch((err) => console.warn('Could not update admin user:', err));
          }

          // Update non-unique fields on all SUPER_ADMIN records
          const { mobile, ...nonUniqueUserData } = userData;
          if (Object.keys(nonUniqueUserData).length > 0) {
            await this.prisma.user.updateMany({
              where: { role: 'SUPER_ADMIN', deletedAt: null },
              data: nonUniqueUserData as any,
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Could not update super admin user contact details in User table:', err);
      }
    }

    const ALLOWED_PRISMA_FIELDS = new Set([
      'appName',
      'logoUrl',
      'tagline',
      'upiId',
      'upiPayeeName',
      'adminName',
      'adminMobile',
      'adminEmail',
      'groupVoiceCallEnabled',
      'whatsappGroupSyncEnabled',
      'whatsappAutoAddEnabled',
      'whatsappAutoRemoveEnabled',
      'whatsappGroupJid',
      'otpDeliveryChannel',
      'referralSignupBonusAmount',
      'newUserSignupBonusAmount',
      'referralPaidPlanBonusAmount',
      'partnerReferralCommissionAmount',
      'appDownloadUrl',
      'latestAppVersion',
      'storefrontMaintenanceMode',
      'agriMaintenanceMode',
      'gardenMaintenanceMode',
      'walletMaintenanceMode',
      'trainerMaintenanceMode',
      'freeTrialEnabled',
      'freeTrialDays',
      'freeTrialPlan',
      'gardenExpertPlatformFeePercent',
      'gardenerProCardPrice',
      'gardenerVipCardPrice',
      // Wallet Tax / Platform Expense fields
      'withdrawalPlatformFeePercent',
      'withdrawalGstPercent',
      'walletUsagePlatformFeePercent',
      'walletUsageGstPercent',
      'walletTaxEnabled',
      'featureFlags',
    ]);

    const prismaPayload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (ALLOWED_PRISMA_FIELDS.has(k)) {
        prismaPayload[k] = v;
      }
    }

    if (dto.faviconUrl !== undefined) {
      try {
        const existing = await this.prisma.appSetting.findUnique({ where: { id: SINGLETON_ID } });
        const currentFlags = ((existing as any)?.featureFlags as Record<string, any>) || {};
        prismaPayload['featureFlags'] = {
          ...currentFlags,
          faviconUrl: dto.faviconUrl,
        };
      } catch (err) {
        console.warn('Could not update featureFlags.faviconUrl in AppSetting:', err);
      }
    }

    if (dto.logoUrl !== undefined || dto.faviconUrl !== undefined) {
      try {
        const integrations = await this.getIntegrations();
        if (integrations?.projectMasterData) {
          const pm = { ...integrations.projectMasterData };
          if (dto.logoUrl !== undefined) pm.logoUrl = dto.logoUrl;
          if (dto.faviconUrl !== undefined) pm.faviconUrl = dto.faviconUrl;
          await this.updateIntegrations(admin, { ...integrations, projectMasterData: pm });
        }
      } catch (err) {
        console.warn('Could not sync integrations projectMasterData with brand assets:', err);
      }
    }

    try {
      return await this.prisma.appSetting.upsert({
        where: { id: SINGLETON_ID },
        create: { id: SINGLETON_ID, ...prismaPayload, updatedById: admin?.id },
        update: { ...prismaPayload, updatedById: admin?.id },
      });
    } catch (err: any) {
      if (err?.message?.includes('Unknown argument')) {
        console.warn('Handling Prisma Unknown argument in AppSetting upsert, falling back to safe payload:', err?.message);
        const safePayload: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(prismaPayload)) {
          if (!err.message.includes(k)) {
            safePayload[k] = v;
          }
        }
        return this.prisma.appSetting.upsert({
          where: { id: SINGLETON_ID },
          create: { id: SINGLETON_ID, ...safePayload, updatedById: admin?.id },
          update: { ...safePayload, updatedById: admin?.id },
        });
      }
      throw err;
    }
  }

  async getFeatureFlags(): Promise<FeatureFlagsMap> {
    const settings = await this.get();
    const storedFlags = (settings as any).featureFlags as FeatureFlagsMap | null;
    if (!storedFlags) {
      return DEFAULT_FEATURE_FLAGS;
    }
    // Deep merge stored flags with DEFAULT_FEATURE_FLAGS to ensure new keys exist
    const mergedFlags: FeatureFlagsMap = { ...DEFAULT_FEATURE_FLAGS };
    for (const catKey of Object.keys(DEFAULT_FEATURE_FLAGS)) {
      if (storedFlags[catKey]) {
        mergedFlags[catKey] = {
          ...DEFAULT_FEATURE_FLAGS[catKey],
          ...storedFlags[catKey],
          subCategories: {
            ...DEFAULT_FEATURE_FLAGS[catKey].subCategories,
            ...(storedFlags[catKey].subCategories || {}),
          },
        };
      }
    }
    return mergedFlags;
  }

  async updateFeatureFlags(admin: AuthUser, flags: FeatureFlagsMap) {
    this.clearCache();
    return this.prisma.appSetting.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, featureFlags: flags as any, updatedById: admin.id },
      update: { featureFlags: flags as any, updatedById: admin.id },
    });
  }

  async getIntegrations(): Promise<SystemIntegrationsConfig> {
    const settings = await this.get();
    const stored = (settings as any).featureFlags?.systemIntegrations as Partial<SystemIntegrationsConfig> | null;
    if (!stored) {
      return DEFAULT_INTEGRATIONS_CONFIG;
    }
    return {
      sms: {
        ...DEFAULT_INTEGRATIONS_CONFIG.sms,
        ...stored.sms,
        providers: {
          ...DEFAULT_INTEGRATIONS_CONFIG.sms.providers,
          ...(stored.sms?.providers || {}),
        },
      },
      gateway: {
        ...DEFAULT_INTEGRATIONS_CONFIG.gateway,
        ...stored.gateway,
        routing: {
          ...DEFAULT_INTEGRATIONS_CONFIG.gateway.routing,
          ...(stored.gateway?.routing || {}),
        } as any,
        moduleRules: {
          ...DEFAULT_INTEGRATIONS_CONFIG.gateway.moduleRules,
          ...(stored.gateway?.moduleRules || {}),
          farmerPlans: {
            ...DEFAULT_INTEGRATIONS_CONFIG.gateway.moduleRules!.farmerPlans,
            ...(stored.gateway?.moduleRules?.farmerPlans || {}),
            allowedMethods: {
              ...DEFAULT_INTEGRATIONS_CONFIG.gateway.moduleRules!.farmerPlans.allowedMethods,
              ...(stored.gateway?.moduleRules?.farmerPlans?.allowedMethods || {}),
            } as any,
          } as any,
          advisorBookings: {
            ...DEFAULT_INTEGRATIONS_CONFIG.gateway.moduleRules!.advisorBookings,
            ...(stored.gateway?.moduleRules?.advisorBookings || {}),
            allowedMethods: {
              ...DEFAULT_INTEGRATIONS_CONFIG.gateway.moduleRules!.advisorBookings.allowedMethods,
              ...(stored.gateway?.moduleRules?.advisorBookings?.allowedMethods || {}),
            } as any,
          } as any,
          gardenStore: {
            ...DEFAULT_INTEGRATIONS_CONFIG.gateway.moduleRules!.gardenStore,
            ...(stored.gateway?.moduleRules?.gardenStore || {}),
            allowedMethods: {
              ...DEFAULT_INTEGRATIONS_CONFIG.gateway.moduleRules!.gardenStore.allowedMethods,
              ...(stored.gateway?.moduleRules?.gardenStore?.allowedMethods || {}),
            } as any,
          } as any,
          ecommerceStore: {
            ...DEFAULT_INTEGRATIONS_CONFIG.gateway.moduleRules!.ecommerceStore,
            ...(stored.gateway?.moduleRules?.ecommerceStore || {}),
            allowedMethods: {
              ...DEFAULT_INTEGRATIONS_CONFIG.gateway.moduleRules!.ecommerceStore.allowedMethods,
              ...(stored.gateway?.moduleRules?.ecommerceStore?.allowedMethods || {}),
            } as any,
          } as any,
        } as any,
        providers: {
          ...DEFAULT_INTEGRATIONS_CONFIG.gateway.providers,
          ...(stored.gateway?.providers || {}),
        },
      },
      whatsapp: {
        ...DEFAULT_INTEGRATIONS_CONFIG.whatsapp,
        ...stored.whatsapp,
        providers: {
          ...DEFAULT_INTEGRATIONS_CONFIG.whatsapp.providers,
          ...(stored.whatsapp?.providers || {}),
        },
      },
      ai: {
        ...DEFAULT_INTEGRATIONS_CONFIG.ai,
        ...stored.ai,
        providers: {
          ...DEFAULT_INTEGRATIONS_CONFIG.ai.providers,
          ...(stored.ai?.providers || {}),
        },
      },
      telecom: {
        ...DEFAULT_INTEGRATIONS_CONFIG.telecom,
        ...stored.telecom,
        providers: {
          ...DEFAULT_INTEGRATIONS_CONFIG.telecom.providers,
          ...(stored.telecom?.providers || {}),
        },
      },
      weather: {
        ...DEFAULT_INTEGRATIONS_CONFIG.weather,
        ...stored.weather,
        providers: {
          ...DEFAULT_INTEGRATIONS_CONFIG.weather.providers,
          ...(stored.weather?.providers || {}),
        },
      },
      satellite: {
        ...DEFAULT_INTEGRATIONS_CONFIG.satellite,
        ...stored.satellite,
        providers: {
          ...DEFAULT_INTEGRATIONS_CONFIG.satellite.providers,
          ...(stored.satellite?.providers || {}),
        },
      },
      logistics: {
        ...DEFAULT_INTEGRATIONS_CONFIG.logistics,
        ...stored.logistics,
        providers: {
          ...DEFAULT_INTEGRATIONS_CONFIG.logistics.providers,
          ...(stored.logistics?.providers || {}),
        },
      },
      push: {
        ...DEFAULT_INTEGRATIONS_CONFIG.push,
        ...stored.push,
        providers: {
          ...DEFAULT_INTEGRATIONS_CONFIG.push.providers,
          ...(stored.push?.providers || {}),
        },
      },
      storage: {
        ...DEFAULT_INTEGRATIONS_CONFIG.storage,
        ...stored.storage,
        providers: {
          ...DEFAULT_INTEGRATIONS_CONFIG.storage.providers,
          ...(stored.storage?.providers || {}),
        },
      },
      product: {
        ...DEFAULT_INTEGRATIONS_CONFIG.product,
        ...(stored.product || {}),
      },
      socialMedia: {
        ...DEFAULT_INTEGRATIONS_CONFIG.socialMedia,
        ...(stored.socialMedia || {}),
      },
      otp: {
        ...DEFAULT_INTEGRATIONS_CONFIG.otp,
        ...stored.otp,
        channelsEnabled: {
          ...DEFAULT_INTEGRATIONS_CONFIG.otp.channelsEnabled,
          ...(stored.otp?.channelsEnabled || {}),
        },
      },
      about: {
        ...DEFAULT_INTEGRATIONS_CONFIG.about,
        ...(stored.about || {}),
        companyName: stored.about?.companyName || settings.appName || DEFAULT_INTEGRATIONS_CONFIG.about.companyName,
        brandName: stored.about?.brandName || settings.appName || DEFAULT_INTEGRATIONS_CONFIG.about.brandName,
        logoUrl: stored.about?.logoUrl || settings.logoUrl || DEFAULT_INTEGRATIONS_CONFIG.about.logoUrl,
        tagline: stored.about?.tagline || settings.tagline || DEFAULT_INTEGRATIONS_CONFIG.about.tagline,
      },
      projectMasterData: {
        ...DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!,
        ...(stored.projectMasterData || {}),
        companyLegalName: stored.projectMasterData?.companyLegalName || stored.about?.companyName || settings.appName || DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.companyLegalName,
        brandDisplayName: stored.projectMasterData?.brandDisplayName || stored.about?.brandName || settings.appName || DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.brandDisplayName,
        tagline: stored.projectMasterData?.tagline || stored.about?.tagline || settings.tagline || DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.tagline,
        logoUrl: stored.projectMasterData?.logoUrl || stored.about?.logoUrl || settings.logoUrl || DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.logoUrl,
        themeColors: {
          ...DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.themeColors,
          ...(stored.projectMasterData?.themeColors || {}),
        },
        socialMedia: {
          ...DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.socialMedia,
          ...(stored.projectMasterData?.socialMedia || {}),
          facebookUrl: stored.projectMasterData?.socialMedia?.facebookUrl || stored.socialMedia?.facebookUrl || DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.socialMedia.facebookUrl,
          instagramUrl: stored.projectMasterData?.socialMedia?.instagramUrl || stored.socialMedia?.instagramUrl || DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.socialMedia.instagramUrl,
          youtubeUrl: stored.projectMasterData?.socialMedia?.youtubeUrl || stored.socialMedia?.youtubeUrl || DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.socialMedia.youtubeUrl,
          twitterUrl: stored.projectMasterData?.socialMedia?.twitterUrl || stored.socialMedia?.twitterUrl || DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.socialMedia.twitterUrl,
          linkedinUrl: stored.projectMasterData?.socialMedia?.linkedinUrl || stored.socialMedia?.linkedinUrl || DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.socialMedia.linkedinUrl,
        },
        smtp: {
          ...DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.smtp,
          ...(stored.projectMasterData?.smtp || {}),
        },
        emailTemplates: {
          ...DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.emailTemplates,
          ...(stored.projectMasterData?.emailTemplates || {}),
        },
        otpLogin: {
          ...DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.otpLogin,
          ...(stored.projectMasterData?.otpLogin || {}),
          channels: {
            ...DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.otpLogin.channels,
            ...(stored.projectMasterData?.otpLogin?.channels || {}),
          },
        },
        maintenance: {
          ...DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.maintenance,
          ...(stored.projectMasterData?.maintenance || {}),
        },
        taxGst: {
          ...DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.taxGst,
          ...(stored.projectMasterData?.taxGst || {}),
          gstNumber: stored.projectMasterData?.taxGst?.gstNumber || stored.about?.gstin || DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.taxGst.gstNumber,
          taxPercentage: stored.projectMasterData?.taxGst?.taxPercentage ?? stored.product?.defaultGstPercent ?? DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.taxGst.taxPercentage,
        },
      },
    };
  }

  async updateIntegrations(admin: AuthUser, payload: Partial<SystemIntegrationsConfig>): Promise<SystemIntegrationsConfig> {
    this.clearCache();
    const current = await this.getIntegrations();
    const merged: SystemIntegrationsConfig = {
      sms: {
        ...current.sms,
        ...(payload.sms || {}),
        providers: {
          ...current.sms.providers,
          ...(payload.sms?.providers || {}),
        },
      },
      gateway: {
        ...current.gateway,
        ...(payload.gateway || {}),
        routing: {
          ...current.gateway.routing,
          ...(payload.gateway?.routing || {}),
        } as any,
        moduleRules: {
          ...current.gateway.moduleRules,
          ...(payload.gateway?.moduleRules || {}),
          farmerPlans: {
            ...current.gateway.moduleRules?.farmerPlans,
            ...(payload.gateway?.moduleRules?.farmerPlans || {}),
            allowedMethods: {
              ...current.gateway.moduleRules?.farmerPlans?.allowedMethods,
              ...(payload.gateway?.moduleRules?.farmerPlans?.allowedMethods || {}),
            } as any,
          } as any,
          advisorBookings: {
            ...current.gateway.moduleRules?.advisorBookings,
            ...(payload.gateway?.moduleRules?.advisorBookings || {}),
            allowedMethods: {
              ...current.gateway.moduleRules?.advisorBookings?.allowedMethods,
              ...(payload.gateway?.moduleRules?.advisorBookings?.allowedMethods || {}),
            } as any,
          } as any,
          gardenStore: {
            ...current.gateway.moduleRules?.gardenStore,
            ...(payload.gateway?.moduleRules?.gardenStore || {}),
            allowedMethods: {
              ...current.gateway.moduleRules?.gardenStore?.allowedMethods,
              ...(payload.gateway?.moduleRules?.gardenStore?.allowedMethods || {}),
            } as any,
          } as any,
          ecommerceStore: {
            ...current.gateway.moduleRules?.ecommerceStore,
            ...(payload.gateway?.moduleRules?.ecommerceStore || {}),
            allowedMethods: {
              ...current.gateway.moduleRules?.ecommerceStore?.allowedMethods,
              ...(payload.gateway?.moduleRules?.ecommerceStore?.allowedMethods || {}),
            } as any,
          } as any,
        } as any,
        providers: {
          ...current.gateway.providers,
          ...(payload.gateway?.providers || {}),
        },
      },
      whatsapp: {
        ...current.whatsapp,
        ...(payload.whatsapp || {}),
        providers: {
          ...current.whatsapp.providers,
          ...(payload.whatsapp?.providers || {}),
        },
      },
      ai: {
        ...current.ai,
        ...(payload.ai || {}),
        providers: {
          ...current.ai.providers,
          ...(payload.ai?.providers || {}),
        },
      },
      telecom: {
        ...current.telecom,
        ...(payload.telecom || {}),
        providers: {
          ...current.telecom.providers,
          ...(payload.telecom?.providers || {}),
        },
      },
      weather: {
        ...current.weather,
        ...(payload.weather || {}),
        providers: {
          ...current.weather.providers,
          ...(payload.weather?.providers || {}),
        },
      },
      satellite: {
        ...current.satellite,
        ...(payload.satellite || {}),
        providers: {
          ...current.satellite.providers,
          ...(payload.satellite?.providers || {}),
        },
      },
      logistics: {
        ...current.logistics,
        ...(payload.logistics || {}),
        providers: {
          ...current.logistics.providers,
          ...(payload.logistics?.providers || {}),
        },
      },
      push: {
        ...current.push,
        ...(payload.push || {}),
        providers: {
          ...current.push.providers,
          ...(payload.push?.providers || {}),
        },
      },
      storage: {
        ...current.storage,
        ...(payload.storage || {}),
        providers: {
          ...current.storage.providers,
          ...(payload.storage?.providers || {}),
        },
      },
      product: {
        ...current.product,
        ...(payload.product || {}),
      },
      socialMedia: {
        ...current.socialMedia,
        ...(payload.socialMedia || {}),
      },
      otp: {
        ...current.otp,
        ...(payload.otp || {}),
        channelsEnabled: {
          ...current.otp.channelsEnabled,
          ...(payload.otp?.channelsEnabled || {}),
        },
      },
      about: {
        ...current.about,
        ...(payload.about || {}),
      },
      projectMasterData: {
        ...(current.projectMasterData || DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!),
        ...(payload.projectMasterData || {}),
        themeColors: {
          ...(current.projectMasterData?.themeColors || DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.themeColors),
          ...(payload.projectMasterData?.themeColors || {}),
        },
        socialMedia: {
          ...(current.projectMasterData?.socialMedia || DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.socialMedia),
          ...(payload.projectMasterData?.socialMedia || {}),
        },
        smtp: {
          ...(current.projectMasterData?.smtp || DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.smtp),
          ...(payload.projectMasterData?.smtp || {}),
        },
        emailTemplates: {
          ...(current.projectMasterData?.emailTemplates || DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.emailTemplates),
          ...(payload.projectMasterData?.emailTemplates || {}),
        },
        otpLogin: {
          ...(current.projectMasterData?.otpLogin || DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.otpLogin),
          ...(payload.projectMasterData?.otpLogin || {}),
          channels: {
            ...(current.projectMasterData?.otpLogin?.channels || DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.otpLogin.channels),
            ...(payload.projectMasterData?.otpLogin?.channels || {}),
          },
        },
        maintenance: {
          ...(current.projectMasterData?.maintenance || DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.maintenance),
          ...(payload.projectMasterData?.maintenance || {}),
        },
        taxGst: {
          ...(current.projectMasterData?.taxGst || DEFAULT_INTEGRATIONS_CONFIG.projectMasterData!.taxGst),
          ...(payload.projectMasterData?.taxGst || {}),
        },
      },
    };

    const currentSettings = await this.get();
    const currentFlags = ((currentSettings as any).featureFlags as Record<string, any>) || {};
    const updatedFlags = {
      ...currentFlags,
      systemIntegrations: merged,
    };

    const topLevelUpdates: Record<string, any> = {};
    if (merged.projectMasterData?.brandDisplayName || merged.projectMasterData?.companyLegalName) {
      topLevelUpdates.appName = merged.projectMasterData.brandDisplayName || merged.projectMasterData.companyLegalName;
    } else if (merged.about?.brandName || merged.about?.companyName) {
      topLevelUpdates.appName = merged.about.brandName || merged.about.companyName;
    }
    if (merged.projectMasterData?.logoUrl || merged.about?.logoUrl) {
      topLevelUpdates.logoUrl = merged.projectMasterData?.logoUrl || merged.about?.logoUrl;
    }
    if (merged.projectMasterData?.tagline || merged.about?.tagline) {
      topLevelUpdates.tagline = merged.projectMasterData?.tagline || merged.about?.tagline;
    }
    if (merged.projectMasterData?.supportEmail || merged.about?.supportEmail) {
      topLevelUpdates.adminEmail = merged.projectMasterData?.supportEmail || merged.about?.supportEmail;
    }
    if (merged.projectMasterData?.primaryMobile || merged.about?.supportPhone) {
      topLevelUpdates.adminMobile = merged.projectMasterData?.primaryMobile || merged.about?.supportPhone;
    }
    if (merged.gateway?.providers?.upiDirect?.upiId) {
      topLevelUpdates.upiId = merged.gateway.providers.upiDirect.upiId;
    }
    if (merged.gateway?.providers?.upiDirect?.payeeName) {
      topLevelUpdates.upiPayeeName = merged.gateway.providers.upiDirect.payeeName;
    }
    if (merged.otp?.deliveryMode) {
      topLevelUpdates.otpDeliveryChannel = merged.otp.deliveryMode;
    }

    await this.prisma.appSetting.upsert({
      where: { id: SINGLETON_ID },
      create: {
        id: SINGLETON_ID,
        ...topLevelUpdates,
        featureFlags: updatedFlags as any,
        updatedById: admin.id,
      },
      update: {
        ...topLevelUpdates,
        featureFlags: updatedFlags as any,
        updatedById: admin.id,
      },
    });

    return merged;
  }
}

