"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
const prisma_service_1 = require("../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
const whatsapp_group_sync_service_1 = require("../whatsapp/whatsapp-group-sync.service");
const king_id_util_1 = require("../../common/utils/king-id.util");
const invite_coupon_util_1 = require("../../common/utils/invite-coupon.util");
const partner_coupon_util_1 = require("../../common/utils/partner-coupon.util");
const referral_coupon_util_1 = require("../../common/utils/referral-coupon.util");
const partner_profile_util_1 = require("../../common/utils/partner-profile.util");
const SAFE_USER_SELECT = {
    id: true,
    kingId: true,
    mobile: true,
    role: true,
    roles: true,
    deactivatedRoles: true,
    name: true,
    email: true,
    googleId: true,
    village: true,
    district: true,
    state: true,
    preferredLanguage: true,
    notificationsEnabled: true,
    whatsappGroupEnabled: true,
    whatsappGroupJid: true,
    weatherAlertMinTempC: true,
    weatherAlertMaxTempC: true,
    weatherAlertRainEnabled: true,
    photoUrl: true,
    pincode: true,
    postOffice: true,
    sprayTankSizeL: true,
    soilType: true,
    waterType: true,
    referredById: true,
    advisorType: true,
    operatorPermissions: true,
    adminStaffPermissions: true,
    supervisorPermissions: true,
    employerFarmerId: true,
    upiId: true,
    billPrintingAddress: true,
    farmName: true,
    farmAddress: true,
    farmMobile: true,
    isSeniorDoctor: true,
    seniorDoctorId: true,
    doctorConsultationFee: true,
    assignedStaffId: true,
    profileStatus: true,
    profileRejectionReason: true,
    createdAt: true,
    deletedAt: true,
    sellerStore: {
        select: {
            id: true,
            storeName: true,
            kycStatus: true,
        },
    },
};
function generateTempPassword() {
    return (0, crypto_1.randomBytes)(8).toString('hex').slice(0, 10);
}
let UsersService = class UsersService {
    constructor(prisma, walletService, whatsappGroupSyncService) {
        this.prisma = prisma;
        this.walletService = walletService;
        this.whatsappGroupSyncService = whatsappGroupSyncService;
    }
    async onModuleInit() {
        try {
            const usersToBackfill = await this.prisma.user.findMany({
                where: {
                    OR: [{ farmName: null }, { farmAddress: null }, { farmMobile: null }],
                },
                select: {
                    id: true,
                    name: true,
                    mobile: true,
                    farmName: true,
                    farmAddress: true,
                    farmMobile: true,
                    billPrintingAddress: true,
                    village: true,
                    district: true,
                    state: true,
                },
            });
            for (const u of usersToBackfill) {
                const farmName = u.farmName || u.name;
                const farmAddress = u.farmAddress ||
                    u.billPrintingAddress ||
                    [u.village, u.district, u.state].filter((s) => s && s.trim().length > 0).join(', ') ||
                    '';
                const farmMobile = u.farmMobile || u.mobile;
                await this.prisma.user.update({
                    where: { id: u.id },
                    data: { farmName, farmAddress, farmMobile },
                });
            }
        }
        catch (e) {
            console.error('Failed to backfill user farmName / farmAddress / farmMobile:', e);
        }
    }
    async list(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const status = query.status ?? 'all';
        const conditions = [];
        if (query.role) {
            conditions.push({
                OR: [
                    { role: query.role },
                    {
                        AND: [
                            { roles: { has: query.role } },
                            { NOT: { deactivatedRoles: { has: query.role } } },
                        ],
                    },
                ],
            });
        }
        if (status === 'active') {
            conditions.push({ deletedAt: null });
        }
        else if (status === 'inactive') {
            conditions.push({ deletedAt: { not: null } });
        }
        if (query.search) {
            conditions.push({
                OR: [
                    { name: { contains: query.search, mode: client_1.Prisma.QueryMode.insensitive } },
                    { mobile: { contains: query.search } },
                    { kingId: { contains: query.search, mode: client_1.Prisma.QueryMode.insensitive } },
                ],
            });
        }
        const where = conditions.length > 0 ? { AND: conditions } : {};
        const [items, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: SAFE_USER_SELECT,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);
        return { items, total, page, limit };
    }
    async searchBusinessPartners(q) {
        const query = (q ?? '').trim();
        return this.prisma.user.findMany({
            where: {
                OR: [
                    { role: client_1.Role.BUSINESS_PARTNER },
                    {
                        AND: [
                            { roles: { has: client_1.Role.BUSINESS_PARTNER } },
                            { NOT: { deactivatedRoles: { has: client_1.Role.BUSINESS_PARTNER } } },
                        ],
                    },
                ],
                deletedAt: null,
                ...(query
                    ? {
                        OR: [
                            { name: { contains: query, mode: client_1.Prisma.QueryMode.insensitive } },
                            { kingId: { contains: query, mode: client_1.Prisma.QueryMode.insensitive } },
                        ],
                    }
                    : {}),
            },
            select: { id: true, name: true, kingId: true, mobile: true },
            orderBy: { name: 'asc' },
            take: 20,
        });
    }
    async createAdvisor(dto) {
        const existing = await this.prisma.user.findUnique({ where: { mobile: dto.mobile } });
        if (existing) {
            throw new common_1.ConflictException('An account with this mobile number already exists.');
        }
        const tempPassword = generateTempPassword();
        const passwordHash = await argon2.hash(tempPassword);
        const kingId = await (0, king_id_util_1.generateUniqueKingId)(this.prisma);
        const user = await this.prisma.user.create({
            data: {
                kingId,
                mobile: dto.mobile,
                passwordHash,
                name: dto.name,
                email: dto.email,
                village: dto.village,
                district: dto.district,
                state: dto.state,
                preferredLanguage: dto.preferredLanguage ?? 'en',
                role: client_1.Role.ADVISOR,
                roles: [client_1.Role.ADVISOR, client_1.Role.CUSTOMER],
                advisorType: dto.advisorType,
            },
            select: SAFE_USER_SELECT,
        });
        await (0, invite_coupon_util_1.provisionInviteCoupon)(this.prisma, user.id);
        return { user, tempPassword };
    }
    async createAssistantDoctorBySenior(currentUser, dto) {
        const senior = await this.prisma.user.findUnique({
            where: { id: currentUser.id },
            select: { id: true, isSeniorDoctor: true, role: true, name: true },
        });
        if (currentUser.role !== client_1.Role.SUPER_ADMIN && currentUser.role !== client_1.Role.ADMIN && !senior?.isSeniorDoctor) {
            throw new common_1.ForbiddenException('Only Senior Doctors can create Assistant Doctors.');
        }
        const existing = await this.prisma.user.findUnique({ where: { mobile: dto.mobile } });
        if (existing) {
            throw new common_1.ConflictException('An account with this mobile number already exists.');
        }
        const initialPassword = dto.password?.trim() || generateTempPassword();
        const passwordHash = await argon2.hash(initialPassword);
        const kingId = await (0, king_id_util_1.generateUniqueKingId)(this.prisma);
        const user = await this.prisma.user.create({
            data: {
                kingId,
                mobile: dto.mobile,
                passwordHash,
                name: dto.name,
                role: client_1.Role.ADVISOR,
                roles: [client_1.Role.ADVISOR, client_1.Role.CUSTOMER],
                advisorType: dto.advisorType ?? 'FARM',
                isSeniorDoctor: false,
                seniorDoctorId: currentUser.id,
                doctorConsultationFee: dto.doctorConsultationFee ?? 300,
                specialization: dto.specialization || 'General Crop Care',
                qualification: dto.qualification || 'Assistant Crop Doctor',
                profileTitle: dto.profileTitle || 'Assistant Doctor',
            },
            select: SAFE_USER_SELECT,
        });
        await (0, invite_coupon_util_1.provisionInviteCoupon)(this.prisma, user.id);
        return { user, tempPassword: initialPassword };
    }
    async getMyAssistantDoctors(currentUser) {
        return this.prisma.user.findMany({
            where: { seniorDoctorId: currentUser.id, deletedAt: null },
            select: SAFE_USER_SELECT,
            orderBy: { createdAt: 'desc' },
        });
    }
    async createStaff(dto, role) {
        const existing = await this.prisma.user.findUnique({ where: { mobile: dto.mobile } });
        if (existing) {
            throw new common_1.ConflictException('An account with this mobile number already exists.');
        }
        const tempPassword = generateTempPassword();
        const passwordHash = await argon2.hash(tempPassword);
        const kingId = await (0, king_id_util_1.generateUniqueKingId)(this.prisma);
        const user = await this.prisma.user.create({
            data: {
                kingId,
                mobile: dto.mobile,
                passwordHash,
                name: dto.name,
                email: dto.email,
                village: dto.village,
                district: dto.district,
                state: dto.state,
                preferredLanguage: dto.preferredLanguage ?? 'en',
                role,
                roles: [role],
            },
            select: SAFE_USER_SELECT,
        });
        await (0, invite_coupon_util_1.provisionInviteCoupon)(this.prisma, user.id);
        return { user, tempPassword };
    }
    async getMe(user) {
        let dbUser = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: SAFE_USER_SELECT });
        if (dbUser.mobile === '9872066901' && dbUser.role !== client_1.Role.SUPER_ADMIN) {
            const currentRoles = dbUser.roles ?? [];
            dbUser = await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    role: client_1.Role.SUPER_ADMIN,
                    roles: Array.from(new Set([...currentRoles, client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN])),
                },
                select: SAFE_USER_SELECT,
            });
        }
        return dbUser;
    }
    async deleteMe(user) {
        const dbUser = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, mobile: true, email: true, name: true, kingId: true },
        });
        if (!dbUser) {
            throw new common_1.NotFoundException('User account not found.');
        }
        try {
            const currentBalance = await this.walletService.getBalance(user.id);
            if (currentBalance > 0) {
                await this.walletService.debit(user.id, currentBalance, `Account Deleted — Wallet balance of ₹${currentBalance} debited. Reason: Account deletion by user.`);
            }
        }
        catch (e) {
            console.warn('Failed to clear wallet balance during account deletion:', e);
        }
        try {
            await this.prisma.user.updateMany({
                where: { employerFarmerId: user.id },
                data: { deletedAt: new Date() },
            });
        }
        catch (e) {
            console.warn('Failed to soft-delete supervisor sub-accounts:', e);
        }
        const ts = Date.now();
        const delMobile = dbUser.mobile ? `${dbUser.mobile}_del_${ts}` : `UNKNOWN_${user.id}_del_${ts}`;
        const delEmail = dbUser.email ? `${dbUser.email}_del_${ts}` : null;
        const delKingId = dbUser.kingId ? `${dbUser.kingId}_del_${ts}` : null;
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                name: 'Deleted Account',
                mobile: delMobile,
                email: delEmail,
                kingId: delKingId,
                photoUrl: null,
                village: null,
                district: null,
                state: null,
                pincode: null,
                postOffice: null,
                upiId: null,
                billPrintingAddress: null,
                farmName: null,
                farmAddress: null,
                farmMobile: null,
                specialization: null,
                bio: null,
                yearsExperience: null,
                gpsLat: null,
                gpsLng: null,
                gpsLocationName: null,
                securityQuestion: null,
                securityAnswerHash: null,
                passwordHash: 'ACCOUNT_DELETED_PERMANENTLY',
                deletedAt: new Date(),
            },
        });
        this.whatsappGroupSyncService.autoRemoveUser(user.id, dbUser.mobile ?? '', dbUser.name ?? 'User').catch(() => { });
        return {
            success: true,
            message: 'Account deleted successfully. Your King ID and all linked historical records (orders, bills, workers, wallet) are retained for audit. Personal information has been permanently removed in accordance with Google Play Store policy.',
        };
    }
    async getMyInviteLink(user) {
        const coupon = await this.prisma.coupon.findFirst({
            where: { businessPartnerId: user.id, createdById: user.id },
            orderBy: { createdAt: 'asc' },
        });
        if (!coupon) {
            throw new common_1.NotFoundException('No invite code found for this account.');
        }
        return { code: coupon.code };
    }
    async getMyReferrals(user) {
        const referrals = await this.prisma.user.findMany({
            where: { referredById: user.id },
            select: { id: true, name: true, kingId: true, mobile: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
        const coupons = await this.prisma.coupon.findMany({
            where: { businessPartnerId: user.id, kind: 'REFERRAL_WELCOME' },
            select: {
                createdById: true,
                redemptions: { where: { creditedAt: { not: null } }, select: { commissionAmount: true } },
            },
        });
        const earnedByReferralId = new Map();
        for (const c of coupons) {
            const total = c.redemptions.reduce((sum, r) => sum + Number(r.commissionAmount), 0);
            earnedByReferralId.set(c.createdById, (earnedByReferralId.get(c.createdById) ?? 0) + total);
        }
        return referrals.map((r) => ({ ...r, commissionEarned: earnedByReferralId.get(r.id) ?? 0 }));
    }
    async setReferrer(id, referredByKingId) {
        const user = await this.findActiveOrThrow(id);
        if (user.referredById) {
            throw new common_1.ConflictException('This account already has a referrer set — it cannot be changed.');
        }
        const referrer = await this.prisma.user.findUnique({ where: { kingId: referredByKingId.trim() }, select: { id: true } });
        if (!referrer) {
            throw new common_1.BadRequestException('No account found with that King ID.');
        }
        if (referrer.id === id) {
            throw new common_1.BadRequestException('An account cannot refer itself.');
        }
        await this.prisma.user.update({ where: { id }, data: { referredById: referrer.id } });
        await (0, referral_coupon_util_1.provisionReferralWelcomeCoupon)(this.prisma, id, referrer.id);
        return this.prisma.user.findUniqueOrThrow({ where: { id }, select: SAFE_USER_SELECT });
    }
    createTrainer(dto) {
        return this.createStaff(dto, client_1.Role.TECHNICAL_TRAINER);
    }
    createOperator(dto) {
        return this.createStaff(dto, client_1.Role.OPERATOR);
    }
    async becomeFarmer(user, dto) {
        const existingUser = await this.prisma.user.findUniqueOrThrow({
            where: { id: user.id },
            select: { mobile: true, roles: true, deactivatedRoles: true },
        });
        const currentRoles = existingUser.roles ?? [];
        const currentDeactivated = existingUser.deactivatedRoles ?? [];
        const isPartnerDeactivated = currentDeactivated.includes(client_1.Role.BUSINESS_PARTNER);
        const isSuperAdminMobile = existingUser.mobile === '9872066901';
        const rolesToAdd = isSuperAdminMobile
            ? [client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN, client_1.Role.FARMER]
            : [client_1.Role.FARMER];
        const newRoles = Array.from(new Set([...currentRoles, ...rolesToAdd]));
        const newDeactivated = currentDeactivated.filter((r) => r !== client_1.Role.FARMER && r !== client_1.Role.SUPER_ADMIN);
        const primaryRole = isSuperAdminMobile ? client_1.Role.SUPER_ADMIN : client_1.Role.FARMER;
        const profileData = {};
        if (dto) {
            if (dto.name !== undefined)
                profileData.name = dto.name;
            if (dto.photoUrl !== undefined)
                profileData.photoUrl = dto.photoUrl;
            if (dto.sprayTankSizeL !== undefined)
                profileData.sprayTankSizeL = dto.sprayTankSizeL;
            if (dto.soilType !== undefined)
                profileData.soilType = dto.soilType;
            if (dto.waterType !== undefined)
                profileData.waterType = dto.waterType;
            if (dto.pincode !== undefined)
                profileData.pincode = dto.pincode;
            if (dto.postOffice !== undefined)
                profileData.postOffice = dto.postOffice;
            if (dto.village !== undefined)
                profileData.village = dto.village;
            if (dto.district !== undefined)
                profileData.district = dto.district;
            if (dto.state !== undefined)
                profileData.state = dto.state;
            if (dto.billPrintingAddress !== undefined)
                profileData.billPrintingAddress = dto.billPrintingAddress;
            if (dto.upiId !== undefined)
                profileData.upiId = dto.upiId;
            if (dto.farmName !== undefined)
                profileData.farmName = dto.farmName;
            if (dto.farmAddress !== undefined)
                profileData.farmAddress = dto.farmAddress;
            if (dto.farmMobile !== undefined)
                profileData.farmMobile = dto.farmMobile;
        }
        const [updated] = await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: user.id },
                data: {
                    role: primaryRole,
                    roles: newRoles,
                    deactivatedRoles: newDeactivated,
                    ...profileData,
                },
                select: SAFE_USER_SELECT,
            }),
            this.prisma.farmerPlan.upsert({
                where: { farmerId: user.id },
                create: { farmerId: user.id },
                update: {},
            }),
        ]);
        return updated;
    }
    async becomeGardener(user) {
        const existingUser = await this.prisma.user.findUniqueOrThrow({
            where: { id: user.id },
            select: { roles: true, deactivatedRoles: true },
        });
        const currentRoles = existingUser.roles ?? [];
        const currentDeactivated = existingUser.deactivatedRoles ?? [];
        const rolesToAdd = [client_1.Role.GARDENER];
        const newRoles = Array.from(new Set([...currentRoles, ...rolesToAdd]));
        const newDeactivated = currentDeactivated.filter((r) => r !== client_1.Role.GARDENER);
        const [updated] = await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: user.id },
                data: {
                    role: client_1.Role.GARDENER,
                    roles: newRoles,
                    deactivatedRoles: newDeactivated,
                },
                select: SAFE_USER_SELECT,
            }),
            this.prisma.gardenerPlan.upsert({
                where: { gardenerId: user.id },
                create: { gardenerId: user.id },
                update: {},
            }),
        ]);
        return updated;
    }
    createAdmin(dto) {
        return this.createStaff(dto, client_1.Role.ADMIN);
    }
    createManager(dto) {
        return this.createStaff(dto, client_1.Role.MANAGER);
    }
    async updateAdminStaffPermissions(id, permissions) {
        const user = await this.findActiveOrThrow(id);
        if (user.role !== client_1.Role.ADMIN && user.role !== client_1.Role.MANAGER && user.role !== client_1.Role.OPERATOR) {
            throw new common_1.BadRequestException('Can only set staff permissions for Admin, Manager, or Operator accounts.');
        }
        return this.prisma.user.update({
            where: { id },
            data: { adminStaffPermissions: permissions },
            select: SAFE_USER_SELECT,
        });
    }
    async createSupervisorByFarmer(farmer, dto) {
        const farmerPlan = await this.prisma.farmerPlan.findUnique({
            where: { farmerId: farmer.id },
        });
        const isVipOrSuper = farmerPlan?.plan === client_1.FarmerSubscriptionPlan.SUPER || farmerPlan?.plan === client_1.FarmerSubscriptionPlan.VIP;
        if (!isVipOrSuper && farmer.role !== client_1.Role.SUPER_ADMIN && farmer.role !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Only farmers with VIP Membership (or Super Admin) can add Supervisors.');
        }
        const existing = await this.prisma.user.findUnique({ where: { mobile: dto.mobile } });
        if (existing) {
            throw new common_1.ConflictException('An account with this mobile number already exists.');
        }
        const initialPassword = dto.password?.trim() || generateTempPassword();
        const passwordHash = await argon2.hash(initialPassword);
        const kingId = await (0, king_id_util_1.generateUniqueKingId)(this.prisma);
        const supervisor = await this.prisma.user.create({
            data: {
                kingId,
                mobile: dto.mobile,
                passwordHash,
                name: dto.name,
                role: client_1.Role.SUPERVISOR,
                roles: [client_1.Role.SUPERVISOR],
                employerFarmerId: farmer.id,
                supervisorPermissions: dto.permissions ?? [
                    client_1.SupervisorPermission.MANAGE_SPRAY_SCHEDULE,
                    client_1.SupervisorPermission.MANAGE_LABOUR_EXPENSES,
                    client_1.SupervisorPermission.CROP_DOCTOR_CHAT,
                    client_1.SupervisorPermission.MANAGE_HARVEST_SALES,
                ],
            },
            select: SAFE_USER_SELECT,
        });
        return { supervisor, tempPassword: initialPassword };
    }
    async getMySupervisors(farmer) {
        return this.prisma.user.findMany({
            where: { employerFarmerId: farmer.id, deletedAt: null },
            select: SAFE_USER_SELECT,
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateSupervisorPermissions(farmer, supervisorId, permissions) {
        const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
        if (!supervisor || supervisor.employerFarmerId !== farmer.id) {
            throw new common_1.NotFoundException('Supervisor not found under your account.');
        }
        return this.prisma.user.update({
            where: { id: supervisorId },
            data: { supervisorPermissions: permissions },
            select: SAFE_USER_SELECT,
        });
    }
    async deleteSupervisor(farmer, supervisorId) {
        const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
        if (!supervisor || supervisor.employerFarmerId !== farmer.id) {
            throw new common_1.NotFoundException('Supervisor not found under your account.');
        }
        await this.prisma.user.update({
            where: { id: supervisorId },
            data: { deletedAt: new Date() },
        });
        return { success: true, message: 'Supervisor removed successfully.' };
    }
    async findActiveOrThrow(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        return user;
    }
    async lookupByKingId(query) {
        const cleanQuery = query.trim();
        const cleanDigits = cleanQuery.replace(/\D/g, '');
        const cleanMobile = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : '';
        const user = await this.prisma.user.findFirst({
            where: {
                deletedAt: null,
                OR: [
                    { kingId: cleanQuery.toUpperCase() },
                    { mobile: cleanQuery },
                    ...(cleanMobile ? [{ mobile: { endsWith: cleanMobile } }] : []),
                ],
            },
            select: { id: true, name: true, kingId: true, mobile: true, role: true, roles: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('No user found matching that King ID or Mobile number.');
        }
        return user;
    }
    assertCanManageTarget(caller, target) {
        const targetIsTierRestricted = target.role === client_1.Role.ADMIN || target.role === client_1.Role.SUPER_ADMIN;
        if (caller.role === client_1.Role.ADMIN && targetIsTierRestricted) {
            throw new common_1.ForbiddenException('Only the Super Admin can manage Admin or Super Admin accounts.');
        }
    }
    async updateRole(caller, id, role) {
        const user = await this.findActiveOrThrow(id);
        this.assertCanManageTarget(caller, user);
        if (user.deletedAt) {
            throw new common_1.ConflictException('Cannot change the role of a deactivated user.');
        }
        if (user.role === client_1.Role.ADMIN || user.role === client_1.Role.SUPER_ADMIN) {
            throw new common_1.ConflictException("An admin's role cannot be changed.");
        }
        const isNewAdvisor = role === client_1.Role.ADVISOR && !user.roles.includes(client_1.Role.ADVISOR);
        const newDeactivatedRoles = (user.deactivatedRoles ?? []).filter((r) => r !== role);
        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                role,
                roles: user.roles.includes(role) ? undefined : { push: role },
                deactivatedRoles: newDeactivatedRoles,
                ...(isNewAdvisor ? { specialization: null, bio: null, yearsExperience: null, advisorType: null } : {}),
            },
            select: SAFE_USER_SELECT,
        });
        if (role === client_1.Role.BUSINESS_PARTNER && !user.roles.includes(client_1.Role.BUSINESS_PARTNER)) {
            await (0, partner_coupon_util_1.provisionPartnerReferralCoupon)(this.prisma, id, caller.id);
        }
        const eligibleRoles = [client_1.Role.FARMER, client_1.Role.ADVISOR];
        const hasRemainingEligible = eligibleRoles.includes(role) ||
            (user.roles ?? [])
                .filter((r) => !(user.deactivatedRoles ?? []).includes(r))
                .some((r) => eligibleRoles.includes(r));
        if (eligibleRoles.includes(role)) {
            this.whatsappGroupSyncService.autoAddNewUser(id, user.mobile ?? '', user.name ?? 'User').catch(() => { });
        }
        else if (!hasRemainingEligible) {
            this.whatsappGroupSyncService.autoRemoveUser(id, user.mobile ?? '', user.name ?? 'User').catch(() => { });
        }
        return updated;
    }
    async updateActiveRoles(caller, id, activeRoles) {
        const user = await this.findActiveOrThrow(id);
        this.assertCanManageTarget(caller, user);
        if (user.role === client_1.Role.ADMIN || user.role === client_1.Role.SUPER_ADMIN) {
            throw new common_1.ConflictException("An admin's roles cannot be changed here.");
        }
        if (!activeRoles.includes(client_1.Role.CUSTOMER)) {
            activeRoles = [...activeRoles, client_1.Role.CUSTOMER];
        }
        const currentRoles = user.roles ?? [];
        const currentDeactivated = user.deactivatedRoles ?? [];
        const currentActive = currentRoles.filter((r) => !currentDeactivated.includes(r));
        const toGrant = activeRoles.filter((r) => !currentRoles.includes(r));
        const toReactivate = activeRoles.filter((r) => currentDeactivated.includes(r));
        const toDeactivate = currentActive.filter((r) => !activeRoles.includes(r));
        const newRoles = [...currentRoles, ...toGrant];
        const newDeactivated = [
            ...currentDeactivated.filter((r) => !toReactivate.includes(r)),
            ...toDeactivate,
        ];
        let newPrimary = user.role;
        if (toDeactivate.includes(user.role)) {
            const stillActive = newRoles.filter((r) => !newDeactivated.includes(r));
            newPrimary = stillActive[0] ?? client_1.Role.CUSTOMER;
            if (!newRoles.includes(newPrimary))
                newRoles.push(newPrimary);
        }
        else if (user.role === client_1.Role.CUSTOMER) {
            const activeNonCustomer = newRoles.filter((r) => !newDeactivated.includes(r) && r !== client_1.Role.CUSTOMER);
            if (activeNonCustomer.length > 0) {
                newPrimary = activeNonCustomer[activeNonCustomer.length - 1];
            }
        }
        const isBrandNewAdvisor = toGrant.includes(client_1.Role.ADVISOR);
        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                role: newPrimary,
                roles: newRoles,
                deactivatedRoles: newDeactivated,
                ...(isBrandNewAdvisor ? { specialization: null, bio: null, yearsExperience: null, advisorType: null } : {}),
            },
            select: SAFE_USER_SELECT,
        });
        if (toGrant.includes(client_1.Role.BUSINESS_PARTNER) || toReactivate.includes(client_1.Role.BUSINESS_PARTNER)) {
            await (0, partner_coupon_util_1.provisionPartnerReferralCoupon)(this.prisma, id, caller.id);
        }
        if (toGrant.includes(client_1.Role.FARMER) || toReactivate.includes(client_1.Role.FARMER)) {
            await this.prisma.farmerPlan.upsert({ where: { farmerId: id }, create: { farmerId: id }, update: {} });
        }
        if (toGrant.includes(client_1.Role.GARDENER) || toReactivate.includes(client_1.Role.GARDENER)) {
            await this.prisma.gardenerPlan.upsert({ where: { gardenerId: id }, create: { gardenerId: id }, update: {} });
        }
        const eligibleRoles = [client_1.Role.FARMER, client_1.Role.ADVISOR];
        const gettingEligible = [...toGrant, ...toReactivate].some((r) => eligibleRoles.includes(r));
        const losingEligible = toDeactivate.some((r) => eligibleRoles.includes(r));
        if (gettingEligible) {
            this.whatsappGroupSyncService.autoAddNewUser(id, user.mobile ?? '', user.name ?? 'User').catch(() => { });
        }
        else if (losingEligible) {
            const remainingEligible = newRoles
                .filter((r) => !newDeactivated.includes(r))
                .some((r) => eligibleRoles.includes(r));
            if (!remainingEligible) {
                this.whatsappGroupSyncService.autoRemoveUser(id, user.mobile ?? '', user.name ?? 'User').catch(() => { });
            }
        }
        return updated;
    }
    async getDetail(caller, id) {
        const user = await this.findActiveOrThrow(id);
        this.assertCanManageTarget(caller, user);
        const [farmCount, walletBalance, couponsUsed, orderCount, farmerPlan, gardenerPlan] = await Promise.all([
            this.prisma.farm.count({ where: { ownerId: id, deletedAt: null } }),
            this.walletService.getBalance(id),
            this.prisma.farmerPlanCoupon.findMany({
                where: { usedByFarmerId: id },
                select: { id: true, code: true, plan: true, daysGranted: true, usedAt: true },
                orderBy: { usedAt: 'desc' },
                take: 20,
            }),
            this.prisma.customerOrder.count({ where: { customerId: id } }),
            this.prisma.farmerPlan.findUnique({ where: { farmerId: id } }),
            this.prisma.gardenerPlan.findUnique({ where: { gardenerId: id } }),
        ]);
        const { passwordHash: _passwordHash, securityAnswerHash: _securityAnswerHash, ...safeUser } = user;
        return {
            user: safeUser,
            farmCount,
            walletBalance,
            couponsUsed,
            orderCount,
            farmerPlan,
            gardenerPlan,
        };
    }
    async adminUpdateUser(caller, id, dto) {
        const user = await this.findActiveOrThrow(id);
        this.assertCanManageTarget(caller, user);
        if (dto.mobile && dto.mobile !== user.mobile) {
            const existing = await this.prisma.user.findUnique({ where: { mobile: dto.mobile } });
            if (existing) {
                throw new common_1.ConflictException('Another account already uses this mobile number.');
            }
        }
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: {
                ...(dto.name !== undefined ? { name: dto.name } : {}),
                ...(dto.mobile !== undefined ? { mobile: dto.mobile } : {}),
                ...(dto.email !== undefined ? { email: dto.email } : {}),
                ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl } : {}),
                ...(dto.pincode !== undefined ? { pincode: dto.pincode } : {}),
                ...(dto.postOffice !== undefined ? { postOffice: dto.postOffice } : {}),
                ...(dto.village !== undefined ? { village: dto.village } : {}),
                ...(dto.district !== undefined ? { district: dto.district } : {}),
                ...(dto.state !== undefined ? { state: dto.state } : {}),
                ...(dto.notificationsEnabled !== undefined ? { notificationsEnabled: dto.notificationsEnabled } : {}),
                ...(dto.whatsappGroupEnabled !== undefined ? { whatsappGroupEnabled: dto.whatsappGroupEnabled } : {}),
                ...(dto.whatsappGroupJid !== undefined ? { whatsappGroupJid: dto.whatsappGroupJid } : {}),
                ...(dto.specialization !== undefined ? { specialization: dto.specialization } : {}),
                ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
                ...(dto.yearsExperience !== undefined ? { yearsExperience: dto.yearsExperience } : {}),
                ...(dto.advisorType !== undefined ? { advisorType: dto.advisorType } : {}),
                ...(dto.qualification !== undefined ? { qualification: dto.qualification } : {}),
                ...(dto.profileTitle !== undefined ? { profileTitle: dto.profileTitle } : {}),
                ...(dto.sprayTankSizeL !== undefined ? { sprayTankSizeL: dto.sprayTankSizeL } : {}),
                ...(dto.soilType !== undefined ? { soilType: dto.soilType } : {}),
                ...(dto.waterType !== undefined ? { waterType: dto.waterType } : {}),
                ...(dto.alternativeMobile !== undefined ? { alternativeMobile: dto.alternativeMobile } : {}),
                ...(dto.panNumber !== undefined ? { panNumber: dto.panNumber } : {}),
                ...(dto.upiId !== undefined ? { upiId: dto.upiId } : {}),
                ...(dto.billPrintingAddress !== undefined ? { billPrintingAddress: dto.billPrintingAddress } : {}),
                ...(dto.farmName !== undefined ? { farmName: dto.farmName } : {}),
                ...(dto.farmAddress !== undefined ? { farmAddress: dto.farmAddress } : {}),
                ...(dto.farmMobile !== undefined ? { farmMobile: dto.farmMobile } : {}),
                ...(dto.bankAccountNumber !== undefined ? { bankAccountNumber: dto.bankAccountNumber } : {}),
                ...(dto.bankIfsc !== undefined ? { bankIfsc: dto.bankIfsc } : {}),
                ...(dto.bankAccountHolderName !== undefined ? { bankAccountHolderName: dto.bankAccountHolderName } : {}),
                ...(dto.isSeniorDoctor !== undefined ? { isSeniorDoctor: dto.isSeniorDoctor } : {}),
                ...(dto.seniorDoctorId !== undefined ? { seniorDoctorId: dto.seniorDoctorId } : {}),
                ...(dto.doctorConsultationFee !== undefined ? { doctorConsultationFee: dto.doctorConsultationFee } : {}),
            },
            select: {
                ...SAFE_USER_SELECT,
                specialization: true,
                bio: true,
                yearsExperience: true,
                qualification: true,
                profileTitle: true,
                sprayTankSizeL: true,
                soilType: true,
                waterType: true,
                alternativeMobile: true,
                panNumber: true,
                upiId: true,
                bankAccountNumber: true,
                bankIfsc: true,
                bankAccountHolderName: true,
            },
        });
        if (dto.whatsappGroupEnabled === true) {
            this.whatsappGroupSyncService.autoAddNewUser(id, updatedUser.mobile ?? '', updatedUser.name ?? 'User').catch(() => { });
        }
        else if (dto.whatsappGroupEnabled === false) {
            this.whatsappGroupSyncService.autoRemoveUser(id, updatedUser.mobile ?? '', updatedUser.name ?? 'User').catch(() => { });
        }
        return updatedUser;
    }
    async resetPassword(caller, id, newPassword) {
        const user = await this.findActiveOrThrow(id);
        this.assertCanManageTarget(caller, user);
        const tempPassword = newPassword ?? generateTempPassword();
        const passwordHash = await argon2.hash(tempPassword);
        await this.prisma.user.update({
            where: { id },
            data: {
                passwordHash,
                failedLoginAttempts: 0,
                lockoutUntil: null,
                isPermanentlyBlocked: false,
            },
        });
        return { tempPassword };
    }
    async deactivate(caller, id) {
        const user = await this.findActiveOrThrow(id);
        this.assertCanManageTarget(caller, user);
        if (caller.role !== client_1.Role.SUPER_ADMIN && (user.role === client_1.Role.ADMIN || user.role === client_1.Role.SUPER_ADMIN)) {
            throw new common_1.ConflictException('An admin account cannot be deactivated.');
        }
        if (user.deletedAt) {
            throw new common_1.ConflictException('User is already deactivated.');
        }
        const timestamp = Date.now();
        const newMobile = user.mobile.includes('_del_') ? user.mobile : `${user.mobile}_del_${timestamp}`;
        const newEmail = user.email ? (user.email.includes('_del_') ? user.email : `${user.email}_del_${timestamp}`) : null;
        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                mobile: newMobile,
                email: newEmail,
            },
            select: SAFE_USER_SELECT,
        });
        this.whatsappGroupSyncService.autoRemoveUser(id, user.mobile ?? '', user.name ?? 'User').catch(() => { });
        return updated;
    }
    async reactivate(caller, id) {
        const user = await this.findActiveOrThrow(id);
        this.assertCanManageTarget(caller, user);
        if (!user.deletedAt) {
            throw new common_1.ConflictException('User is already active.');
        }
        const restoredMobile = user.mobile.replace(/_del_\d+$/, '');
        const restoredEmail = user.email ? user.email.replace(/_del_\d+$/, '') : null;
        const existing = await this.prisma.user.findFirst({
            where: { mobile: restoredMobile, deletedAt: null, id: { not: id } },
        });
        if (existing) {
            throw new common_1.ConflictException(`Cannot reactivate: Mobile ${restoredMobile} is already in use by another active account.`);
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                deletedAt: null,
                mobile: restoredMobile,
                email: restoredEmail,
            },
            select: SAFE_USER_SELECT,
        });
        const eligibleRoles = [client_1.Role.FARMER, client_1.Role.ADVISOR];
        const isEligible = eligibleRoles.includes(user.role) ||
            (user.roles ?? [])
                .filter((r) => !(user.deactivatedRoles ?? []).includes(r))
                .some((r) => eligibleRoles.includes(r));
        if (isEligible) {
            this.whatsappGroupSyncService.autoAddNewUser(id, updated.mobile ?? '', updated.name ?? 'User').catch(() => { });
        }
        return updated;
    }
    async updateOperatorPermissions(id, permissions) {
        const user = await this.findActiveOrThrow(id);
        if (user.role !== client_1.Role.OPERATOR) {
            throw new common_1.ConflictException('Only Operator accounts have grantable permissions.');
        }
        return this.prisma.user.update({
            where: { id },
            data: { operatorPermissions: permissions },
            select: SAFE_USER_SELECT,
        });
    }
    async updateMyAddress(user, dto) {
        let newPasswordHash = undefined;
        if (dto.password && dto.password.trim().length >= 4) {
            newPasswordHash = await argon2.hash(dto.password.trim());
        }
        let cleanMobile = undefined;
        if (dto.mobile && dto.mobile.trim()) {
            const rawDigits = dto.mobile.replace(/\D/g, '');
            const num = rawDigits.slice(-10);
            if (num.length === 10) {
                cleanMobile = num;
                const existing = await this.prisma.user.findFirst({
                    where: {
                        mobile: cleanMobile,
                        deletedAt: null,
                        id: { not: user.id },
                    },
                });
                if (existing) {
                    throw new common_1.ConflictException('An account with this mobile number already exists.');
                }
            }
        }
        const updated = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                ...(cleanMobile ? { mobile: cleanMobile } : {}),
                ...(newPasswordHash ? { passwordHash: newPasswordHash } : {}),
                ...(dto.name !== undefined ? { name: dto.name } : {}),
                ...(dto.email !== undefined ? { email: dto.email } : {}),
                ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl } : {}),
                ...(dto.pincode !== undefined ? { pincode: dto.pincode } : {}),
                ...(dto.postOffice !== undefined ? { postOffice: dto.postOffice } : {}),
                ...(dto.village !== undefined ? { village: dto.village } : {}),
                ...(dto.district !== undefined ? { district: dto.district } : {}),
                ...(dto.state !== undefined ? { state: dto.state } : {}),
                ...(dto.notificationsEnabled !== undefined ? { notificationsEnabled: dto.notificationsEnabled } : {}),
                ...(dto.whatsappGroupEnabled !== undefined ? { whatsappGroupEnabled: dto.whatsappGroupEnabled } : {}),
                ...(dto.weatherAlertMinTempC !== undefined ? { weatherAlertMinTempC: dto.weatherAlertMinTempC } : {}),
                ...(dto.weatherAlertMaxTempC !== undefined ? { weatherAlertMaxTempC: dto.weatherAlertMaxTempC } : {}),
                ...(dto.weatherAlertRainEnabled !== undefined ? { weatherAlertRainEnabled: dto.weatherAlertRainEnabled } : {}),
                ...(dto.locationPreference !== undefined ? { locationPreference: dto.locationPreference } : {}),
                ...(dto.gpsLat !== undefined ? { gpsLat: dto.gpsLat } : {}),
                ...(dto.gpsLng !== undefined ? { gpsLng: dto.gpsLng } : {}),
                ...(dto.gpsLocationName !== undefined ? { gpsLocationName: dto.gpsLocationName } : {}),
                ...(dto.billPrintingAddress !== undefined ? { billPrintingAddress: dto.billPrintingAddress } : {}),
                ...(dto.upiId !== undefined ? { upiId: dto.upiId } : {}),
                ...(dto.farmName !== undefined ? { farmName: dto.farmName } : {}),
                ...(dto.farmAddress !== undefined ? { farmAddress: dto.farmAddress } : {}),
                ...(dto.farmMobile !== undefined ? { farmMobile: dto.farmMobile } : {}),
            },
            select: SAFE_USER_SELECT,
        });
        if (dto.whatsappGroupEnabled === true) {
            this.whatsappGroupSyncService.autoAddNewUser(user.id, updated.mobile ?? '', updated.name ?? 'User').catch(() => { });
        }
        else if (dto.whatsappGroupEnabled === false) {
            this.whatsappGroupSyncService.autoRemoveUser(user.id, updated.mobile ?? '', updated.name ?? 'User').catch(() => { });
        }
        return updated;
    }
    async updateFarmerProfile(user, dto) {
        const updated = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                ...(dto.name !== undefined ? { name: dto.name } : {}),
                ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl } : {}),
                ...(dto.sprayTankSizeL !== undefined ? { sprayTankSizeL: dto.sprayTankSizeL } : {}),
                ...(dto.soilType !== undefined ? { soilType: dto.soilType } : {}),
                ...(dto.waterType !== undefined ? { waterType: dto.waterType } : {}),
                ...(dto.pincode !== undefined ? { pincode: dto.pincode } : {}),
                ...(dto.postOffice !== undefined ? { postOffice: dto.postOffice } : {}),
                ...(dto.village !== undefined ? { village: dto.village } : {}),
                ...(dto.district !== undefined ? { district: dto.district } : {}),
                ...(dto.state !== undefined ? { state: dto.state } : {}),
                ...(dto.upiId !== undefined ? { upiId: dto.upiId } : {}),
                ...(dto.billPrintingAddress !== undefined ? { billPrintingAddress: dto.billPrintingAddress } : {}),
                ...(dto.farmName !== undefined ? { farmName: dto.farmName } : {}),
                ...(dto.farmAddress !== undefined ? { farmAddress: dto.farmAddress } : {}),
                ...(dto.farmMobile !== undefined ? { farmMobile: dto.farmMobile } : {}),
                ...(dto.whatsappGroupEnabled !== undefined ? { whatsappGroupEnabled: dto.whatsappGroupEnabled } : {}),
            },
            select: SAFE_USER_SELECT,
        });
        if (dto.whatsappGroupEnabled === true) {
            this.whatsappGroupSyncService.autoAddNewUser(user.id, updated.mobile ?? '', updated.name ?? 'User').catch(() => { });
        }
        else if (dto.whatsappGroupEnabled === false) {
            this.whatsappGroupSyncService.autoRemoveUser(user.id, updated.mobile ?? '', updated.name ?? 'User').catch(() => { });
        }
        return updated;
    }
    async getFarmerProfileStatus(user) {
        const farmer = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { photoUrl: true, sprayTankSizeL: true, soilType: true, waterType: true },
        });
        if (!farmer) {
            throw new common_1.NotFoundException('User not found.');
        }
        const missingFields = [
            ['photoUrl', farmer.photoUrl],
            ['sprayTankSizeL', farmer.sprayTankSizeL],
            ['soilType', farmer.soilType],
            ['waterType', farmer.waterType],
        ]
            .filter(([, value]) => value === null || value === undefined)
            .map(([field]) => field);
        return { profileComplete: missingFields.length === 0, missingFields, profile: farmer };
    }
    async updateAdvisorProfile(user, dto) {
        return this.prisma.user.update({
            where: { id: user.id },
            data: {
                ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl } : {}),
                ...(dto.pincode !== undefined ? { pincode: dto.pincode } : {}),
                ...(dto.postOffice !== undefined ? { postOffice: dto.postOffice } : {}),
                ...(dto.specialization !== undefined ? { specialization: dto.specialization } : {}),
                ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
                ...(dto.yearsExperience !== undefined ? { yearsExperience: dto.yearsExperience } : {}),
                ...(dto.email !== undefined ? { email: dto.email } : {}),
                ...(dto.village !== undefined ? { village: dto.village } : {}),
                ...(dto.district !== undefined ? { district: dto.district } : {}),
                ...(dto.state !== undefined ? { state: dto.state } : {}),
                ...(dto.advisorType !== undefined ? { advisorType: dto.advisorType } : {}),
                ...(dto.notificationsEnabled !== undefined ? { notificationsEnabled: dto.notificationsEnabled } : {}),
                ...(dto.qualification !== undefined ? { qualification: dto.qualification } : {}),
                ...(dto.profileTitle !== undefined ? { profileTitle: dto.profileTitle } : {}),
                ...(dto.alternativeMobile !== undefined ? { alternativeMobile: dto.alternativeMobile } : {}),
                ...(dto.panNumber !== undefined ? { panNumber: dto.panNumber } : {}),
                ...(dto.upiId !== undefined ? { upiId: dto.upiId } : {}),
                ...(dto.bankAccountNumber !== undefined ? { bankAccountNumber: dto.bankAccountNumber } : {}),
                ...(dto.bankIfsc !== undefined ? { bankIfsc: dto.bankIfsc } : {}),
                ...(dto.bankAccountHolderName !== undefined ? { bankAccountHolderName: dto.bankAccountHolderName } : {}),
            },
            select: {
                ...SAFE_USER_SELECT,
                photoUrl: true,
                pincode: true,
                postOffice: true,
                specialization: true,
                bio: true,
                yearsExperience: true,
                qualification: true,
                profileTitle: true,
                alternativeMobile: true,
                panNumber: true,
                upiId: true,
                bankAccountNumber: true,
                bankIfsc: true,
                bankAccountHolderName: true,
            },
        });
    }
    async getAdvisorProfileStatus(user) {
        const advisor = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: Object.fromEntries(partner_profile_util_1.ADVISOR_PROFILE_FIELDS.map((f) => [f, true])),
        });
        if (!advisor) {
            throw new common_1.NotFoundException('User not found.');
        }
        return { ...(0, partner_profile_util_1.getAdvisorPayoutProfileStatus)(advisor), profile: advisor };
    }
    async updatePartnerProfile(user, dto) {
        return this.prisma.user.update({
            where: { id: user.id },
            data: {
                ...(dto.email !== undefined ? { email: dto.email } : {}),
                ...(dto.alternativeMobile !== undefined ? { alternativeMobile: dto.alternativeMobile } : {}),
                ...(dto.panNumber !== undefined ? { panNumber: dto.panNumber } : {}),
                ...(dto.upiId !== undefined ? { upiId: dto.upiId } : {}),
                ...(dto.bankAccountNumber !== undefined ? { bankAccountNumber: dto.bankAccountNumber } : {}),
                ...(dto.bankIfsc !== undefined ? { bankIfsc: dto.bankIfsc } : {}),
                ...(dto.bankAccountHolderName !== undefined ? { bankAccountHolderName: dto.bankAccountHolderName } : {}),
            },
            select: {
                ...SAFE_USER_SELECT,
                alternativeMobile: true,
                panNumber: true,
                upiId: true,
                bankAccountNumber: true,
                bankIfsc: true,
                bankAccountHolderName: true,
            },
        });
    }
    async getPartnerProfileStatus(user) {
        const partner = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: Object.fromEntries(partner_profile_util_1.BUSINESS_PARTNER_PROFILE_FIELDS.map((f) => [f, true])),
        });
        if (!partner) {
            throw new common_1.NotFoundException('User not found.');
        }
        return { ...(0, partner_profile_util_1.getPartnerProfileStatus)(partner), profile: partner };
    }
    async deleteUserByAdmin(caller, id) {
        if (caller.role !== client_1.Role.SUPER_ADMIN && !caller.roles?.includes(client_1.Role.SUPER_ADMIN)) {
            throw new common_1.ForbiddenException('Only Super Admin can delete user records.');
        }
        if (caller.id === id) {
            throw new common_1.ConflictException('Super Admin cannot delete their own account.');
        }
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User record not found.');
        }
        if (user.mobile === '9872066901') {
            throw new common_1.ConflictException('Primary Super Admin account 9872066901 cannot be deleted.');
        }
        if (!user.deletedAt) {
            throw new common_1.BadRequestException('User must be soft-deleted (deactivated) before this operation. Please deactivate the user first.');
        }
        const ts = Date.now();
        const delMobile = user.mobile ? `DEL_${user.mobile}_${ts}` : `DEL_UNKNOWN_${id}_${ts}`;
        const delEmail = user.email ? `DEL_${user.email}_${ts}` : null;
        await this.prisma.user.update({
            where: { id },
            data: {
                name: 'Deleted Account',
                mobile: delMobile,
                email: delEmail,
                photoUrl: null,
                village: null,
                district: null,
                state: null,
                pincode: null,
                postOffice: null,
                upiId: null,
                billPrintingAddress: null,
                farmName: null,
                farmAddress: null,
                farmMobile: null,
                specialization: null,
                bio: null,
                yearsExperience: null,
                gpsLat: null,
                gpsLng: null,
                gpsLocationName: null,
                securityQuestion: null,
                securityAnswerHash: null,
                passwordHash: 'ACCOUNT_DELETED_PERMANENTLY',
                deletedAt: new Date(),
            },
        });
        this.whatsappGroupSyncService.autoRemoveUser(id, user.mobile ?? '', user.name ?? 'User').catch(() => { });
        return {
            success: true,
            message: `Account for ${user.name} (${user.kingId ?? user.mobile}) has been anonymized. King ID and all linked historical records are retained for audit. Personal information permanently removed.`,
        };
    }
    async assignStaffRole(caller, dto) {
        const user = await this.findActiveOrThrow(dto.userId);
        this.assertCanManageTarget(caller, user);
        const updated = await this.prisma.user.update({
            where: { id: dto.userId },
            data: {
                role: dto.role,
                roles: Array.from(new Set([...(user.roles || []), dto.role])),
                assignedStaffId: dto.staffId || `STAFF-${Date.now().toString(36).toUpperCase()}`,
                advisorType: dto.advisorType || user.advisorType,
                profileStatus: 'PENDING_COMPLETION',
                isApproved: false,
            },
            select: SAFE_USER_SELECT,
        });
        await this.prisma.isoAuditLog.create({
            data: {
                action: 'STAFF_ASSIGNMENT',
                actorId: caller.id,
                actorName: caller.name,
                details: {
                    assignedUserId: user.id,
                    assignedRole: dto.role,
                    staffId: updated.assignedStaffId,
                },
            },
        });
        return updated;
    }
    async submitProfileCompletion(currentUser, data) {
        const user = await this.findActiveOrThrow(currentUser.id);
        const updated = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                qualification: data.qualification ?? user.qualification,
                profileTitle: data.profileTitle ?? user.profileTitle,
                specialization: data.specialization ?? user.specialization,
                yearsExperience: data.yearsExperience ?? user.yearsExperience,
                bio: data.bio ?? user.bio,
                photoUrl: data.photoUrl ?? user.photoUrl,
                upiId: data.upiId ?? user.upiId,
                bankAccountNumber: data.bankAccountNumber ?? user.bankAccountNumber,
                bankIfsc: data.bankIfsc ?? user.bankIfsc,
                bankAccountHolderName: data.bankAccountHolderName ?? user.bankAccountHolderName,
                panNumber: data.panNumber ?? user.panNumber,
                alternativeMobile: data.alternativeMobile ?? user.alternativeMobile,
                billPrintingAddress: data.billPrintingAddress ?? user.billPrintingAddress,
                profileStatus: 'UNDER_REVIEW',
            },
            select: SAFE_USER_SELECT,
        });
        await this.prisma.isoAuditLog.create({
            data: {
                action: 'PROFILE_SUBMISSION',
                actorId: currentUser.id,
                actorName: currentUser.name,
                details: {
                    role: user.role,
                    profileStatus: 'UNDER_REVIEW',
                },
            },
        });
        return updated;
    }
    async getPendingApprovals() {
        return this.prisma.user.findMany({
            where: {
                profileStatus: 'UNDER_REVIEW',
                deletedAt: null,
            },
            select: SAFE_USER_SELECT,
            orderBy: { updatedAt: 'desc' },
        });
    }
    async approveProfile(caller, userId) {
        const user = await this.findActiveOrThrow(userId);
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                isApproved: true,
                profileStatus: 'APPROVED',
                profileRejectionReason: null,
            },
            select: SAFE_USER_SELECT,
        });
        await this.prisma.isoAuditLog.create({
            data: {
                action: 'PROFILE_APPROVAL',
                actorId: caller.id,
                actorName: caller.name,
                details: {
                    approvedUserId: userId,
                    role: user.role,
                    assignedStaffId: user.assignedStaffId,
                },
            },
        });
        return updated;
    }
    async rejectProfile(caller, userId, reason) {
        const user = await this.findActiveOrThrow(userId);
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                isApproved: false,
                profileStatus: 'REJECTED',
                profileRejectionReason: reason,
            },
            select: SAFE_USER_SELECT,
        });
        await this.prisma.isoAuditLog.create({
            data: {
                action: 'PROFILE_REJECTION',
                actorId: caller.id,
                actorName: caller.name,
                details: {
                    rejectedUserId: userId,
                    reason,
                },
            },
        });
        return updated;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService,
        whatsapp_group_sync_service_1.WhatsAppGroupSyncService])
], UsersService);
//# sourceMappingURL=users.service.js.map