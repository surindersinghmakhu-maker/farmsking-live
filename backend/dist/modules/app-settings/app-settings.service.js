"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppSettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const feature_flags_constant_1 = require("../../common/constants/feature-flags.constant");
const SINGLETON_ID = 'default';
let AppSettingsService = class AppSettingsService {
    prisma;
    cache = null;
    CACHE_TTL_MS = 15000;
    constructor(prisma) {
        this.prisma = prisma;
    }
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
    async update(admin, dto) {
        this.clearCache();
        const fields = {};
        const keys = [
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
            if (dto[key] !== undefined)
                fields[key] = dto[key];
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
            }
            catch (err) {
                console.warn('Could not update super admin user contact details:', err);
            }
        }
        return this.prisma.appSetting.upsert({
            where: { id: SINGLETON_ID },
            create: { id: SINGLETON_ID, ...fields, updatedById: admin.id },
            update: { ...fields, updatedById: admin.id },
        });
    }
    async getFeatureFlags() {
        const settings = await this.get();
        const storedFlags = settings.featureFlags;
        if (!storedFlags) {
            return feature_flags_constant_1.DEFAULT_FEATURE_FLAGS;
        }
        const mergedFlags = { ...feature_flags_constant_1.DEFAULT_FEATURE_FLAGS };
        for (const catKey of Object.keys(feature_flags_constant_1.DEFAULT_FEATURE_FLAGS)) {
            if (storedFlags[catKey]) {
                mergedFlags[catKey] = {
                    ...feature_flags_constant_1.DEFAULT_FEATURE_FLAGS[catKey],
                    ...storedFlags[catKey],
                    subCategories: {
                        ...feature_flags_constant_1.DEFAULT_FEATURE_FLAGS[catKey].subCategories,
                        ...(storedFlags[catKey].subCategories || {}),
                    },
                };
            }
        }
        return mergedFlags;
    }
    async updateFeatureFlags(admin, flags) {
        this.clearCache();
        return this.prisma.appSetting.upsert({
            where: { id: SINGLETON_ID },
            create: { id: SINGLETON_ID, featureFlags: flags, updatedById: admin.id },
            update: { featureFlags: flags, updatedById: admin.id },
        });
    }
};
exports.AppSettingsService = AppSettingsService;
exports.AppSettingsService = AppSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppSettingsService);
//# sourceMappingURL=app-settings.service.js.map