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
    upiId: true,
    billPrintingAddress: true,
    createdAt: true,
    deletedAt: true,
};
function generateTempPassword() {
    return (0, crypto_1.randomBytes)(8).toString('hex').slice(0, 10);
}
let UsersService = class UsersService {
    prisma;
    walletService;
    whatsappGroupSyncService;
    constructor(prisma, walletService, whatsappGroupSyncService) {
        this.prisma = prisma;
        this.walletService = walletService;
        this.whatsappGroupSyncService = whatsappGroupSyncService;
    }
    async list(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const status = query.status ?? 'all';
        const where = {
            ...(query.role
                ? {
                    OR: [
                        { role: query.role },
                        {
                            AND: [
                                { roles: { has: query.role } },
                                { NOT: { deactivatedRoles: { has: query.role } } },
                            ],
                        },
                    ],
                }
                : {}),
            ...(status === 'active' ? { deletedAt: null } : {}),
            ...(status === 'inactive' ? { deletedAt: { not: null } } : {}),
            ...(query.search
                ? {
                    OR: [
                        { name: { contains: query.search, mode: client_1.Prisma.QueryMode.insensitive } },
                        { mobile: { contains: query.search } },
                        { kingId: { contains: query.search, mode: client_1.Prisma.QueryMode.insensitive } },
                    ],
                }
                : {}),
        };
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
        await this.prisma.user.update({
            where: { id: user.id },
            data: { deletedAt: new Date() },
        });
        this.whatsappGroupSyncService.autoRemoveUser(user.id, user.mobile ?? '', user.name ?? 'User').catch(() => { });
        return { success: true, message: 'Account and associated data deleted successfully.' };
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
            ? [client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN, client_1.Role.FARMER, client_1.Role.BUSINESS_PARTNER]
            : isPartnerDeactivated
                ? [client_1.Role.FARMER]
                : [client_1.Role.FARMER, client_1.Role.BUSINESS_PARTNER];
        const newRoles = Array.from(new Set([...currentRoles, ...rolesToAdd]));
        const newDeactivated = currentDeactivated.filter((r) => r !== client_1.Role.FARMER && r !== client_1.Role.SUPER_ADMIN);
        const primaryRole = isSuperAdminMobile ? client_1.Role.SUPER_ADMIN : client_1.Role.FARMER;
        const profileData = {};
        if (dto) {
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
        if (!isPartnerDeactivated) {
            await (0, partner_coupon_util_1.provisionPartnerReferralCoupon)(this.prisma, user.id, user.id);
        }
        return updated;
    }
    async becomeGardener(user) {
        const existingUser = await this.prisma.user.findUniqueOrThrow({
            where: { id: user.id },
            select: { roles: true, deactivatedRoles: true },
        });
        const currentRoles = existingUser.roles ?? [];
        const currentDeactivated = existingUser.deactivatedRoles ?? [];
        const isPartnerDeactivated = currentDeactivated.includes(client_1.Role.BUSINESS_PARTNER);
        const rolesToAdd = isPartnerDeactivated ? [client_1.Role.GARDENER] : [client_1.Role.GARDENER, client_1.Role.BUSINESS_PARTNER];
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
        if (!isPartnerDeactivated) {
            await (0, partner_coupon_util_1.provisionPartnerReferralCoupon)(this.prisma, user.id, user.id);
        }
        return updated;
    }
    createAdmin(dto) {
        return this.createStaff(dto, client_1.Role.ADMIN);
    }
    async findActiveOrThrow(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        return user;
    }
    async lookupByKingId(kingId) {
        const user = await this.prisma.user.findFirst({
            where: { kingId: kingId.toUpperCase(), roles: { has: client_1.Role.FARMER }, deletedAt: null },
            select: { id: true, name: true, kingId: true, mobile: true, role: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('No farmer found with that FarmsKing ID.');
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
        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                role,
                roles: user.roles.includes(role) ? undefined : { push: role },
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
                ...(dto.bankAccountNumber !== undefined ? { bankAccountNumber: dto.bankAccountNumber } : {}),
                ...(dto.bankIfsc !== undefined ? { bankIfsc: dto.bankIfsc } : {}),
                ...(dto.bankAccountHolderName !== undefined ? { bankAccountHolderName: dto.bankAccountHolderName } : {}),
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
        await this.prisma.user.update({ where: { id }, data: { passwordHash } });
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
        const updated = await this.prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() },
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
        const updated = await this.prisma.user.update({
            where: { id },
            data: { deletedAt: null },
            select: SAFE_USER_SELECT,
        });
        const eligibleRoles = [client_1.Role.FARMER, client_1.Role.ADVISOR];
        const isEligible = eligibleRoles.includes(user.role) ||
            (user.roles ?? [])
                .filter((r) => !(user.deactivatedRoles ?? []).includes(r))
                .some((r) => eligibleRoles.includes(r));
        if (isEligible) {
            this.whatsappGroupSyncService.autoAddNewUser(id, user.mobile ?? '', user.name ?? 'User').catch(() => { });
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
        return this.prisma.user.update({
            where: { id: user.id },
            data: {
                ...(dto.name !== undefined ? { name: dto.name } : {}),
                ...(dto.email !== undefined ? { email: dto.email } : {}),
                ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl } : {}),
                ...(dto.pincode !== undefined ? { pincode: dto.pincode } : {}),
                ...(dto.postOffice !== undefined ? { postOffice: dto.postOffice } : {}),
                ...(dto.village !== undefined ? { village: dto.village } : {}),
                ...(dto.district !== undefined ? { district: dto.district } : {}),
                ...(dto.state !== undefined ? { state: dto.state } : {}),
                ...(dto.notificationsEnabled !== undefined ? { notificationsEnabled: dto.notificationsEnabled } : {}),
                ...(dto.weatherAlertMinTempC !== undefined ? { weatherAlertMinTempC: dto.weatherAlertMinTempC } : {}),
                ...(dto.weatherAlertMaxTempC !== undefined ? { weatherAlertMaxTempC: dto.weatherAlertMaxTempC } : {}),
                ...(dto.weatherAlertRainEnabled !== undefined ? { weatherAlertRainEnabled: dto.weatherAlertRainEnabled } : {}),
                ...(dto.billPrintingAddress !== undefined ? { billPrintingAddress: dto.billPrintingAddress } : {}),
            },
            select: {
                ...SAFE_USER_SELECT,
                photoUrl: true,
                pincode: true,
                postOffice: true,
            },
        });
    }
    async updateFarmerProfile(user, dto) {
        return this.prisma.user.update({
            where: { id: user.id },
            data: {
                ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl } : {}),
                ...(dto.sprayTankSizeL !== undefined ? { sprayTankSizeL: dto.sprayTankSizeL } : {}),
                ...(dto.soilType !== undefined ? { soilType: dto.soilType } : {}),
                ...(dto.waterType !== undefined ? { waterType: dto.waterType } : {}),
                ...(dto.pincode !== undefined ? { pincode: dto.pincode } : {}),
                ...(dto.postOffice !== undefined ? { postOffice: dto.postOffice } : {}),
                ...(dto.village !== undefined ? { village: dto.village } : {}),
                ...(dto.district !== undefined ? { district: dto.district } : {}),
                ...(dto.state !== undefined ? { state: dto.state } : {}),
                ...(dto.billPrintingAddress !== undefined ? { billPrintingAddress: dto.billPrintingAddress } : {}),
            },
            select: {
                ...SAFE_USER_SELECT,
                photoUrl: true,
                sprayTankSizeL: true,
                soilType: true,
                waterType: true,
                pincode: true,
                postOffice: true,
            },
        });
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
        await this.prisma.$transaction(async (tx) => {
            await tx.user.updateMany({ where: { referredById: id }, data: { referredById: null } });
            await tx.farmerPlan.deleteMany({ where: { farmerId: id } });
            await tx.gardenerPlan.deleteMany({ where: { gardenerId: id } });
            await tx.advisorTierPlan.deleteMany({ where: { advisorId: id } });
            await tx.advisorAssignment.deleteMany({ where: { OR: [{ farmerId: id }, { advisorId: id }, { assignedById: id }] } });
            await tx.callRequest.deleteMany({ where: { OR: [{ farmerId: id }, { advisorId: id }] } });
            await tx.partnerAssignment.deleteMany({ where: { OR: [{ businessPartnerId: id }, { customerId: id }] } });
            await tx.advisorSubscription.deleteMany({ where: { OR: [{ farmerId: id }, { approvedById: id }] } });
            await tx.walletTransaction.deleteMany({ where: { OR: [{ userId: id }, { relatedUserId: id }] } });
            await tx.withdrawalRequest.deleteMany({ where: { OR: [{ businessPartnerId: id }, { processedById: id }] } });
            await tx.planPaymentRequest.deleteMany({ where: { OR: [{ farmerId: id }, { confirmedById: id }] } });
            await tx.farmerPlanPaymentRequest.deleteMany({ where: { OR: [{ farmerId: id }, { confirmedById: id }] } });
            await tx.saleBill.deleteMany({ where: { farmerId: id } });
            await tx.paymentReceipt.deleteMany({ where: { farmerId: id } });
            await tx.notification.deleteMany({ where: { userId: id } });
            await tx.adminChatMessage.deleteMany({ where: { OR: [{ farmerId: id }, { adminId: id }] } });
            await tx.message.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } });
            await tx.cropProblem.deleteMany({ where: { OR: [{ reportedById: id }, { assignedAdvisorId: id }] } });
            await tx.groupVoiceCallParticipant.deleteMany({ where: { userId: id } });
            await tx.labourEntry.deleteMany({ where: { recordedById: id } });
            await tx.labourWorkEntry.deleteMany({ where: { OR: [{ recordedById: id }, { farmerId: id }] } });
            await tx.labourPayment.deleteMany({ where: { OR: [{ recordedById: id }, { farmerId: id }] } });
            await tx.labourWorker.deleteMany({ where: { OR: [{ farmerId: id }, { userId: id }] } });
            await tx.expense.deleteMany({ where: { recordedById: id } });
            await tx.sale.deleteMany({ where: { recordedById: id } });
            await tx.payment.deleteMany({ where: { recordedById: id } });
            await tx.party.deleteMany({ where: { ownerId: id } });
            await tx.unifiedParty.deleteMany({ where: { OR: [{ ownerFarmerId: id }, { userId: id }] } });
            await tx.customer.deleteMany({ where: { farmerId: id } });
            await tx.farm.deleteMany({ where: { ownerId: id } });
            await tx.customerOrder.deleteMany({ where: { customerId: id } });
            await tx.customerAddress.deleteMany({ where: { ownerId: id } });
            await tx.couponRedemption.deleteMany({ where: { customerId: id } });
            await tx.coupon.deleteMany({ where: { OR: [{ businessPartnerId: id }, { createdById: id }] } });
            await tx.farmerPlanCoupon.deleteMany({ where: { OR: [{ createdById: id }, { assignedFarmerId: id }, { assignedAdvisorId: id }, { assignedBusinessPartnerId: id }] } });
            await tx.gardenerPlanCoupon.deleteMany({ where: { OR: [{ createdById: id }, { assignedGardenerId: id }] } });
            await tx.auditLog.deleteMany({ where: { actorId: id } });
            await tx.upload.deleteMany({ where: { uploadedById: id } });
            await tx.kingConnectLink.deleteMany({ where: { OR: [{ initiatorId: id }, { receiverId: id }] } });
            await tx.p2pLedgerSyncRequest.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } });
            await tx.demandRequest.deleteMany({ where: { OR: [{ requesterId: id }, { farmerId: id }] } });
            await tx.kingPaymentRequest.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } });
            await tx.voiceAILog.deleteMany({ where: { userId: id } });
            await tx.user.delete({ where: { id } });
        }, {
            timeout: 30000,
            maxWait: 10000,
        });
        this.whatsappGroupSyncService.autoRemoveUser(id, user.mobile ?? '', user.name ?? 'User').catch(() => { });
        return { success: true, message: `User ${user.name} (${user.mobile}) and all associated records deleted permanently.` };
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