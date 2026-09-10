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
        const settings = await this.get();
        let name = settings?.adminName;
        let mobile = settings?.adminMobile;
        let email = settings?.adminEmail;
        if (!mobile || !name || !email) {
            const superAdmin = await this.prisma.user.findFirst({
                where: { role: 'SUPER_ADMIN', deletedAt: null },
                select: { name: true, mobile: true, email: true },
                orderBy: { createdAt: 'asc' },
            });
            if (superAdmin) {
                name = name || superAdmin.name || 'Surinder Singh (Super Admin)';
                mobile = mobile || superAdmin.mobile || '9577622000';
                email = email || superAdmin.email || 'support@farmsking.com';
            }
        }
        return {
            name: name || 'Surinder Singh (Super Admin)',
            mobile: mobile || '9577622000',
            email: email || 'support@farmsking.com',
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
            'adminName',
            'adminMobile',
            'adminEmail',
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
        if (dto.adminName !== undefined || dto.adminMobile !== undefined || dto.adminEmail !== undefined || dto.upiId !== undefined || dto.logoUrl !== undefined || dto.appName !== undefined || dto.tagline !== undefined) {
            try {
                const userData = {};
                if (dto.adminName !== undefined)
                    userData.name = dto.adminName;
                if (dto.adminEmail !== undefined)
                    userData.email = dto.adminEmail;
                if (dto.upiId !== undefined)
                    userData.upiId = dto.upiId;
                if (dto.tagline !== undefined)
                    userData.bio = dto.tagline;
                if (dto.appName !== undefined)
                    userData.specialization = dto.appName;
                if (dto.logoUrl !== undefined)
                    userData.photoUrl = dto.logoUrl;
                if (dto.adminMobile !== undefined && dto.adminMobile) {
                    const targetMobile = dto.adminMobile.trim();
                    const targetUserId = admin?.id;
                    const existingOwner = await this.prisma.user.findFirst({
                        where: { mobile: targetMobile },
                        select: { id: true, role: true },
                    });
                    if (existingOwner && existingOwner.id !== targetUserId) {
                        await this.prisma.user.update({
                            where: { id: existingOwner.id },
                            data: { mobile: `${targetMobile}_old_${Date.now().toString().slice(-4)}` },
                        }).catch(() => { });
                    }
                    userData.mobile = targetMobile;
                }
                if (Object.keys(userData).length > 0) {
                    if (admin && admin.id) {
                        await this.prisma.user.update({
                            where: { id: admin.id },
                            data: userData,
                        }).catch((err) => console.warn('Could not update admin user:', err));
                    }
                    const { mobile, ...nonUniqueUserData } = userData;
                    if (Object.keys(nonUniqueUserData).length > 0) {
                        await this.prisma.user.updateMany({
                            where: { role: 'SUPER_ADMIN', deletedAt: null },
                            data: nonUniqueUserData,
                        }).catch(() => { });
                    }
                }
            }
            catch (err) {
                console.warn('Could not update super admin user contact details in User table:', err);
            }
        }
        return this.prisma.appSetting.upsert({
            where: { id: SINGLETON_ID },
            create: { id: SINGLETON_ID, ...fields, updatedById: admin?.id },
            update: { ...fields, updatedById: admin?.id },
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