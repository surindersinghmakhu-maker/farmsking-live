import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';
import { DEFAULT_FEATURE_FLAGS, FeatureFlagsMap } from '../../common/constants/feature-flags.constant';

const SINGLETON_ID = 'default';

@Injectable()
export class AppSettingsService {
  private cache: { data: any; timestamp: number } | null = null;
  private readonly CACHE_TTL_MS = 15000;

  constructor(private readonly prisma: PrismaService) {}

  clearCache() {
    this.cache = null;
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

    const result = {
      ...settings,
      logoUrl,
      upiId: settings.upiId || 'surindersinghmakhu-5@oksbi',
      upiPayeeName: settings.upiPayeeName || 'Surinder Singh',
    };

    this.cache = { data: result, timestamp: now };
    return result;
  }

  /** Real contact details for the "Support"/"Contact Us" screens — pulled from the live Super Admin (or Admin) account. */
  async getSupportContact() {
    const superAdmin = await this.prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN', deletedAt: null },
      select: { name: true, mobile: true, email: true },
      orderBy: { createdAt: 'asc' },
    });
    if (superAdmin) {
      return {
        name: superAdmin.name || 'Surinder Singh (Super Admin)',
        mobile: superAdmin.mobile || '9577622000',
        email: superAdmin.email || 'support@farmsking.com',
      };
    }

    const admin = await this.prisma.user.findFirst({
      where: { role: 'ADMIN', deletedAt: null },
      select: { name: true, mobile: true, email: true },
      orderBy: { createdAt: 'asc' },
    });
    if (admin) {
      return {
        name: admin.name || 'Admin',
        mobile: admin.mobile || '9577622000',
        email: admin.email || 'support@farmsking.com',
      };
    }

    return {
      name: 'Surinder Singh (Super Admin)',
      mobile: '9577622000',
      email: 'support@farmsking.com',
    };
  }

  async update(admin: AuthUser, dto: UpdateAppSettingsDto) {
    this.clearCache();
    const fields: Record<string, unknown> = {};
    const keys: (keyof UpdateAppSettingsDto)[] = [
      'appName',
      'logoUrl',
      'tagline',
      'upiId',
      'upiPayeeName',
      'groupVoiceCallEnabled',
      'whatsappGroupSyncEnabled',
      'whatsappAutoAddEnabled',
      'whatsappAutoRemoveEnabled',
      'whatsappGroupJid',
    ];

    for (const key of keys) {
      if (dto[key] !== undefined) fields[key] = dto[key];
    }

    if (dto.adminName || dto.adminMobile || dto.adminEmail) {
      try {
        const superAdmin = await this.prisma.user.findFirst({
          where: { role: 'SUPER_ADMIN', deletedAt: null },
        });
        if (superAdmin) {
          await this.prisma.user.update({
            where: { id: superAdmin.id },
            data: {
              ...(dto.adminName !== undefined && { name: dto.adminName }),
              ...(dto.adminMobile !== undefined && { mobile: dto.adminMobile }),
              ...(dto.adminEmail !== undefined && { email: dto.adminEmail }),
              ...(dto.upiId !== undefined && { upiId: dto.upiId }),
              ...(dto.tagline !== undefined && { bio: dto.tagline }),
              ...(dto.appName !== undefined && { specialization: dto.appName }),
              ...(dto.logoUrl !== undefined && { photoUrl: dto.logoUrl }),
            },
          });
        }
      } catch (err) {
        console.warn('Could not update super admin user contact details:', err);
      }
    }

    return this.prisma.appSetting.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...fields, updatedById: admin.id },
      update: { ...fields, updatedById: admin.id },
    });
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
}

