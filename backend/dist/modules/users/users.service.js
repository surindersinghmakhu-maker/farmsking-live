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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
const prisma_service_1 = require("../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
const notifications_service_1 = require("../notifications/notifications.service");
const app_settings_service_1 = require("../app-settings/app-settings.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
const email_service_1 = require("../email/email.service");
const user_session_service_1 = require("../auth/user-session.service");
const whatsapp_group_sync_service_1 = require("../whatsapp/whatsapp-group-sync.service");
const king_id_util_1 = require("../../common/utils/king-id.util");
const role_policy_util_1 = require("../../common/utils/role-policy.util");
const invite_coupon_util_1 = require("../../common/utils/invite-coupon.util");
const common_2 = require("@nestjs/common");
const auth_1 = require("firebase-admin/auth");
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
    isEmailVerified: true,
    isPhoneVerified: true,
    pendingEmail: true,
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
    kycVerified: true,
    termsAcceptedAt: true,
    createdAt: true,
    deletedAt: true,
    isPermanentlyBlocked: true,
    sellerStore: {
        select: {
            id: true,
            storeName: true,
            kycStatus: true,
        },
    },
    employerFarmer: {
        select: {
            id: true,
            name: true,
            kingId: true,
            mobile: true,
            farmName: true,
        },
    },
    labourWorkerUser: {
        where: { deletedAt: null },
        select: {
            id: true,
            name: true,
            farmerId: true,
            farmer: {
                select: {
                    id: true,
                    name: true,
                    kingId: true,
                    mobile: true,
                    farmName: true,
                },
            },
        },
    },
};
function generateTempPassword() {
    return (0, crypto_1.randomBytes)(8).toString('hex').slice(0, 10);
}
let UsersService = class UsersService {
    constructor(prisma, walletService, whatsappGroupSyncService, notificationsService, appSettingsService, whatsappBotService, emailService, userSessionService, jwtService) {
        this.prisma = prisma;
        this.walletService = walletService;
        this.whatsappGroupSyncService = whatsappGroupSyncService;
        this.notificationsService = notificationsService;
        this.appSettingsService = appSettingsService;
        this.whatsappBotService = whatsappBotService;
        this.emailService = emailService;
        this.userSessionService = userSessionService;
        this.jwtService = jwtService;
        this.deleteMeOtpStore = new Map();
        this.adminCreateOtpStore = new Map();
    }
    async onModuleInit() {
    }
    stripDeletedMarkers(value) {
        return value
            .trim()
            .replace(/^DEL_/i, '')
            .replace(/_del_[a-z0-9_]+$/i, '')
            .replace(/_\d{10,}$/i, '');
    }
    async generateUniqueDeletedIdentifier(currentValue, field, fallbackId, excludeUserId) {
        if (!currentValue) {
            if (field === 'email')
                return null;
            return `UNKNOWN_${fallbackId}_del_A`;
        }
        const base = this.stripDeletedMarkers(currentValue) || (field === 'mobile' ? `UNKNOWN_${fallbackId}` : currentValue);
        const prefix = `${base}_del_`;
        if (currentValue.startsWith(prefix)) {
            return currentValue;
        }
        const usedValues = new Set();
        if (typeof this.prisma.user?.findMany === 'function') {
            try {
                const existing = await this.prisma.user.findMany({
                    where: {
                        [field]: { startsWith: prefix },
                        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
                    },
                    select: field === 'mobile' ? { mobile: true } : { email: true },
                });
                for (const row of existing) {
                    const val = field === 'mobile' ? row.mobile : row.email;
                    if (val)
                        usedValues.add(val);
                }
            }
            catch {
            }
        }
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let i = 0; i < alphabet.length; i += 1) {
            const candidate = `${prefix}${alphabet[i]}`;
            if (!usedValues.has(candidate)) {
                return candidate;
            }
        }
        for (let i = 0; i < alphabet.length; i += 1) {
            for (let j = 0; j < alphabet.length; j += 1) {
                const candidate = `${prefix}${alphabet[i]}${alphabet[j]}`;
                if (!usedValues.has(candidate)) {
                    return candidate;
                }
            }
        }
        return `${prefix}${(0, crypto_1.randomBytes)(4).toString('hex').toUpperCase()}`;
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
        const [rawItems, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: {
                    ...SAFE_USER_SELECT,
                    passwordHash: true,
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);
        const items = rawItems.map(({ passwordHash, ...rest }) => {
            const presence = !rest.deletedAt && !rest.isPermanentlyBlocked
                ? this.userSessionService?.getUserPresence(rest.id)
                : undefined;
            return {
                ...rest,
                isPermanentlyDeleted: passwordHash === 'ACCOUNT_DELETED_PERMANENTLY',
                isOnline: Boolean(presence?.isOnline),
                lastSeenAt: presence?.lastSeenAt ? new Date(presence.lastSeenAt).toISOString() : null,
            };
        });
        return { items, total, page, limit };
    }
    async searchBusinessPartners(q) {
        const query = (q ?? '').trim();
        return this.prisma.user.findMany({
            where: {
                OR: [
                    { role: client_1.Role.AGENT },
                    {
                        AND: [
                            { roles: { has: client_1.Role.AGENT } },
                            { NOT: { deactivatedRoles: { has: client_1.Role.AGENT } } },
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
                roles: (role === client_1.Role.ADMIN || role === client_1.Role.SUPER_ADMIN || role === client_1.Role.ACCOUNTANT) ? [role] : [role, client_1.Role.CUSTOMER],
            },
            select: SAFE_USER_SELECT,
        });
        await (0, invite_coupon_util_1.provisionInviteCoupon)(this.prisma, user.id);
        return { user, tempPassword };
    }
    async getMe(user) {
        return this.prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: SAFE_USER_SELECT });
    }
    async requestDeleteMeOtp(user, mobile) {
        const dbUser = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, mobile: true, farmMobile: true, email: true, name: true },
        });
        if (!dbUser) {
            throw new common_1.NotFoundException('User account not found.');
        }
        const regDigits = (dbUser.mobile || '').replace(/\D/g, '').slice(-10);
        const farmDigits = (dbUser.farmMobile || '').replace(/\D/g, '').slice(-10);
        const requestedDigits = mobile ? mobile.replace(/\D/g, '').slice(-10) : regDigits;
        if (!requestedDigits || (requestedDigits !== regDigits && requestedDigits !== farmDigits)) {
            throw new common_1.BadRequestException('Please enter the 10-digit mobile number registered with this account.');
        }
        const otpCode = (0, crypto_1.randomInt)(100000, 1000000).toString();
        this.deleteMeOtpStore.set(user.id, {
            otp: otpCode,
            expiresAt: Date.now() + 10 * 60 * 1000,
            attempts: 0,
        });
        const isDev = process.env.NODE_ENV !== 'production';
        const channels = [];
        if (this.whatsappBotService) {
            try {
                const waRes = await this.whatsappBotService.sendOtpMessage(requestedDigits, otpCode);
                if (waRes?.success)
                    channels.push('WhatsApp');
            }
            catch { }
        }
        if (dbUser.email && !dbUser.email.includes('placeholder') && this.emailService) {
            try {
                const emailSent = await this.emailService.sendEmailOtp(dbUser.email, otpCode);
                if (emailSent)
                    channels.push('Email');
            }
            catch { }
        }
        return {
            success: true,
            deliveredVia: channels,
            message: channels.length > 0
                ? `6-digit account deletion OTP sent via ${channels.join(' & ')}.`
                : isDev
                    ? 'Local development mode: 6-digit account deletion OTP generated.'
                    : 'Verification code generated for account deletion.',
            devOtp: isDev ? otpCode : undefined,
            expiresInSeconds: 600,
        };
    }
    async deleteMe(user, verification) {
        const dbUser = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, mobile: true, farmMobile: true, email: true, name: true, kingId: true },
        });
        if (!dbUser) {
            throw new common_1.NotFoundException('User account not found.');
        }
        const regDigits = (dbUser.mobile || '').replace(/\D/g, '').slice(-10);
        const farmDigits = (dbUser.farmMobile || '').replace(/\D/g, '').slice(-10);
        let verified = false;
        if (verification?.firebaseIdToken) {
            try {
                const decoded = await (0, auth_1.getAuth)().verifyIdToken(verification.firebaseIdToken);
                const tokenDigits = (decoded?.phone_number || '').replace(/\D/g, '').slice(-10);
                if (!tokenDigits || (tokenDigits !== regDigits && tokenDigits !== farmDigits)) {
                    throw new common_2.UnauthorizedException('Verified phone number does not match this account.');
                }
                verified = true;
            }
            catch (err) {
                if (err instanceof common_2.UnauthorizedException)
                    throw err;
                throw new common_2.UnauthorizedException('Invalid or expired Firebase phone verification token.');
            }
        }
        else if (verification?.otp?.trim()) {
            const provided = verification.otp.trim();
            const stored = this.deleteMeOtpStore.get(user.id);
            if (!stored) {
                throw new common_1.BadRequestException('No active deletion OTP found. Please request a fresh 6-digit verification code.');
            }
            if (Date.now() > stored.expiresAt) {
                this.deleteMeOtpStore.delete(user.id);
                throw new common_1.BadRequestException('Deletion OTP has expired. Please request a new verification code.');
            }
            if (stored.attempts >= 5) {
                this.deleteMeOtpStore.delete(user.id);
                throw new common_1.BadRequestException('Too many invalid OTP attempts. Please request a new verification code.');
            }
            const expectedBuf = Buffer.from(stored.otp, 'utf8');
            const providedBuf = Buffer.from(provided, 'utf8');
            const isMatch = expectedBuf.length === providedBuf.length && (0, crypto_1.timingSafeEqual)(expectedBuf, providedBuf);
            if (!isMatch) {
                stored.attempts += 1;
                if (stored.attempts >= 5) {
                    this.deleteMeOtpStore.delete(user.id);
                    throw new common_1.BadRequestException('Too many invalid OTP attempts. Code invalidated; please request a fresh OTP.');
                }
                throw new common_1.BadRequestException(`Invalid 6-digit OTP code. ${5 - stored.attempts} attempt(s) remaining.`);
            }
            this.deleteMeOtpStore.delete(user.id);
            verified = true;
        }
        if (!verified) {
            throw new common_1.BadRequestException('Server-side OTP or Firebase phone verification is required before deleting your account.');
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
        const delMobile = (await this.generateUniqueDeletedIdentifier(dbUser.mobile, 'mobile', user.id, user.id));
        const delEmail = await this.generateUniqueDeletedIdentifier(dbUser.email, 'email', user.id, user.id);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                name: 'Deleted Account',
                mobile: delMobile,
                email: delEmail,
                googleId: null,
                photoUrl: null,
                village: null,
                district: null,
                state: null,
                pincode: null,
                postOffice: null,
                upiId: null,
                panNumber: null,
                panDocUrl: null,
                aadhaarLast4: null,
                aadhaarDocUrl: null,
                gstin: null,
                mandiLicenseNo: null,
                bankAccountNumber: null,
                bankIfsc: null,
                bankAccountHolderName: null,
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
            select: { mobile: true, role: true, roles: true, deactivatedRoles: true },
        });
        const activeRoles = (0, role_policy_util_1.getActiveRolesList)(existingUser);
        const isSuperAdminMobile = existingUser.mobile === '9872066901';
        if (!isSuperAdminMobile) {
            if (activeRoles.some((r) => role_policy_util_1.ADMIN_STAFF_ROLES.includes(r))) {
                throw new common_1.ConflictException('Admin Panel staff accounts cannot hold Farmer role.');
            }
            if (activeRoles.some((r) => role_policy_util_1.FARM_STAFF_ROLES.includes(r))) {
                throw new common_1.ConflictException('Farm Staff accounts (Supervisor and Labour Worker) cannot become Farmers on the same mobile number.');
            }
            if (activeRoles.includes(client_1.Role.GARDENER)) {
                throw new common_1.ConflictException('This account is already registered as a Gardener. An account cannot be both Farmer and Gardener at the same time.');
            }
        }
        const currentRoles = existingUser.roles ?? [];
        const currentDeactivated = existingUser.deactivatedRoles ?? [];
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
            select: { role: true, roles: true, deactivatedRoles: true },
        });
        const activeRoles = (0, role_policy_util_1.getActiveRolesList)(existingUser);
        if (activeRoles.some((r) => role_policy_util_1.ADMIN_STAFF_ROLES.includes(r))) {
            throw new common_1.ConflictException('Admin Panel staff accounts cannot hold Gardener role.');
        }
        if (activeRoles.some((r) => role_policy_util_1.FARM_STAFF_ROLES.includes(r))) {
            throw new common_1.ConflictException('Farm Staff accounts (Supervisor and Labour Worker) cannot become Gardeners on the same mobile number.');
        }
        if (activeRoles.includes(client_1.Role.FARMER)) {
            throw new common_1.ConflictException('This account is already registered as a Farmer. An account cannot be both Farmer and Gardener at the same time.');
        }
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
    createAccountant(dto) {
        return this.createStaff(dto, client_1.Role.ACCOUNTANT);
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
        const cleanMobile = dto.mobile.replace(/\D/g, '').slice(-10);
        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { mobile: dto.mobile.trim() },
                    { mobile: cleanMobile },
                    { mobile: `+91${cleanMobile}` },
                ],
            },
        });
        if (existing) {
            if (existing.employerFarmerId && existing.employerFarmerId !== farmer.id) {
                const currentEmployer = await this.prisma.user.findUnique({
                    where: { id: existing.employerFarmerId },
                    select: { name: true, kingId: true, mobile: true },
                });
                throw new common_1.ConflictException(`This supervisor is currently actively working under farmer "${currentEmployer?.name || 'Another Farmer'}" (${currentEmployer?.kingId || ''}). A supervisor cannot work for 2 farmers at the same time. They must resign from their current employer before joining a new farmer.`);
            }
            if (existing.employerFarmerId === farmer.id) {
                const updated = await this.prisma.user.update({
                    where: { id: existing.id },
                    data: {
                        supervisorPermissions: dto.permissions ?? [
                            client_1.SupervisorPermission.MANAGE_SPRAY_SCHEDULE,
                            client_1.SupervisorPermission.MANAGE_LABOUR_EXPENSES,
                            client_1.SupervisorPermission.CROP_DOCTOR_CHAT,
                            client_1.SupervisorPermission.MANAGE_HARVEST_SALES,
                        ],
                        deletedAt: null,
                    },
                    select: SAFE_USER_SELECT,
                });
                return { supervisor: updated, tempPassword: '(Already Assigned)' };
            }
            const activeExisting = (0, role_policy_util_1.getActiveRolesList)(existing);
            const incompatibleRoles = activeExisting.filter((r) => r !== client_1.Role.SUPERVISOR && r !== client_1.Role.CUSTOMER);
            if (incompatibleRoles.length > 0) {
                throw new common_1.ConflictException(`This mobile number already holds active role (${incompatibleRoles.join(', ')}). A supervisor must use a dedicated mobile number without Farmer, Gardener, Labour, Agent, Seller, Advisor, Trader, or Staff roles.`);
            }
            const updatedRoles = Array.from(new Set([...(existing.roles ?? []), client_1.Role.SUPERVISOR, client_1.Role.CUSTOMER]));
            const nextDeactivated = (existing.deactivatedRoles ?? []).filter((r) => r !== client_1.Role.SUPERVISOR);
            const updated = await this.prisma.user.update({
                where: { id: existing.id },
                data: {
                    employerFarmerId: farmer.id,
                    role: client_1.Role.SUPERVISOR,
                    roles: updatedRoles,
                    deactivatedRoles: nextDeactivated,
                    supervisorPermissions: dto.permissions ?? [
                        client_1.SupervisorPermission.MANAGE_SPRAY_SCHEDULE,
                        client_1.SupervisorPermission.MANAGE_LABOUR_EXPENSES,
                        client_1.SupervisorPermission.CROP_DOCTOR_CHAT,
                        client_1.SupervisorPermission.MANAGE_HARVEST_SALES,
                    ],
                    deletedAt: null,
                },
                select: SAFE_USER_SELECT,
            });
            return { supervisor: updated, tempPassword: '(Existing Account Linked)' };
        }
        if (process.env.NODE_ENV === 'production' && !dto.firebaseIdToken) {
            throw new common_1.BadRequestException('Firebase ID Token is required.');
        }
        if (dto.firebaseIdToken) {
            try {
                const decoded = await (0, auth_1.getAuth)().verifyIdToken(dto.firebaseIdToken);
                const fbPhone = decoded.phone_number;
                if (!fbPhone)
                    throw new common_2.UnauthorizedException('No phone attached to Firebase credential.');
                const cleanFbMobile = fbPhone.replace(/\D/g, '').slice(-10);
                const cleanDtoMobile = dto.mobile.replace(/\D/g, '').slice(-10);
                if (cleanFbMobile !== cleanDtoMobile) {
                    throw new common_2.UnauthorizedException('Verified phone number does not match requested mobile.');
                }
            }
            catch (err) {
                throw new common_2.UnauthorizedException('Invalid Firebase ID Token: ' + err.message);
            }
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
                roles: [client_1.Role.SUPERVISOR, client_1.Role.CUSTOMER],
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
    async appointSupervisorRequest(farmer, dto) {
        const cleanKing = dto.supervisorKingId.trim();
        const cleanDigits = cleanKing.replace(/\D/g, '');
        const cleanMobile = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : '';
        const target = await this.prisma.user.findFirst({
            where: {
                deletedAt: null,
                OR: [
                    { kingId: cleanKing.toUpperCase() },
                    { mobile: cleanKing },
                    ...(cleanMobile ? [{ mobile: { endsWith: cleanMobile } }] : []),
                ],
            },
            select: {
                id: true,
                name: true,
                kingId: true,
                mobile: true,
                employerFarmerId: true,
                role: true,
                roles: true,
                deactivatedRoles: true,
            },
        });
        if (!target) {
            throw new common_1.NotFoundException('Candidate not found matching King ID / Mobile number.');
        }
        if (target.id === farmer.id) {
            throw new common_1.BadRequestException('You cannot appoint yourself as your own supervisor.');
        }
        const activeTargetRoles = (0, role_policy_util_1.getActiveRolesList)(target);
        const incompatibleTargetRoles = activeTargetRoles.filter((r) => r !== client_1.Role.SUPERVISOR && r !== client_1.Role.CUSTOMER);
        if (incompatibleTargetRoles.length > 0) {
            throw new common_1.ConflictException(`This account already holds an active role (${incompatibleTargetRoles.join(', ')}). Supervisors must use a dedicated mobile number without Farmer, Gardener, Labour, Agent, Seller, Advisor, Trader, or Staff roles.`);
        }
        if (target.employerFarmerId && target.employerFarmerId !== farmer.id) {
            const currentEmployer = await this.prisma.user.findUnique({
                where: { id: target.employerFarmerId },
                select: { name: true, kingId: true },
            });
            throw new common_1.ConflictException(`This supervisor is currently actively working under farmer "${currentEmployer?.name || 'Another Farmer'}" (${currentEmployer?.kingId || ''}). A supervisor cannot work for 2 farmers at the same time. They must resign from their current employer first.`);
        }
        const cfgJson = JSON.stringify(dto.featuresConfig || {});
        const existingRows = await this.prisma.$queryRawUnsafe(`SELECT id FROM "supervisor_requests" WHERE "farmerId" = $1 AND "supervisorId" = $2 AND "status" = 'PENDING' LIMIT 1`, farmer.id, target.id);
        let requestId;
        if (existingRows && existingRows.length > 0) {
            requestId = existingRows[0].id;
            await this.prisma.$executeRawUnsafe(`UPDATE "supervisor_requests" SET "featuresConfig" = $1::jsonb, "note" = $2, "updatedAt" = NOW() WHERE "id" = $3`, cfgJson, dto.note || null, requestId);
        }
        else {
            requestId = `sr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            await this.prisma.$executeRawUnsafe(`INSERT INTO "supervisor_requests" ("id", "farmerId", "supervisorId", "status", "featuresConfig", "note", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, 'PENDING', $4::jsonb, $5, NOW(), NOW())`, requestId, farmer.id, target.id, cfgJson, dto.note || null);
        }
        try {
            await this.notificationsService.create(target.id, client_1.NotificationType.SYSTEM, '🚜 Farm Supervisor Appointment Request', `Farmer ${farmer.name} (${farmer.kingId || ''}) has sent you an appointment request to manage their farm operations. Tap to view allowed features and accept or reject.`, { requestId, farmerId: farmer.id });
        }
        catch (err) {
        }
        return {
            success: true,
            message: `Appointment request sent to ${target.name} (${target.kingId || ''}). They can accept it directly in their dashboard.`,
            requestId,
            supervisor: {
                id: target.id,
                name: target.name,
                kingId: target.kingId,
                mobile: target.mobile,
            },
        };
    }
    async getSupervisorRequests(user) {
        try {
            const incoming = await this.prisma.$queryRawUnsafe(`SELECT sr.id, sr."farmerId", sr."supervisorId", sr.status, sr."featuresConfig", sr.note, sr."createdAt",
                f.name as "farmerName", f."kingId" as "farmerKingId", f.mobile as "farmerMobile", f.village as "farmerVillage", f."farmName"
         FROM "supervisor_requests" sr
         JOIN "users" f ON f.id = sr."farmerId"
         WHERE sr."supervisorId" = $1 AND sr.status = 'PENDING'
         ORDER BY sr."createdAt" DESC`, user.id);
            const outgoing = await this.prisma.$queryRawUnsafe(`SELECT sr.id, sr."farmerId", sr."supervisorId", sr.status, sr."featuresConfig", sr.note, sr."createdAt", sr."respondedAt",
                s.name as "supervisorName", s."kingId" as "supervisorKingId", s.mobile as "supervisorMobile"
         FROM "supervisor_requests" sr
         JOIN "users" s ON s.id = sr."supervisorId"
         WHERE sr."farmerId" = $1
         ORDER BY sr."createdAt" DESC`, user.id);
            const parseRows = (rows) => rows.map((r) => ({
                ...r,
                featuresConfig: typeof r.featuresConfig === 'string' ? JSON.parse(r.featuresConfig) : (r.featuresConfig || {}),
            }));
            return {
                incoming: parseRows(incoming),
                outgoing: parseRows(outgoing),
            };
        }
        catch {
            return { incoming: [], outgoing: [] };
        }
    }
    async respondToSupervisorRequest(user, requestId, dto) {
        const rows = await this.prisma.$queryRawUnsafe(`SELECT * FROM "supervisor_requests" WHERE "id" = $1 AND "supervisorId" = $2 LIMIT 1`, requestId, user.id);
        if (!rows || rows.length === 0) {
            throw new common_1.NotFoundException('Appointment request not found.');
        }
        const request = rows[0];
        if (request.status !== 'PENDING') {
            throw new common_1.BadRequestException(`This request has already been ${request.status.toLowerCase()}.`);
        }
        if (dto.action === 'REJECT') {
            await this.prisma.$executeRawUnsafe(`UPDATE "supervisor_requests" SET "status" = 'REJECTED', "respondedAt" = NOW(), "updatedAt" = NOW() WHERE "id" = $1`, requestId);
            try {
                await this.notificationsService.create(request.farmerId, client_1.NotificationType.SYSTEM, 'Supervisor Request Declined', `${user.name} declined your farm supervisor appointment request.`);
            }
            catch { }
            return { success: true, status: 'REJECTED', message: 'You have declined this supervisor request.' };
        }
        const currentUser = await this.prisma.user.findUnique({ where: { id: user.id } });
        if (currentUser) {
            const activeExisting = (0, role_policy_util_1.getActiveRolesList)(currentUser);
            const incompatible = activeExisting.filter((r) => r !== client_1.Role.SUPERVISOR && r !== client_1.Role.CUSTOMER);
            if (incompatible.length > 0) {
                throw new common_1.ConflictException(`Your account already holds active role (${incompatible.join(', ')}). Only a dedicated mobile account without Farmer, Gardener, Labour, Agent, Seller, Advisor, Trader, or Staff roles can accept a Farm Supervisor appointment.`);
            }
        }
        if (currentUser?.employerFarmerId && currentUser.employerFarmerId !== request.farmerId) {
            const employer = await this.prisma.user.findUnique({ where: { id: currentUser.employerFarmerId }, select: { name: true, kingId: true } });
            throw new common_1.ConflictException(`You are currently actively assigned to farmer "${employer?.name || 'Another Farmer'}" (${employer?.kingId || ''}). Please resign from that farmer before accepting a new appointment.`);
        }
        const cfg = typeof request.featuresConfig === 'string' ? JSON.parse(request.featuresConfig) : (request.featuresConfig || {});
        const permissions = [];
        if (cfg.spray?.view || cfg.spray?.entry)
            permissions.push(client_1.SupervisorPermission.MANAGE_SPRAY_SCHEDULE);
        if (cfg.labour?.view || cfg.labour?.entry)
            permissions.push(client_1.SupervisorPermission.MANAGE_LABOUR_EXPENSES);
        if (cfg.advisory?.view || cfg.advisory?.entry)
            permissions.push(client_1.SupervisorPermission.CROP_DOCTOR_CHAT);
        if (cfg.sales?.view || cfg.sales?.entry)
            permissions.push(client_1.SupervisorPermission.MANAGE_HARVEST_SALES);
        await this.prisma.$executeRawUnsafe(`UPDATE "supervisor_requests" SET "status" = 'ACCEPTED', "respondedAt" = NOW(), "updatedAt" = NOW() WHERE "id" = $1`, requestId);
        await this.prisma.$executeRawUnsafe(`UPDATE "supervisor_requests" SET "status" = 'CANCELLED', "updatedAt" = NOW() WHERE "supervisorId" = $1 AND "status" = 'PENDING'`, user.id);
        const updatedRoles = Array.from(new Set([...(currentUser?.roles ?? []), client_1.Role.SUPERVISOR]));
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                employerFarmerId: request.farmerId,
                role: client_1.Role.SUPERVISOR,
                roles: updatedRoles,
                supervisorPermissions: permissions,
                deletedAt: null,
            },
        });
        await this.prisma.$executeRawUnsafe(`UPDATE "users" SET "supervisorFeaturesConfig" = $1::jsonb WHERE "id" = $2`, JSON.stringify(cfg), user.id);
        const farmer = await this.prisma.user.findUnique({
            where: { id: request.farmerId },
            select: { id: true, name: true, kingId: true, mobile: true, farmName: true, village: true },
        });
        try {
            await this.notificationsService.create(request.farmerId, client_1.NotificationType.SYSTEM, '🎉 Supervisor Appointed!', `${user.name} accepted your request and is now your active Farm Supervisor.`, { supervisorId: user.id });
        }
        catch { }
        return {
            success: true,
            status: 'ACCEPTED',
            message: `You are now the Farm Supervisor for ${farmer?.name || 'the farmer'}!`,
            employerFarmer: farmer,
            featuresConfig: cfg,
        };
    }
    async getActiveSupervisorAssignment(user) {
        const dbUser = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                name: true,
                role: true,
                roles: true,
                employerFarmerId: true,
                supervisorPermissions: true,
                employerFarmer: {
                    select: {
                        id: true,
                        name: true,
                        kingId: true,
                        mobile: true,
                        village: true,
                        district: true,
                        state: true,
                        farmName: true,
                    },
                },
            },
        });
        if (!dbUser || !dbUser.employerFarmerId) {
            return { isAssigned: false, employerFarmer: null, featuresConfig: null };
        }
        let cfg = {};
        try {
            const rows = await this.prisma.$queryRawUnsafe(`SELECT "supervisorFeaturesConfig" FROM "users" WHERE "id" = $1 LIMIT 1`, user.id);
            if (rows && rows.length > 0 && rows[0].supervisorFeaturesConfig) {
                cfg = typeof rows[0].supervisorFeaturesConfig === 'string'
                    ? JSON.parse(rows[0].supervisorFeaturesConfig)
                    : rows[0].supervisorFeaturesConfig;
            }
        }
        catch { }
        return {
            isAssigned: true,
            employerFarmer: dbUser.employerFarmer,
            supervisorPermissions: dbUser.supervisorPermissions,
            featuresConfig: cfg,
        };
    }
    async updateSupervisorFeaturesConfig(farmer, supervisorId, featuresConfig) {
        const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
        if (!supervisor || supervisor.employerFarmerId !== farmer.id) {
            throw new common_1.NotFoundException('Supervisor not found under your account.');
        }
        const cfg = featuresConfig || {};
        const permissions = [];
        if (cfg.spray?.view || cfg.spray?.entry)
            permissions.push(client_1.SupervisorPermission.MANAGE_SPRAY_SCHEDULE);
        if (cfg.labour?.view || cfg.labour?.entry)
            permissions.push(client_1.SupervisorPermission.MANAGE_LABOUR_EXPENSES);
        if (cfg.advisory?.view || cfg.advisory?.entry)
            permissions.push(client_1.SupervisorPermission.CROP_DOCTOR_CHAT);
        if (cfg.sales?.view || cfg.sales?.entry)
            permissions.push(client_1.SupervisorPermission.MANAGE_HARVEST_SALES);
        await this.prisma.user.update({
            where: { id: supervisorId },
            data: { supervisorPermissions: permissions },
        });
        await this.prisma.$executeRawUnsafe(`UPDATE "users" SET "supervisorFeaturesConfig" = $1::jsonb WHERE "id" = $2`, JSON.stringify(cfg), supervisorId);
        return {
            success: true,
            message: 'Supervisor permissions and features updated successfully.',
            supervisorId,
            featuresConfig: cfg,
        };
    }
    async getMySupervisors(farmer) {
        const list = await this.prisma.user.findMany({
            where: { employerFarmerId: farmer.id, deletedAt: null },
            select: SAFE_USER_SELECT,
            orderBy: { createdAt: 'desc' },
        });
        if (list.length === 0)
            return [];
        try {
            const ids = list.map((u) => u.id);
            const configs = await this.prisma.$queryRawUnsafe(`SELECT id, "supervisorFeaturesConfig" FROM "users" WHERE id = ANY($1::text[])`, ids);
            const configMap = new Map();
            configs.forEach((c) => {
                const val = typeof c.supervisorFeaturesConfig === 'string'
                    ? JSON.parse(c.supervisorFeaturesConfig)
                    : (c.supervisorFeaturesConfig || {});
                configMap.set(c.id, val);
            });
            return list.map((u) => ({
                ...u,
                supervisorFeaturesConfig: configMap.get(u.id) || {},
            }));
        }
        catch {
            return list;
        }
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
    async resignSupervisor(actor, supervisorId) {
        const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
        if (!supervisor) {
            throw new common_1.NotFoundException('Supervisor not found.');
        }
        const isOwnerFarmer = supervisor.employerFarmerId === actor.id;
        const isSelf = supervisor.id === actor.id;
        const isAdmin = actor.role === client_1.Role.SUPER_ADMIN || actor.role === client_1.Role.ADMIN;
        if (!isOwnerFarmer && !isSelf && !isAdmin) {
            throw new common_1.ForbiddenException('Only the employer farmer, the supervisor themselves, or Admin can resign this supervisor.');
        }
        const updated = await this.prisma.user.update({
            where: { id: supervisorId },
            data: {
                employerFarmerId: null,
            },
            select: SAFE_USER_SELECT,
        });
        try {
            await this.prisma.$executeRawUnsafe(`UPDATE "users" SET "supervisorFeaturesConfig" = '{}'::jsonb WHERE "id" = $1`, supervisorId);
            await this.prisma.$executeRawUnsafe(`UPDATE "supervisor_requests" SET "status" = 'RESIGNED', "updatedAt" = NOW() WHERE "supervisorId" = $1 AND "status" = 'ACCEPTED'`, supervisorId);
        }
        catch { }
        return {
            success: true,
            message: `Supervisor ${supervisor.name} has resigned / been released. They can now join another farmer if appointed.`,
            supervisor: updated,
        };
    }
    async assignSupervisorEmployer(caller, supervisorId, employerFarmerId) {
        const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
        if (!supervisor) {
            throw new common_1.NotFoundException('Supervisor not found.');
        }
        if (caller.role !== client_1.Role.SUPER_ADMIN && caller.role !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Only an Admin or Super Admin can assign a supervisor to an employer.');
        }
        if (employerFarmerId) {
            const employerFarmer = await this.prisma.user.findUnique({ where: { id: employerFarmerId } });
            if (!employerFarmer) {
                throw new common_1.NotFoundException('Target employer farmer not found.');
            }
        }
        const updatedRoles = Array.from(new Set([...(supervisor.roles ?? []), client_1.Role.SUPERVISOR]));
        const updated = await this.prisma.user.update({
            where: { id: supervisorId },
            data: {
                employerFarmerId,
                role: client_1.Role.SUPERVISOR,
                roles: updatedRoles,
            },
            select: SAFE_USER_SELECT,
        });
        return updated;
    }
    async deleteSupervisor(farmer, supervisorId) {
        const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
        if (!supervisor || supervisor.employerFarmerId !== farmer.id) {
            throw new common_1.NotFoundException('Supervisor not found under your account.');
        }
        await this.prisma.user.update({
            where: { id: supervisorId },
            data: { employerFarmerId: null },
        });
        return { success: true, message: 'Supervisor resigned / unlinked successfully.' };
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
            select: {
                id: true,
                name: true,
                kingId: true,
                mobile: true,
                role: true,
                roles: true,
                employerFarmerId: true,
                village: true,
                district: true,
                state: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('No user found matching that King ID or Mobile number.');
        }
        let currentEmployerName = null;
        if (user.employerFarmerId) {
            const employer = await this.prisma.user.findUnique({
                where: { id: user.employerFarmerId },
                select: { name: true, kingId: true },
            });
            if (employer) {
                currentEmployerName = `${employer.name} (${employer.kingId || ''})`;
            }
        }
        return {
            ...user,
            currentEmployerName,
        };
    }
    assertCanManageTarget(caller, target) {
        const targetIsTierRestricted = target.role === client_1.Role.ADMIN ||
            target.role === client_1.Role.SUPER_ADMIN ||
            (target.roles ?? []).includes(client_1.Role.ADMIN) ||
            (target.roles ?? []).includes(client_1.Role.SUPER_ADMIN);
        const callerIsSuperAdmin = caller.role === client_1.Role.SUPER_ADMIN ||
            ((caller.roles ?? []).includes(client_1.Role.SUPER_ADMIN) && !(caller.deactivatedRoles ?? []).includes(client_1.Role.SUPER_ADMIN));
        if (!callerIsSuperAdmin && targetIsTierRestricted) {
            throw new common_1.ForbiddenException('Only the Super Admin can manage Admin or Super Admin accounts.');
        }
    }
    async updateRole(caller, id, role) {
        const user = await this.findActiveOrThrow(id);
        this.assertCanManageTarget(caller, user);
        if (user.deletedAt) {
            throw new common_1.ConflictException('Cannot change the role of a deactivated user.');
        }
        if (role_policy_util_1.ADMIN_STAFF_ROLES.some((r) => user.role === r || (user.roles ?? []).includes(r))) {
            throw new common_1.ConflictException("An Admin Panel staff member's roles are single-role only and cannot be changed here.");
        }
        if (role_policy_util_1.ADMIN_STAFF_ROLES.includes(role)) {
            throw new common_1.ConflictException('Admin Panel staff roles cannot be assigned via this endpoint.');
        }
        const activeAfterUpdate = Array.from(new Set([...(0, role_policy_util_1.getActiveRolesList)(user), role, client_1.Role.CUSTOMER]));
        (0, role_policy_util_1.assertRoleCombinationAllowed)(activeAfterUpdate);
        const isNewAdvisor = role === client_1.Role.ADVISOR && !user.roles.includes(client_1.Role.ADVISOR);
        const newDeactivatedRoles = (user.deactivatedRoles ?? []).filter((r) => r !== role);
        const targetRoles = Array.from(new Set([...user.roles, role, client_1.Role.CUSTOMER]));
        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                role,
                roles: targetRoles,
                deactivatedRoles: newDeactivatedRoles,
                ...(isNewAdvisor ? { specialization: null, bio: null, yearsExperience: null, advisorType: null } : {}),
            },
            select: SAFE_USER_SELECT,
        });
        if (role === client_1.Role.AGENT && !user.roles.includes(client_1.Role.AGENT)) {
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
        const isStaff = role_policy_util_1.ADMIN_STAFF_ROLES.some((r) => user.role === r || (user.roles ?? []).includes(r));
        if (isStaff) {
            throw new common_1.ConflictException('Admin Panel staff accounts (Super Admin, Admin, Manager, Operator, Technical Trainer) are single-role only and cannot be combined or edited here.');
        }
        if (activeRoles.some((r) => role_policy_util_1.ADMIN_STAFF_ROLES.includes(r))) {
            throw new common_1.ConflictException('Admin Panel staff roles cannot be assigned here. Use Staff Management for dedicated single-role staff accounts.');
        }
        if (!activeRoles.includes(client_1.Role.CUSTOMER)) {
            activeRoles = [...activeRoles, client_1.Role.CUSTOMER];
        }
        (0, role_policy_util_1.assertRoleCombinationAllowed)(activeRoles);
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
        if (toDeactivate.includes(user.role) ||
            !activeRoles.includes(user.role) ||
            user.role === client_1.Role.CUSTOMER) {
            newPrimary = (0, role_policy_util_1.pickBestPrimaryRole)(activeRoles);
            if (!newRoles.includes(newPrimary))
                newRoles.push(newPrimary);
        }
        const isBrandNewAdvisor = toGrant.includes(client_1.Role.ADVISOR);
        const deactivatingSupervisor = toDeactivate.includes(client_1.Role.SUPERVISOR);
        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                role: newPrimary,
                roles: newRoles,
                deactivatedRoles: newDeactivated,
                ...(isBrandNewAdvisor ? { specialization: null, bio: null, yearsExperience: null, advisorType: null } : {}),
                ...(deactivatingSupervisor ? { employerFarmerId: null, supervisorPermissions: [] } : {}),
            },
            select: SAFE_USER_SELECT,
        });
        if (toGrant.includes(client_1.Role.AGENT) || toReactivate.includes(client_1.Role.AGENT)) {
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
        const presence = !safeUser.deletedAt && !safeUser.isPermanentlyBlocked
            ? this.userSessionService?.getUserPresence(safeUser.id)
            : undefined;
        return {
            user: {
                ...safeUser,
                isPermanentlyDeleted: _passwordHash === 'ACCOUNT_DELETED_PERMANENTLY',
                isOnline: Boolean(presence?.isOnline),
                lastSeenAt: presence?.lastSeenAt ? new Date(presence.lastSeenAt).toISOString() : null,
            },
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
                ...(dto.employerFarmerId !== undefined ? { employerFarmerId: dto.employerFarmerId } : {}),
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
        if (user.mobile === '9872066901') {
            throw new common_1.ConflictException('Primary Super Admin account 9872066901 cannot be blocked.');
        }
        if (caller.role !== client_1.Role.SUPER_ADMIN && (user.role === client_1.Role.ADMIN || user.role === client_1.Role.SUPER_ADMIN)) {
            throw new common_1.ConflictException('An admin account cannot be blocked.');
        }
        if (user.deletedAt || user.isPermanentlyBlocked) {
            throw new common_1.ConflictException('User is already blocked or deleted.');
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isPermanentlyBlocked: true,
            },
            select: SAFE_USER_SELECT,
        });
        this.whatsappGroupSyncService.autoRemoveUser(id, user.mobile ?? '', user.name ?? 'User').catch(() => { });
        return updated;
    }
    async reactivate(caller, id) {
        const user = await this.findActiveOrThrow(id);
        this.assertCanManageTarget(caller, user);
        if (!user.deletedAt && !user.isPermanentlyBlocked) {
            throw new common_1.ConflictException('User is already active.');
        }
        const restoredMobile = this.stripDeletedMarkers(user.mobile);
        const restoredEmail = user.email ? this.stripDeletedMarkers(user.email) : null;
        const restoredKingId = user.kingId ? user.kingId.replace(/_del_[a-z0-9_]+$/i, '') : undefined;
        const cleanDigits = restoredMobile.replace(/\D/g, '');
        const clean10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : '';
        const existing = await this.prisma.user.findFirst({
            where: {
                deletedAt: null,
                id: { not: id },
                OR: [
                    { mobile: restoredMobile },
                    ...(clean10 ? [{ mobile: clean10 }, { mobile: `+91${clean10}` }] : []),
                ],
            },
            select: { id: true, kingId: true, name: true },
        });
        if (existing) {
            throw new common_1.ConflictException(`Cannot restore: Another active account (${existing.kingId || existing.name}) already exists on mobile ${restoredMobile}.`);
        }
        const wasAnonymized = user.passwordHash === 'ACCOUNT_DELETED_PERMANENTLY';
        const nextPasswordHash = wasAnonymized ? await argon2.hash(generateTempPassword()) : undefined;
        const nextName = user.name === 'Deleted Account'
            ? restoredMobile.startsWith('G_')
                ? 'Restored Account'
                : `User ${restoredMobile.slice(-4)}`
            : undefined;
        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                deletedAt: null,
                isPermanentlyBlocked: false,
                failedLoginAttempts: 0,
                lockoutUntil: null,
                mobile: restoredMobile,
                email: restoredEmail,
                ...(restoredKingId ? { kingId: restoredKingId } : {}),
                ...(nextPasswordHash ? { passwordHash: nextPasswordHash } : {}),
                ...(nextName ? { name: nextName } : {}),
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
                ...(dto.aadhaarLast4 !== undefined ? { aadhaarLast4: dto.aadhaarLast4 } : {}),
                ...(dto.aadhaarDocUrl !== undefined ? { aadhaarDocUrl: dto.aadhaarDocUrl } : {}),
                ...(dto.panDocUrl !== undefined ? { panDocUrl: dto.panDocUrl } : {}),
                ...(dto.gstin !== undefined ? { gstin: dto.gstin } : {}),
                ...(dto.termsAccepted ? { termsAcceptedAt: new Date(), privacyPolicyVersion: '2026.11' } : {}),
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
                ...(dto.aadhaarLast4 !== undefined ? { aadhaarLast4: dto.aadhaarLast4 } : {}),
                ...(dto.aadhaarDocUrl !== undefined ? { aadhaarDocUrl: dto.aadhaarDocUrl } : {}),
                ...(dto.panDocUrl !== undefined ? { panDocUrl: dto.panDocUrl } : {}),
                ...(dto.gstin !== undefined ? { gstin: dto.gstin } : {}),
                ...(dto.termsAccepted ? { termsAcceptedAt: new Date(), privacyPolicyVersion: '2026.11' } : {}),
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
    async deleteUserByAdmin(caller, id, adminConfirmationOtp) {
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
        if (user.passwordHash === 'ACCOUNT_DELETED_PERMANENTLY') {
            throw new common_1.ConflictException('This user account is already permanently deleted.');
        }
        if (this.appSettingsService) {
            this.appSettingsService.verifyAdminActionOtp(caller.id, adminConfirmationOtp);
        }
        const delMobile = (await this.generateUniqueDeletedIdentifier(user.mobile, 'mobile', id, id));
        const delEmail = await this.generateUniqueDeletedIdentifier(user.email, 'email', id, id);
        await this.prisma.user.update({
            where: { id },
            data: {
                name: 'Deleted Account',
                mobile: delMobile,
                email: delEmail,
                googleId: null,
                photoUrl: null,
                village: null,
                district: null,
                state: null,
                pincode: null,
                postOffice: null,
                upiId: null,
                panNumber: null,
                panDocUrl: null,
                aadhaarLast4: null,
                aadhaarDocUrl: null,
                gstin: null,
                mandiLicenseNo: null,
                bankAccountNumber: null,
                bankIfsc: null,
                bankAccountHolderName: null,
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
        const callerIsSuperAdmin = caller.role === client_1.Role.SUPER_ADMIN ||
            ((caller.roles ?? []).includes(client_1.Role.SUPER_ADMIN) && !(caller.deactivatedRoles ?? []).includes(client_1.Role.SUPER_ADMIN));
        if (!callerIsSuperAdmin && (dto.role === client_1.Role.SUPER_ADMIN || dto.role === client_1.Role.ADMIN)) {
            throw new common_1.ForbiddenException('Only the Super Admin can assign Admin or Super Admin roles.');
        }
        const activeExisting = (0, role_policy_util_1.getActiveRolesList)(user);
        let nextRoles;
        const nextDeactivated = (user.deactivatedRoles ?? []).filter((r) => r !== dto.role);
        if (role_policy_util_1.ADMIN_STAFF_ROLES.includes(dto.role)) {
            const conflicting = activeExisting.filter((r) => r !== dto.role && r !== client_1.Role.CUSTOMER);
            if (conflicting.length > 0) {
                throw new common_1.ConflictException(`Admin Panel Staff accounts (${dto.role}) must be single-role only and cannot be assigned to an account with active roles (${conflicting.join(', ')}). Create a dedicated staff account instead.`);
            }
            nextRoles = [dto.role];
        }
        else {
            const candidateActive = Array.from(new Set([...activeExisting, dto.role, client_1.Role.CUSTOMER]));
            (0, role_policy_util_1.assertRoleCombinationAllowed)(candidateActive);
            nextRoles = Array.from(new Set([...(user.roles || []), dto.role]));
        }
        const updated = await this.prisma.user.update({
            where: { id: dto.userId },
            data: {
                role: dto.role,
                roles: nextRoles,
                deactivatedRoles: nextDeactivated,
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
                bankIfsc: data.bankIfsc ? data.bankIfsc.trim().toUpperCase() : user.bankIfsc,
                bankAccountHolderName: data.bankAccountHolderName ?? user.bankAccountHolderName,
                panNumber: data.panNumber ? data.panNumber.trim().toUpperCase() : user.panNumber,
                aadhaarLast4: data.aadhaarLast4 ?? user.aadhaarLast4,
                aadhaarDocUrl: data.aadhaarDocUrl ?? user.aadhaarDocUrl,
                panDocUrl: data.panDocUrl ?? user.panDocUrl,
                ...(data.termsAccepted ? { termsAcceptedAt: new Date(), privacyPolicyVersion: '2026.11' } : {}),
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
    async listPartnerApplications(status) {
        const cleanStatus = status?.toUpperCase();
        const where = cleanStatus && ['PENDING', 'APPROVED', 'REJECTED'].includes(cleanStatus)
            ? { status: cleanStatus }
            : {};
        const rows = await this.prisma.partnerApplication.findMany({
            where,
            include: {
                applicantUser: {
                    select: {
                        id: true,
                        name: true,
                        kingId: true,
                        mobile: true,
                        role: true,
                        roles: true,
                        deactivatedRoles: true,
                    },
                },
                reviewedBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: [{ createdAt: 'desc' }],
        });
        return rows.map(({ passwordHash, ...rest }) => ({
            ...rest,
            hasPassword: Boolean(passwordHash),
        }));
    }
    async approvePartnerApplication(caller, applicationId, adminConfirmationOtp) {
        if (this.appSettingsService) {
            this.appSettingsService.verifyAdminActionOtp(caller.id, adminConfirmationOtp);
        }
        const existingApp = await this.prisma.partnerApplication.findUnique({
            where: { id: applicationId },
        });
        if (!existingApp) {
            throw new common_1.NotFoundException('Partner application not found.');
        }
        if (existingApp.status === client_1.PartnerApplicationStatus.APPROVED) {
            throw new common_1.ConflictException('This Partner application has already been approved.');
        }
        const cleanMobile = existingApp.mobile.replace(/\D/g, '').slice(-10);
        const txResult = await this.prisma.$transaction(async (tx) => {
            let existingUser = existingApp.applicantUserId
                ? await tx.user.findFirst({
                    where: { id: existingApp.applicantUserId, deletedAt: null },
                })
                : null;
            if (!existingUser) {
                existingUser = await tx.user.findFirst({
                    where: {
                        OR: [
                            { mobile: cleanMobile },
                            { mobile: `+91${cleanMobile}` },
                            { mobile: { endsWith: cleanMobile } },
                        ],
                        deletedAt: null,
                    },
                });
            }
            if (existingUser) {
                const activeRoles = (0, role_policy_util_1.getActiveRolesList)(existingUser);
                (0, role_policy_util_1.assertRoleCombinationAllowed)([...activeRoles, existingApp.requestedRole]);
            }
            let safeEmailToAssign;
            if (existingApp.email) {
                const emailOwner = await tx.user.findFirst({
                    where: {
                        email: existingApp.email.trim().toLowerCase(),
                        ...(existingUser ? { id: { not: existingUser.id } } : {}),
                        deletedAt: null,
                    },
                    select: { id: true },
                });
                if (!emailOwner) {
                    safeEmailToAssign = existingApp.email.trim().toLowerCase();
                }
            }
            const commonKycData = {
                ...(safeEmailToAssign ? { email: safeEmailToAssign } : {}),
                ...(existingApp.pincode ? { pincode: existingApp.pincode } : {}),
                ...(existingApp.postOffice ? { postOffice: existingApp.postOffice } : {}),
                ...(existingApp.village ? { village: existingApp.village } : {}),
                ...(existingApp.district ? { district: existingApp.district } : {}),
                ...(existingApp.state ? { state: existingApp.state } : {}),
                ...(existingApp.qualification ? { qualification: existingApp.qualification } : {}),
                ...(existingApp.specialization ? { specialization: existingApp.specialization } : {}),
                ...(typeof existingApp.yearsExperience === 'number' ? { yearsExperience: existingApp.yearsExperience } : {}),
                ...(existingApp.bio ? { bio: existingApp.bio } : {}),
                ...(existingApp.requestedRole === client_1.Role.ADVISOR && existingApp.advisorType
                    ? { advisorType: existingApp.advisorType }
                    : {}),
                ...(existingApp.panNumber ? { panNumber: existingApp.panNumber } : {}),
                ...(existingApp.panDocUrl ? { panDocUrl: existingApp.panDocUrl } : {}),
                ...(existingApp.aadhaarLast4 ? { aadhaarLast4: existingApp.aadhaarLast4 } : {}),
                ...(existingApp.aadhaarDocUrl ? { aadhaarDocUrl: existingApp.aadhaarDocUrl } : {}),
                ...(existingApp.aadhaarBackUrl ? { aadhaarBackUrl: existingApp.aadhaarBackUrl } : {}),
                ...(existingApp.gstin ? { gstin: existingApp.gstin } : {}),
                ...(existingApp.gstDocUrl ? { gstDocUrl: existingApp.gstDocUrl } : {}),
                ...(existingApp.bankAccountHolderName ? { bankAccountHolderName: existingApp.bankAccountHolderName } : {}),
                ...(existingApp.bankAccountNumber ? { bankAccountNumber: existingApp.bankAccountNumber } : {}),
                ...(existingApp.bankIfsc ? { bankIfsc: existingApp.bankIfsc } : {}),
                ...(existingApp.upiId ? { upiId: existingApp.upiId } : {}),
                ...(existingApp.chequeDocUrl ? { chequeDocUrl: existingApp.chequeDocUrl } : {}),
                ...(existingApp.photoUrl ? { photoUrl: existingApp.photoUrl } : {}),
                ...(existingApp.passwordHash ? { passwordHash: existingApp.passwordHash } : {}),
                kycVerified: true,
                kycVerifiedAt: new Date(),
                termsAcceptedAt: existingApp.termsAcceptedAt ?? new Date(),
                privacyPolicyVersion: '2026.11',
                isApproved: true,
                profileStatus: 'APPROVED',
                profileRejectionReason: null,
                isPhoneVerified: true,
            };
            let targetUser;
            if (existingUser) {
                const nextRoles = Array.from(new Set([existingUser.role, ...(existingUser.roles ?? []), client_1.Role.CUSTOMER, existingApp.requestedRole]));
                const nextDeactivated = (existingUser.deactivatedRoles ?? []).filter((r) => r !== existingApp.requestedRole);
                const nextPrimaryRole = existingUser.role === client_1.Role.CUSTOMER ? existingApp.requestedRole : (0, role_policy_util_1.pickBestPrimaryRole)(nextRoles);
                const preservedKingId = existingUser.kingId || (await (0, king_id_util_1.generateUniqueKingId)(tx));
                targetUser = await tx.user.update({
                    where: { id: existingUser.id },
                    data: {
                        kingId: preservedKingId,
                        role: nextPrimaryRole,
                        roles: nextRoles,
                        deactivatedRoles: nextDeactivated,
                        ...commonKycData,
                    },
                    select: SAFE_USER_SELECT,
                });
            }
            else {
                const newKingId = await (0, king_id_util_1.generateUniqueKingId)(tx);
                const fallbackHash = existingApp.passwordHash || (await argon2.hash(generateTempPassword()));
                targetUser = await tx.user.create({
                    data: {
                        kingId: newKingId,
                        mobile: cleanMobile,
                        name: existingApp.name,
                        role: existingApp.requestedRole,
                        roles: [client_1.Role.CUSTOMER, existingApp.requestedRole],
                        ...commonKycData,
                        passwordHash: fallbackHash,
                    },
                    select: SAFE_USER_SELECT,
                });
            }
            if (existingApp.requestedRole === client_1.Role.SELLER) {
                const existingStore = await tx.sellerStore.findUnique({
                    where: { sellerId: targetUser.id },
                });
                if (!existingStore) {
                    const rawBase = (existingApp.storeName || existingApp.name || 'seller-store')
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '')
                        .slice(0, 32) || 'farmsking-store';
                    const slug = `${rawBase}-${(0, crypto_1.randomBytes)(3).toString('hex')}`;
                    await tx.sellerStore.create({
                        data: {
                            sellerId: targetUser.id,
                            storeName: existingApp.storeName || `${existingApp.name} Store`,
                            slug,
                            sellerType: existingApp.sellerType || client_1.SellerType.FARMER,
                            legalName: existingApp.legalName || existingApp.name,
                            gstin: existingApp.gstin || null,
                            panNumber: existingApp.panNumber || null,
                            aadhaarLast4: existingApp.aadhaarLast4 || null,
                            upiId: existingApp.upiId || null,
                            kycStatus: client_1.SellerKycStatus.VERIFIED,
                            kycVerifiedAt: new Date(),
                            kycVerifiedById: caller.id,
                            bankAccountNo: existingApp.bankAccountNumber || null,
                            bankIfsc: existingApp.bankIfsc || null,
                            bankBeneficiaryName: existingApp.bankAccountHolderName || null,
                            pickupAddress: existingApp.pickupAddress || null,
                            pickupCity: existingApp.district || null,
                            pickupState: existingApp.state || null,
                            pickupPincode: existingApp.pincode || null,
                            panDocUrl: existingApp.panDocUrl || null,
                            chequeDocUrl: existingApp.chequeDocUrl || null,
                            aadhaarFrontUrl: existingApp.aadhaarDocUrl || null,
                            aadhaarBackUrl: existingApp.aadhaarBackUrl || null,
                            gstDocUrl: existingApp.gstDocUrl || null,
                            sellerAgreementAcceptedAt: existingApp.termsAcceptedAt ?? new Date(),
                            sellerAgreementVersion: '2026.11',
                        },
                    });
                }
                else {
                    await tx.sellerStore.update({
                        where: { id: existingStore.id },
                        data: {
                            ...(existingApp.panNumber ? { panNumber: existingApp.panNumber } : {}),
                            ...(existingApp.panDocUrl ? { panDocUrl: existingApp.panDocUrl } : {}),
                            ...(existingApp.aadhaarLast4 ? { aadhaarLast4: existingApp.aadhaarLast4 } : {}),
                            ...(existingApp.aadhaarDocUrl ? { aadhaarFrontUrl: existingApp.aadhaarDocUrl } : {}),
                            ...(existingApp.aadhaarBackUrl ? { aadhaarBackUrl: existingApp.aadhaarBackUrl } : {}),
                            ...(existingApp.gstin ? { gstin: existingApp.gstin } : {}),
                            ...(existingApp.gstDocUrl ? { gstDocUrl: existingApp.gstDocUrl } : {}),
                            ...(existingApp.bankAccountNumber ? { bankAccountNo: existingApp.bankAccountNumber } : {}),
                            ...(existingApp.bankIfsc ? { bankIfsc: existingApp.bankIfsc } : {}),
                            ...(existingApp.bankAccountHolderName ? { bankBeneficiaryName: existingApp.bankAccountHolderName } : {}),
                            ...(existingApp.chequeDocUrl ? { chequeDocUrl: existingApp.chequeDocUrl } : {}),
                            kycStatus: client_1.SellerKycStatus.VERIFIED,
                            kycVerifiedAt: new Date(),
                            kycVerifiedById: caller.id,
                        },
                    });
                }
            }
            const updatedApplication = await tx.partnerApplication.update({
                where: { id: existingApp.id },
                data: {
                    status: client_1.PartnerApplicationStatus.APPROVED,
                    applicantUserId: targetUser.id,
                    reviewedById: caller.id,
                    reviewedAt: new Date(),
                    rejectionReason: null,
                },
            });
            await tx.isoAuditLog.create({
                data: {
                    action: 'PARTNER_APPLICATION_APPROVED',
                    actorId: caller.id,
                    actorName: caller.name,
                    details: {
                        applicationId: existingApp.id,
                        targetUserId: targetUser.id,
                        kingId: targetUser.kingId,
                        requestedRole: existingApp.requestedRole,
                        preservedExistingAccount: Boolean(existingUser),
                    },
                },
            });
            return { targetUser, updatedApplication, isBrandNewUser: !existingUser };
        });
        try {
            await (0, invite_coupon_util_1.provisionInviteCoupon)(this.prisma, txResult.targetUser.id);
            if (existingApp.requestedRole === client_1.Role.AGENT) {
                await (0, partner_coupon_util_1.provisionPartnerReferralCoupon)(this.prisma, txResult.targetUser.id, caller.id);
            }
            if (txResult.isBrandNewUser) {
                await this.walletService.ensureWelcomeBonus(txResult.targetUser.id);
            }
            await this.prisma.verifiedSignupLead
                ?.updateMany?.({
                where: { mobile: cleanMobile },
                data: {
                    status: client_1.VerifiedLeadStatus.COMPLETED_SELF,
                    convertedUserId: txResult.targetUser.id,
                    convertedAt: new Date(),
                    intendedRole: existingApp.requestedRole,
                    capturedName: txResult.targetUser.name,
                },
            })
                .catch(() => { });
        }
        catch (e) {
            console.warn('[ApprovePartnerApplication] Coupon/wallet provision notice:', e?.message);
        }
        try {
            await this.notificationsService.create(txResult.targetUser.id, client_1.NotificationType.SYSTEM, `Partner Application Approved (${existingApp.requestedRole})`, `Congratulations ${txResult.targetUser.name}! Your ${existingApp.requestedRole} role is now active on King ID ${txResult.targetUser.kingId}. Sign in via the Partner Login tab.`);
        }
        catch { }
        this.whatsappBotService
            ?.sendDirectTextMessage(cleanMobile, `🎉 FarmsKing Partner Approved!\n\nHello ${txResult.targetUser.name}, your application for *${existingApp.requestedRole}* is *APPROVED*!\n🔑 King ID: ${txResult.targetUser.kingId}\n\nYou can now sign in via the Partner Login portal on FarmsKing.`)
            .catch(() => { });
        const { passwordHash: _ph, ...safeApp } = txResult.updatedApplication;
        return {
            success: true,
            application: safeApp,
            user: txResult.targetUser,
            message: `${txResult.targetUser.name} approved as ${existingApp.requestedRole} (King ID: ${txResult.targetUser.kingId}).`,
        };
    }
    async rejectPartnerApplication(caller, applicationId, reason) {
        const cleanReason = reason?.trim();
        if (!cleanReason || cleanReason.length < 5) {
            throw new common_1.BadRequestException('Please provide a clear rejection reason (at least 5 characters) so the applicant knows what to fix.');
        }
        const existingApp = await this.prisma.partnerApplication.findUnique({
            where: { id: applicationId },
        });
        if (!existingApp) {
            throw new common_1.NotFoundException('Partner application not found.');
        }
        if (existingApp.status === client_1.PartnerApplicationStatus.APPROVED) {
            throw new common_1.ConflictException('Approved applications cannot be rejected.');
        }
        const updatedApp = await this.prisma.partnerApplication.update({
            where: { id: applicationId },
            data: {
                status: client_1.PartnerApplicationStatus.REJECTED,
                rejectionReason: cleanReason,
                reviewedById: caller.id,
                reviewedAt: new Date(),
            },
        });
        await this.prisma.isoAuditLog.create({
            data: {
                action: 'PARTNER_APPLICATION_REJECTED',
                actorId: caller.id,
                actorName: caller.name,
                details: {
                    applicationId,
                    mobile: existingApp.mobile,
                    requestedRole: existingApp.requestedRole,
                    reason: cleanReason,
                },
            },
        });
        if (existingApp.applicantUserId) {
            this.notificationsService
                .create(existingApp.applicantUserId, client_1.NotificationType.SYSTEM, 'Partner Application Requires Updates', `Your ${existingApp.requestedRole} application was not approved: "${cleanReason}". Open Partner Login to edit and resubmit.`)
                .catch(() => { });
        }
        this.whatsappBotService
            ?.sendDirectTextMessage(existingApp.mobile, `⚠️ FarmsKing Partner Application Update\n\nHello ${existingApp.name}, your application for *${existingApp.requestedRole}* needs corrections before approval:\nReason: ${cleanReason}\n\nOpen Partner Login -> "Edit & Resubmit Application" to update your details.`)
            .catch(() => { });
        const { passwordHash: _ph, ...safeApp } = updatedApp;
        return {
            success: true,
            application: safeApp,
            message: 'Partner application marked rejected with reason. Applicant can edit and resubmit.',
        };
    }
    async resolveReferrerByCode(rawCode) {
        const cleanCode = rawCode?.trim();
        if (!cleanCode)
            return null;
        const rawDigits = cleanCode.replace(/\D/g, '');
        const cleanReferrerMobile = rawDigits.slice(-10);
        let referrer = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { kingId: cleanCode },
                    ...(rawDigits
                        ? [
                            { kingId: rawDigits },
                            { kingId: rawDigits.padStart(8, '0') },
                            { kingId: { endsWith: rawDigits } },
                        ]
                        : []),
                ],
                deletedAt: null,
            },
            select: { id: true },
        });
        if (!referrer && cleanReferrerMobile.length === 10) {
            referrer = await this.prisma.user.findFirst({
                where: {
                    OR: [
                        { mobile: cleanReferrerMobile },
                        { mobile: `+91${cleanReferrerMobile}` },
                        { mobile: { endsWith: cleanReferrerMobile } },
                    ],
                    deletedAt: null,
                },
                select: { id: true },
            });
        }
        if (!referrer) {
            const coupon = await this.prisma.coupon?.findFirst?.({
                where: { code: cleanCode.toUpperCase() },
                select: { createdById: true, businessPartnerId: true },
            });
            const couponOwnerId = coupon?.createdById || coupon?.businessPartnerId;
            if (couponOwnerId) {
                referrer = { id: couponOwnerId };
            }
        }
        return referrer;
    }
    async listVerifiedSignupLeads(status, search) {
        const validStatuses = new Set(Object.values(client_1.VerifiedLeadStatus));
        const normalizedStatus = status?.trim().toUpperCase();
        const where = {};
        if (normalizedStatus && normalizedStatus !== 'ALL' && validStatuses.has(normalizedStatus)) {
            where.status = normalizedStatus;
        }
        const q = search?.trim();
        if (q) {
            where.OR = [
                { mobile: { contains: q } },
                { capturedName: { contains: q, mode: client_1.Prisma.QueryMode.insensitive } },
                { capturedEmail: { contains: q, mode: client_1.Prisma.QueryMode.insensitive } },
                { pincode: { contains: q } },
                { district: { contains: q, mode: client_1.Prisma.QueryMode.insensitive } },
                { state: { contains: q, mode: client_1.Prisma.QueryMode.insensitive } },
                { village: { contains: q, mode: client_1.Prisma.QueryMode.insensitive } },
                { referralCode: { contains: q, mode: client_1.Prisma.QueryMode.insensitive } },
                { adminNotes: { contains: q, mode: client_1.Prisma.QueryMode.insensitive } },
                {
                    convertedUser: {
                        kingId: { contains: q, mode: client_1.Prisma.QueryMode.insensitive },
                    },
                },
            ];
        }
        const [items, groupedCounts] = await Promise.all([
            this.prisma.verifiedSignupLead.findMany({
                where,
                orderBy: { lastAttemptAt: 'desc' },
                take: 250,
                include: {
                    convertedUser: {
                        select: {
                            id: true,
                            kingId: true,
                            name: true,
                            role: true,
                            roles: true,
                            mobile: true,
                        },
                    },
                    convertedBy: {
                        select: {
                            id: true,
                            name: true,
                            kingId: true,
                            role: true,
                        },
                    },
                },
            }),
            this.prisma.verifiedSignupLead.groupBy({
                by: ['status'],
                _count: { _all: true },
            }),
        ]);
        const countMap = new Map();
        let total = 0;
        for (const row of groupedCounts) {
            const c = Number(row._count?._all || 0);
            countMap.set(row.status, c);
            total += c;
        }
        return {
            items,
            counts: {
                total,
                otpConfirmed: countMap.get(client_1.VerifiedLeadStatus.OTP_CONFIRMED) || 0,
                completedSelf: countMap.get(client_1.VerifiedLeadStatus.COMPLETED_SELF) || 0,
                convertedByAdmin: countMap.get(client_1.VerifiedLeadStatus.CONVERTED_BY_ADMIN) || 0,
                dismissed: countMap.get(client_1.VerifiedLeadStatus.DISMISSED) || 0,
            },
        };
    }
    async updateVerifiedSignupLeadNotes(caller, leadId, dto) {
        const existing = await this.prisma.verifiedSignupLead.findUnique({
            where: { id: leadId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Verified signup lead not found.');
        }
        let nextStatus;
        if (dto.status === client_1.VerifiedLeadStatus.DISMISSED || dto.status === client_1.VerifiedLeadStatus.OTP_CONFIRMED) {
            if (existing.convertedUserId && existing.portal !== 'PARTNER') {
                throw new common_1.BadRequestException('Cannot change status after an account has already been created for this lead.');
            }
            nextStatus = dto.status;
        }
        const updated = await this.prisma.verifiedSignupLead.update({
            where: { id: leadId },
            data: {
                ...(dto.adminNotes !== undefined ? { adminNotes: dto.adminNotes.trim() || null } : {}),
                ...(dto.capturedName !== undefined ? { capturedName: dto.capturedName.trim() || null } : {}),
                ...(dto.capturedEmail !== undefined
                    ? { capturedEmail: dto.capturedEmail.trim() ? dto.capturedEmail.trim().toLowerCase() : null }
                    : {}),
                ...(dto.pincode !== undefined ? { pincode: dto.pincode.trim() || null } : {}),
                ...(dto.district !== undefined ? { district: dto.district.trim() || null } : {}),
                ...(dto.state !== undefined ? { state: dto.state.trim() || null } : {}),
                ...(dto.village !== undefined ? { village: dto.village.trim() || null } : {}),
                ...(dto.intendedRole !== undefined ? { intendedRole: dto.intendedRole } : {}),
                ...(nextStatus ? { status: nextStatus } : {}),
            },
            include: {
                convertedUser: {
                    select: { id: true, kingId: true, name: true, role: true, roles: true, mobile: true },
                },
                convertedBy: {
                    select: { id: true, name: true, kingId: true, role: true },
                },
            },
        });
        await this.prisma.isoAuditLog
            ?.create({
            data: {
                action: nextStatus === client_1.VerifiedLeadStatus.DISMISSED
                    ? 'VERIFIED_LEAD_DISMISSED'
                    : 'VERIFIED_LEAD_NOTES_UPDATED',
                actorId: caller.id,
                actorName: caller.name,
                details: {
                    leadId: updated.id,
                    mobile: updated.mobile,
                    status: updated.status,
                },
            },
        })
            .catch(() => { });
        return {
            success: true,
            lead: updated,
            message: nextStatus === client_1.VerifiedLeadStatus.DISMISSED
                ? 'Lead marked as Done / Read.'
                : nextStatus === client_1.VerifiedLeadStatus.OTP_CONFIRMED
                    ? 'Lead marked as Unread (Follow-Up Pending).'
                    : 'Follow-up details and notes saved.',
        };
    }
    async convertVerifiedLeadToUser(caller, leadId, dto) {
        const lead = await this.prisma.verifiedSignupLead.findUnique({
            where: { id: leadId },
        });
        if (!lead) {
            throw new common_1.NotFoundException('Verified signup lead not found.');
        }
        const cleanMobile = lead.mobile.replace(/\D/g, '').slice(-10);
        const existingActiveUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { mobile: lead.mobile },
                    { mobile: cleanMobile },
                    { mobile: `+91${cleanMobile}` },
                    { mobile: { endsWith: cleanMobile } },
                ],
                deletedAt: null,
            },
            select: { id: true, kingId: true, name: true, role: true },
        });
        if (existingActiveUser) {
            if (lead.status === client_1.VerifiedLeadStatus.OTP_CONFIRMED) {
                await this.prisma.verifiedSignupLead.update({
                    where: { id: lead.id },
                    data: {
                        status: client_1.VerifiedLeadStatus.COMPLETED_SELF,
                        convertedUserId: existingActiveUser.id,
                        convertedAt: new Date(),
                        intendedRole: existingActiveUser.role,
                    },
                });
            }
            throw new common_1.ConflictException(`This mobile number already has an active account (King ID: ${existingActiveUser.kingId || existingActiveUser.id}).`);
        }
        const cleanEmail = dto.email?.trim() ? dto.email.trim().toLowerCase() : null;
        if (cleanEmail) {
            const emailOwner = await this.prisma.user.findFirst({
                where: { email: cleanEmail, deletedAt: null },
                select: { id: true },
            });
            if (emailOwner) {
                throw new common_1.ConflictException('This email address is already registered with another FarmsKing account.');
            }
        }
        const chosenRole = dto.role === 'FARMER'
            ? client_1.Role.FARMER
            : dto.role === 'GARDENER'
                ? client_1.Role.GARDENER
                : client_1.Role.CUSTOMER;
        const assignedRoles = chosenRole === client_1.Role.CUSTOMER ? [client_1.Role.CUSTOMER] : [client_1.Role.CUSTOMER, chosenRole];
        const referrer = await this.resolveReferrerByCode(dto.referralCode || lead.referralCode);
        const kingId = await (0, king_id_util_1.generateUniqueKingId)(this.prisma);
        const passwordHash = await argon2.hash((0, crypto_1.randomBytes)(24).toString('hex'));
        const txResult = await this.prisma.$transaction(async (tx) => {
            const createdUser = await tx.user.create({
                data: {
                    kingId,
                    mobile: cleanMobile,
                    name: dto.name.trim(),
                    email: cleanEmail,
                    passwordHash,
                    role: chosenRole,
                    roles: assignedRoles,
                    isPhoneVerified: true,
                    pincode: dto.pincode?.trim() || lead.pincode || null,
                    postOffice: dto.postOffice?.trim() || null,
                    village: dto.village?.trim() || lead.village || null,
                    district: dto.district?.trim() || lead.district || null,
                    state: dto.state?.trim() || lead.state || null,
                    sprayTankSizeL: chosenRole === client_1.Role.FARMER ? (dto.sprayTankSizeL ?? null) : null,
                    soilType: chosenRole === client_1.Role.FARMER ? (dto.soilType ?? null) : null,
                    waterType: chosenRole === client_1.Role.FARMER ? (dto.waterType ?? null) : null,
                    referredById: referrer?.id || null,
                    termsAcceptedAt: new Date(),
                    privacyPolicyVersion: '2026.11',
                },
                select: SAFE_USER_SELECT,
            });
            if (chosenRole === client_1.Role.FARMER) {
                await tx.farmerPlan.upsert({
                    where: { farmerId: createdUser.id },
                    create: { farmerId: createdUser.id },
                    update: {},
                });
            }
            else if (chosenRole === client_1.Role.GARDENER) {
                await tx.gardenerPlan.upsert({
                    where: { gardenerId: createdUser.id },
                    create: { gardenerId: createdUser.id },
                    update: {},
                });
            }
            const updatedLead = await tx.verifiedSignupLead.update({
                where: { id: lead.id },
                data: {
                    status: client_1.VerifiedLeadStatus.CONVERTED_BY_ADMIN,
                    convertedUserId: createdUser.id,
                    convertedById: caller.id,
                    convertedAt: new Date(),
                    intendedRole: chosenRole,
                    capturedName: createdUser.name,
                    capturedEmail: createdUser.email,
                    pincode: createdUser.pincode,
                    district: createdUser.district,
                    state: createdUser.state,
                    village: createdUser.village,
                    ...(dto.adminNotes?.trim() ? { adminNotes: dto.adminNotes.trim() } : {}),
                },
                include: {
                    convertedUser: {
                        select: { id: true, kingId: true, name: true, role: true, roles: true, mobile: true },
                    },
                    convertedBy: {
                        select: { id: true, name: true, kingId: true, role: true },
                    },
                },
            });
            await tx.isoAuditLog.create({
                data: {
                    action: 'VERIFIED_LEAD_CONVERTED_BY_ADMIN',
                    actorId: caller.id,
                    actorName: caller.name,
                    details: {
                        leadId: lead.id,
                        convertedUserId: createdUser.id,
                        kingId: createdUser.kingId,
                        mobile: cleanMobile,
                        role: chosenRole,
                    },
                },
            });
            return { createdUser, updatedLead };
        });
        try {
            await (0, invite_coupon_util_1.provisionInviteCoupon)(this.prisma, txResult.createdUser.id);
            if (referrer) {
                await (0, referral_coupon_util_1.provisionReferralWelcomeCoupon)(this.prisma, txResult.createdUser.id, referrer.id);
            }
        }
        catch (e) {
            console.warn('[ConvertVerifiedLead] Coupon provision notice:', e?.message);
        }
        try {
            await this.walletService.ensureWelcomeBonus(txResult.createdUser.id);
        }
        catch (e) {
            console.warn('[ConvertVerifiedLead] Wallet bonus notice:', e?.message);
        }
        try {
            await this.notificationsService.create(txResult.createdUser.id, client_1.NotificationType.SYSTEM, 'Welcome to FarmsKing!', `Hello ${txResult.createdUser.name}! Your FarmsKing ${chosenRole} account is now active. King ID: ${txResult.createdUser.kingId}.`);
        }
        catch { }
        this.whatsappBotService
            ?.sendDirectTextMessage(cleanMobile, `🌾 *Welcome to FarmsKing!* 🙏✨\n\nHello *${txResult.createdUser.name}*,\nYour FarmsKing *${chosenRole}* account has been activated!\n\n🔑 *King ID:* ${txResult.createdUser.kingId}\n📱 *Registered Mobile:* ${cleanMobile}\n\nYou can sign in directly using Mobile OTP on https://farmsking.in.\n\n- FARMSKING TECHNOLOGIES PRIVATE LIMITED`)
            .catch(() => { });
        this.whatsappGroupSyncService
            .autoAddNewUser(txResult.createdUser.id, cleanMobile, txResult.createdUser.name)
            .catch(() => { });
        return {
            success: true,
            user: txResult.createdUser,
            lead: txResult.updatedLead,
            message: `${txResult.createdUser.name} account created with King ID ${txResult.createdUser.kingId}.`,
        };
    }
    normalizeAdminCreateMobile(rawMobile) {
        const cleanMobile = (rawMobile || '').replace(/\D/g, '').slice(-10);
        if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
            throw new common_1.BadRequestException('Please enter a valid 10-digit Indian mobile number.');
        }
        return cleanMobile;
    }
    signAdminCreateOtpToken(adminId, mobile) {
        const payload = { scope: 'ADMIN_CREATE_USER_OTP', adminId, mobile };
        if (this.jwtService?.sign) {
            return this.jwtService.sign(payload, { expiresIn: '30m' });
        }
        const secret = process.env.JWT_SECRET || 'farmsking-admin-create-fallback';
        const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 30 * 60 * 1000 })).toString('base64url');
        const sig = (0, crypto_1.createHmac)('sha256', secret).update(data).digest('base64url');
        return `${data}.${sig}`;
    }
    verifyAdminCreateOtpToken(token, expectedAdminId, expectedMobile) {
        let payload;
        if (this.jwtService?.verify) {
            try {
                payload = this.jwtService.verify(token);
            }
            catch {
                throw new common_2.UnauthorizedException('Mobile OTP verification session expired. Please verify mobile OTP again.');
            }
        }
        else {
            const [data, sig] = (token || '').split('.');
            if (!data || !sig) {
                throw new common_2.UnauthorizedException('Invalid mobile OTP verification token.');
            }
            const secret = process.env.JWT_SECRET || 'farmsking-admin-create-fallback';
            const expectedSig = (0, crypto_1.createHmac)('sha256', secret).update(data).digest('base64url');
            if (sig.length !== expectedSig.length || !(0, crypto_1.timingSafeEqual)(Buffer.from(sig), Buffer.from(expectedSig))) {
                throw new common_2.UnauthorizedException('Invalid mobile OTP verification token.');
            }
            payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
            if (payload?.exp && Date.now() > payload.exp) {
                throw new common_2.UnauthorizedException('Mobile OTP verification session expired. Please verify mobile OTP again.');
            }
        }
        if (payload?.scope !== 'ADMIN_CREATE_USER_OTP' ||
            payload?.adminId !== expectedAdminId ||
            payload?.mobile !== expectedMobile) {
            throw new common_2.UnauthorizedException('Mobile OTP verification token does not match this mobile number or Admin session.');
        }
    }
    mapAdminCreateRoleKeyToPrismaRole(roleKey) {
        if (roleKey === 'FARM_ADVISOR' || roleKey === 'GARDEN_ADVISOR')
            return client_1.Role.ADVISOR;
        return roleKey;
    }
    async checkAdminCreateMobileAvailability(cleanMobile, category, targetRoleKey) {
        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { mobile: cleanMobile },
                    { mobile: `+91${cleanMobile}` },
                    { mobile: { endsWith: cleanMobile } },
                ],
                AND: [{ OR: [{ deletedAt: null }, { isPermanentlyBlocked: true }] }],
            },
            select: {
                id: true,
                kingId: true,
                name: true,
                role: true,
                roles: true,
                deactivatedRoles: true,
                email: true,
                pincode: true,
                postOffice: true,
                village: true,
                district: true,
                state: true,
                farmName: true,
                photoUrl: true,
                isPermanentlyBlocked: true,
            },
        });
        if (existing?.isPermanentlyBlocked) {
            throw new common_1.ConflictException(`Mobile number ${cleanMobile} is permanently blocked by Admin (King ID: ${existing.kingId || existing.id}). Unblock it from Deleted / Blocked Archive first.`);
        }
        if (existing) {
            const activeRoles = (0, role_policy_util_1.getActiveRolesList)(existing);
            if (category === 'STAFF') {
                const existingStaff = activeRoles.find((r) => role_policy_util_1.ADMIN_STAFF_ROLES.includes(r));
                if (existingStaff) {
                    throw new common_1.ConflictException(`This mobile number already has a Staff role (${existing.name} · ${existingStaff} · King ID: ${existing.kingId || existing.id}). Staff accounts can hold only one Staff role.`);
                }
            }
            else if (category === 'PARTNERS') {
                const existingPartnerRoles = activeRoles.filter((r) => role_policy_util_1.PARTNER_PORTAL_ROLES.includes(r) || r === client_1.Role.TRADER);
                if (targetRoleKey) {
                    const targetRole = this.mapAdminCreateRoleKeyToPrismaRole(targetRoleKey);
                    if (activeRoles.includes(targetRole)) {
                        throw new common_1.ConflictException(`This account already holds an active ${targetRole} role (${existing.name} · King ID: ${existing.kingId || existing.id}).`);
                    }
                    (0, role_policy_util_1.assertRoleCombinationAllowed)([...activeRoles, targetRole]);
                }
                else if (existingPartnerRoles.length > 0) {
                    const canAddAgentOrAdvisor = existingPartnerRoles.length === 1 &&
                        (existingPartnerRoles[0] === client_1.Role.ADVISOR || existingPartnerRoles[0] === client_1.Role.AGENT);
                    if (!canAddAgentOrAdvisor) {
                        throw new common_1.ConflictException(`This mobile number already holds a Partner role (${existingPartnerRoles.join(', ')} · King ID: ${existing.kingId || existing.id}).`);
                    }
                }
            }
            else if (category === 'CLIENTS') {
                if (targetRoleKey === 'CUSTOMER' && activeRoles.includes(client_1.Role.CUSTOMER)) {
                    throw new common_1.ConflictException(`This mobile number already has a Customer account (${existing.name} · King ID: ${existing.kingId || existing.id}).`);
                }
                const clientOpRoles = [client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.SUPERVISOR, client_1.Role.LABOUR];
                const existingClientOp = activeRoles.find((r) => clientOpRoles.includes(r));
                if (existingClientOp && targetRoleKey !== 'CUSTOMER') {
                    throw new common_1.ConflictException(`In the Client category, this mobile number already holds ${existingClientOp} (${existing.name} · King ID: ${existing.kingId || existing.id}). Only one Farmer or Gardener role is allowed.`);
                }
                if (targetRoleKey) {
                    const targetRole = this.mapAdminCreateRoleKeyToPrismaRole(targetRoleKey);
                    (0, role_policy_util_1.assertRoleCombinationAllowed)([...activeRoles, targetRole]);
                }
            }
            else {
                throw new common_1.ConflictException(`An active FarmsKing account already exists on ${cleanMobile} (${existing.name} · King ID: ${existing.kingId || existing.id} · Role: ${existing.role}).`);
            }
            return {
                isExistingUser: true,
                existingUser: {
                    id: existing.id,
                    kingId: existing.kingId ?? null,
                    name: existing.name,
                    email: existing.email ?? null,
                    pincode: existing.pincode ?? null,
                    postOffice: existing.postOffice ?? null,
                    village: existing.village ?? null,
                    district: existing.district ?? null,
                    state: existing.state ?? null,
                    farmName: existing.farmName ?? null,
                    photoUrl: existing.photoUrl ?? null,
                    activeRoles,
                    roles: existing.roles ?? [existing.role],
                    deactivatedRoles: existing.deactivatedRoles ?? [],
                },
            };
        }
        return { isExistingUser: false, existingUser: null };
    }
    assertAdminCreateCategoryAndRole(caller, category, roleKey) {
        const allowedByCategory = {
            STAFF: ['ADMIN', 'MANAGER', 'OPERATOR', 'TECHNICAL_TRAINER', 'ACCOUNTANT'],
            PARTNERS: ['AGENT', 'SELLER', 'FARM_ADVISOR', 'GARDEN_ADVISOR', 'TRADER'],
            CLIENTS: ['FARMER', 'GARDENER', 'CUSTOMER', 'SUPERVISOR'],
        };
        if (!allowedByCategory[category]?.includes(roleKey)) {
            throw new common_1.BadRequestException(`Role ${roleKey} does not belong to category ${category}.`);
        }
        if ((roleKey === 'ADMIN' || roleKey === 'MANAGER') && caller.role !== client_1.Role.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only the Super Admin can create Admin or Manager accounts.');
        }
    }
    async sendAdminCreateOtp(caller, mobile, category) {
        const cleanMobile = this.normalizeAdminCreateMobile(mobile);
        const availability = await this.checkAdminCreateMobileAvailability(cleanMobile, category);
        const isDev = process.env.NODE_ENV !== 'production';
        const otpCode = isDev ? '123456' : (0, crypto_1.randomInt)(100000, 1000000).toString();
        const key = `${caller.id}:${cleanMobile}`;
        this.adminCreateOtpStore.set(key, {
            otp: otpCode,
            expiresAt: Date.now() + 10 * 60 * 1000,
            attempts: 0,
        });
        let waSent = false;
        if (!isDev && this.whatsappBotService) {
            try {
                const waRes = await this.whatsappBotService.sendOtpMessage(cleanMobile, otpCode);
                waSent = Boolean(waRes?.success);
            }
            catch {
                waSent = false;
            }
        }
        return {
            success: true,
            mobile: cleanMobile,
            waSent,
            isExistingUser: availability.isExistingUser,
            existingUser: availability.existingUser,
            message: isDev
                ? 'Localhost test mode active. Use verification code: 123456'
                : waSent
                    ? `6-digit verification OTP sent to ${cleanMobile} via WhatsApp.`
                    : '6-digit verification OTP generated for onboarding.',
            devOtp: isDev ? otpCode : undefined,
            expiresInSeconds: 600,
        };
    }
    async verifyAdminCreateOtp(caller, mobile, otp, category) {
        const cleanMobile = this.normalizeAdminCreateMobile(mobile);
        const key = `${caller.id}:${cleanMobile}`;
        const stored = this.adminCreateOtpStore.get(key);
        const provided = (otp || '').trim();
        const isDev = process.env.NODE_ENV !== 'production';
        if (!stored) {
            throw new common_1.BadRequestException('OTP not requested or expired. Please click Send OTP first.');
        }
        if (Date.now() > stored.expiresAt) {
            this.adminCreateOtpStore.delete(key);
            throw new common_1.BadRequestException('OTP has expired. Please request a fresh OTP.');
        }
        if (stored.attempts >= 5) {
            this.adminCreateOtpStore.delete(key);
            throw new common_1.BadRequestException('Too many invalid OTP attempts. Please request a fresh OTP.');
        }
        const expectedBuf = Buffer.from(stored.otp, 'utf8');
        const providedBuf = Buffer.from(provided, 'utf8');
        const isExactMatch = expectedBuf.length === providedBuf.length && (0, crypto_1.timingSafeEqual)(expectedBuf, providedBuf);
        const isMatch = isExactMatch || (isDev && provided === '123456');
        if (!isMatch) {
            stored.attempts += 1;
            if (stored.attempts >= 5) {
                this.adminCreateOtpStore.delete(key);
                throw new common_1.BadRequestException('Too many invalid OTP attempts. Code invalidated; please request a fresh OTP.');
            }
            throw new common_1.BadRequestException(`Invalid OTP. ${5 - stored.attempts} attempt(s) remaining.`);
        }
        this.adminCreateOtpStore.delete(key);
        const availability = await this.checkAdminCreateMobileAvailability(cleanMobile, category);
        const otpVerificationToken = this.signAdminCreateOtpToken(caller.id, cleanMobile);
        return {
            success: true,
            verified: true,
            mobile: cleanMobile,
            otpVerificationToken,
            isExistingUser: availability.isExistingUser,
            existingUser: availability.existingUser,
            message: availability.isExistingUser
                ? `Verified! Existing account (${availability.existingUser?.name} · King ID: ${availability.existingUser?.kingId}) found. Profile prefilled to assign ${category || 'new'} role.`
                : `Mobile number ${cleanMobile} verified successfully.`,
        };
    }
    async adminCreateUser(caller, dto) {
        this.assertAdminCreateCategoryAndRole(caller, dto.category, dto.role);
        const cleanMobile = this.normalizeAdminCreateMobile(dto.mobile);
        this.verifyAdminCreateOtpToken(dto.otpVerificationToken, caller.id, cleanMobile);
        const availability = await this.checkAdminCreateMobileAvailability(cleanMobile, dto.category, dto.role);
        const cleanEmail = dto.email?.trim() ? dto.email.trim().toLowerCase() : null;
        if (cleanEmail) {
            const emailOwner = await this.prisma.user.findFirst({
                where: {
                    email: cleanEmail,
                    ...(availability.existingUser ? { id: { not: availability.existingUser.id } } : {}),
                    AND: [{ OR: [{ deletedAt: null }, { isPermanentlyBlocked: true }] }],
                },
                select: { id: true, isPermanentlyBlocked: true },
            });
            if (emailOwner) {
                throw new common_1.ConflictException(emailOwner.isPermanentlyBlocked
                    ? 'This email belongs to a permanently blocked account.'
                    : 'This email address is already registered with another FarmsKing account.');
            }
        }
        let employerFarmerId = null;
        if (dto.role === 'SUPERVISOR') {
            const employerQuery = dto.employerFarmerKingIdOrMobile?.trim();
            if (!employerQuery) {
                throw new common_1.BadRequestException('Employer Farmer King ID or 10-digit Mobile Number is required for Supervisor.');
            }
            const empDigits = employerQuery.replace(/\D/g, '').slice(-10);
            const employer = await this.prisma.user.findFirst({
                where: {
                    deletedAt: null,
                    OR: [
                        { kingId: employerQuery },
                        ...(empDigits.length === 10
                            ? [{ mobile: empDigits }, { mobile: `+91${empDigits}` }, { mobile: { endsWith: empDigits } }]
                            : []),
                    ],
                },
                select: { id: true, role: true, roles: true, deactivatedRoles: true, name: true, kingId: true },
            });
            if (!employer) {
                throw new common_1.NotFoundException('Employer Farmer account not found by that King ID or Mobile Number.');
            }
            const empRoles = (0, role_policy_util_1.getActiveRolesList)(employer);
            if (!empRoles.includes(client_1.Role.FARMER)) {
                throw new common_1.BadRequestException(`User ${employer.name} (${employer.kingId}) does not hold an active Farmer role.`);
            }
            employerFarmerId = employer.id;
        }
        if (dto.role === 'SELLER' && !dto.storeName?.trim()) {
            throw new common_1.BadRequestException('Store Name is required when onboarding a Seller.');
        }
        let primaryRole;
        let assignedRoles;
        let advisorType = null;
        switch (dto.role) {
            case 'ADMIN':
            case 'MANAGER':
            case 'OPERATOR':
            case 'TECHNICAL_TRAINER':
            case 'ACCOUNTANT':
                primaryRole = dto.role;
                assignedRoles = [primaryRole];
                break;
            case 'FARM_ADVISOR':
                primaryRole = client_1.Role.ADVISOR;
                assignedRoles = [client_1.Role.ADVISOR, client_1.Role.CUSTOMER];
                advisorType = 'FARM';
                break;
            case 'GARDEN_ADVISOR':
                primaryRole = client_1.Role.ADVISOR;
                assignedRoles = [client_1.Role.ADVISOR, client_1.Role.CUSTOMER];
                advisorType = 'GARDEN';
                break;
            case 'AGENT':
            case 'SELLER':
            case 'TRADER':
                primaryRole = dto.role;
                assignedRoles = [primaryRole, client_1.Role.CUSTOMER];
                break;
            case 'FARMER':
            case 'GARDENER':
                primaryRole = dto.role;
                assignedRoles = [client_1.Role.CUSTOMER, primaryRole];
                break;
            case 'SUPERVISOR':
                primaryRole = client_1.Role.SUPERVISOR;
                assignedRoles = [client_1.Role.SUPERVISOR, client_1.Role.CUSTOMER];
                break;
            case 'CUSTOMER':
            default:
                primaryRole = client_1.Role.CUSTOMER;
                assignedRoles = [client_1.Role.CUSTOMER];
                break;
        }
        const customPassword = dto.password?.trim();
        const isPasswordRole = dto.category === 'STAFF' || dto.category === 'PARTNERS';
        const plainPassword = customPassword || (isPasswordRole ? generateTempPassword() : (0, crypto_1.randomBytes)(24).toString('hex'));
        const passwordHash = await argon2.hash(plainPassword);
        const kingId = availability.existingUser?.kingId || (await (0, king_id_util_1.generateUniqueKingId)(this.prisma));
        const createdUser = await this.prisma.$transaction(async (tx) => {
            let user;
            if (availability.isExistingUser && availability.existingUser) {
                const nextRoles = Array.from(new Set([...(availability.existingUser.roles ?? []), ...assignedRoles]));
                (0, role_policy_util_1.assertRoleCombinationAllowed)(nextRoles);
                const nextDeactivated = (availability.existingUser.deactivatedRoles ?? []).filter((r) => !assignedRoles.includes(r));
                const nextPrimaryRole = (0, role_policy_util_1.pickBestPrimaryRole)(nextRoles);
                user = await tx.user.update({
                    where: { id: availability.existingUser.id },
                    data: {
                        kingId,
                        name: dto.name.trim(),
                        ...(cleanEmail ? { email: cleanEmail, isEmailVerified: true } : {}),
                        ...(dto.pincode?.trim() ? { pincode: dto.pincode.trim() } : {}),
                        ...(dto.postOffice?.trim() ? { postOffice: dto.postOffice.trim() } : {}),
                        ...(dto.village?.trim() ? { village: dto.village.trim() } : {}),
                        ...(dto.district?.trim() ? { district: dto.district.trim() } : {}),
                        ...(dto.state?.trim() ? { state: dto.state.trim() } : {}),
                        ...(dto.address?.trim() ? { billPrintingAddress: dto.address.trim() } : {}),
                        ...(dto.role === 'FARMER' && dto.address?.trim() ? { farmAddress: dto.address.trim() } : {}),
                        ...(dto.role === 'FARMER' && dto.farmName?.trim() ? { farmName: dto.farmName.trim() } : {}),
                        ...(dto.role === 'FARMER' && dto.sprayTankSizeL ? { sprayTankSizeL: dto.sprayTankSizeL } : {}),
                        ...(dto.role === 'FARMER' && dto.soilType ? { soilType: dto.soilType } : {}),
                        ...(dto.role === 'FARMER' && dto.waterType ? { waterType: dto.waterType } : {}),
                        role: nextPrimaryRole,
                        roles: nextRoles,
                        deactivatedRoles: nextDeactivated,
                        ...(advisorType ? { advisorType } : {}),
                        ...(primaryRole === client_1.Role.ADVISOR && dto.specialization?.trim() ? { specialization: dto.specialization.trim() } : {}),
                        ...(primaryRole === client_1.Role.ADVISOR && dto.qualification?.trim() ? { qualification: dto.qualification.trim() } : {}),
                        ...(primaryRole === client_1.Role.ADVISOR && dto.yearsExperience !== undefined ? { yearsExperience: dto.yearsExperience } : {}),
                        ...(primaryRole === client_1.Role.ADVISOR && dto.doctorConsultationFee !== undefined ? { doctorConsultationFee: dto.doctorConsultationFee } : {}),
                        ...(primaryRole === client_1.Role.ADVISOR && dto.bio?.trim() ? { bio: dto.bio.trim() } : {}),
                        ...(dto.panNumber?.trim() ? { panNumber: dto.panNumber.trim().toUpperCase() } : {}),
                        ...(dto.upiId?.trim() ? { upiId: dto.upiId.trim() } : {}),
                        ...(dto.alternativeMobile?.trim() ? { alternativeMobile: dto.alternativeMobile.trim() } : {}),
                        ...(dto.bankAccountHolderName?.trim() ? { bankAccountHolderName: dto.bankAccountHolderName.trim() } : {}),
                        ...(dto.bankAccountNumber?.trim() ? { bankAccountNumber: dto.bankAccountNumber.trim() } : {}),
                        ...(dto.bankIfsc?.trim() ? { bankIfsc: dto.bankIfsc.trim().toUpperCase() } : {}),
                        ...(employerFarmerId ? { employerFarmerId } : {}),
                        ...(primaryRole === client_1.Role.SUPERVISOR
                            ? {
                                supervisorPermissions: [
                                    client_1.SupervisorPermission.MANAGE_SPRAY_SCHEDULE,
                                    client_1.SupervisorPermission.MANAGE_LABOUR_EXPENSES,
                                    client_1.SupervisorPermission.CROP_DOCTOR_CHAT,
                                    client_1.SupervisorPermission.MANAGE_HARVEST_SALES,
                                ],
                            }
                            : {}),
                        ...(isPasswordRole || customPassword ? { passwordHash } : {}),
                        isPhoneVerified: true,
                    },
                    select: SAFE_USER_SELECT,
                });
            }
            else {
                user = await tx.user.create({
                    data: {
                        kingId,
                        mobile: cleanMobile,
                        passwordHash,
                        name: dto.name.trim(),
                        email: cleanEmail,
                        isPhoneVerified: true,
                        isEmailVerified: Boolean(cleanEmail),
                        pincode: dto.pincode?.trim() || null,
                        postOffice: dto.postOffice?.trim() || null,
                        village: dto.village?.trim() || null,
                        district: dto.district?.trim() || null,
                        state: dto.state?.trim() || null,
                        billPrintingAddress: dto.address?.trim() || null,
                        farmAddress: dto.role === 'FARMER' ? (dto.address?.trim() || null) : null,
                        farmName: dto.role === 'FARMER' ? (dto.farmName?.trim() || null) : null,
                        sprayTankSizeL: dto.role === 'FARMER' ? (dto.sprayTankSizeL ?? null) : null,
                        soilType: dto.role === 'FARMER' ? (dto.soilType ?? null) : null,
                        waterType: dto.role === 'FARMER' ? (dto.waterType ?? null) : null,
                        role: primaryRole,
                        roles: assignedRoles,
                        advisorType,
                        specialization: primaryRole === client_1.Role.ADVISOR ? (dto.specialization?.trim() || null) : null,
                        qualification: primaryRole === client_1.Role.ADVISOR ? (dto.qualification?.trim() || null) : null,
                        yearsExperience: primaryRole === client_1.Role.ADVISOR ? (dto.yearsExperience ?? null) : null,
                        doctorConsultationFee: primaryRole === client_1.Role.ADVISOR ? (dto.doctorConsultationFee ?? null) : null,
                        bio: primaryRole === client_1.Role.ADVISOR ? (dto.bio?.trim() || null) : null,
                        panNumber: dto.panNumber?.trim().toUpperCase() || null,
                        upiId: dto.upiId?.trim() || null,
                        alternativeMobile: dto.alternativeMobile?.trim() || null,
                        bankAccountHolderName: dto.bankAccountHolderName?.trim() || null,
                        bankAccountNumber: dto.bankAccountNumber?.trim() || null,
                        bankIfsc: dto.bankIfsc?.trim().toUpperCase() || null,
                        employerFarmerId,
                        supervisorPermissions: primaryRole === client_1.Role.SUPERVISOR
                            ? [
                                client_1.SupervisorPermission.MANAGE_SPRAY_SCHEDULE,
                                client_1.SupervisorPermission.MANAGE_LABOUR_EXPENSES,
                                client_1.SupervisorPermission.CROP_DOCTOR_CHAT,
                                client_1.SupervisorPermission.MANAGE_HARVEST_SALES,
                            ]
                            : [],
                        termsAcceptedAt: new Date(),
                        privacyPolicyVersion: '2026.11',
                    },
                    select: SAFE_USER_SELECT,
                });
            }
            if (primaryRole === client_1.Role.FARMER) {
                await tx.farmerPlan.upsert({
                    where: { farmerId: user.id },
                    create: { farmerId: user.id },
                    update: {},
                });
            }
            else if (primaryRole === client_1.Role.GARDENER) {
                await tx.gardenerPlan.upsert({
                    where: { gardenerId: user.id },
                    create: { gardenerId: user.id },
                    update: {},
                });
            }
            else if (primaryRole === client_1.Role.SELLER) {
                const rawBase = (dto.storeName || dto.name || 'seller-store')
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '')
                    .slice(0, 32) || 'farmsking-store';
                const slug = `${rawBase}-${(0, crypto_1.randomBytes)(3).toString('hex')}`;
                await tx.sellerStore.create({
                    data: {
                        sellerId: user.id,
                        storeName: dto.storeName.trim(),
                        slug,
                        sellerType: dto.sellerType || client_1.SellerType.COMMERCIAL,
                        legalName: dto.name.trim(),
                        gstin: dto.gstin?.trim().toUpperCase() || null,
                        panNumber: dto.panNumber?.trim().toUpperCase() || null,
                        upiId: dto.upiId?.trim() || null,
                        kycStatus: client_1.SellerKycStatus.VERIFIED,
                        kycVerifiedAt: new Date(),
                        kycVerifiedById: caller.id,
                        bankAccountNo: dto.bankAccountNumber?.trim() || null,
                        bankIfsc: dto.bankIfsc?.trim().toUpperCase() || null,
                        bankBeneficiaryName: dto.bankAccountHolderName?.trim() || null,
                        pickupAddress: dto.address?.trim() || null,
                        pickupCity: dto.district?.trim() || null,
                        pickupState: dto.state?.trim() || null,
                        pickupPincode: dto.pincode?.trim() || null,
                        sellerAgreementAcceptedAt: new Date(),
                        sellerAgreementVersion: '2026.11',
                    },
                });
            }
            if (tx.verifiedSignupLead?.findUnique && tx.verifiedSignupLead?.update) {
                const existingLead = await tx.verifiedSignupLead.findUnique({ where: { mobile: cleanMobile } });
                if (existingLead) {
                    await tx.verifiedSignupLead.update({
                        where: { id: existingLead.id },
                        data: {
                            status: client_1.VerifiedLeadStatus.CONVERTED_BY_ADMIN,
                            convertedUserId: user.id,
                            convertedById: caller.id,
                            convertedAt: new Date(),
                            intendedRole: primaryRole,
                            capturedName: user.name,
                            capturedEmail: user.email,
                            pincode: user.pincode,
                            district: user.district,
                            state: user.state,
                            village: user.village,
                        },
                    });
                }
            }
            await tx.isoAuditLog?.create({
                data: {
                    action: 'ADMIN_CREATED_USER_WITH_OTP',
                    actorId: caller.id,
                    actorName: caller.name,
                    details: {
                        createdUserId: user.id,
                        kingId: user.kingId,
                        mobile: cleanMobile,
                        category: dto.category,
                        role: dto.role,
                    },
                },
            });
            return user;
        });
        try {
            await (0, invite_coupon_util_1.provisionInviteCoupon)(this.prisma, createdUser.id);
        }
        catch { }
        if (dto.category !== 'STAFF') {
            try {
                await this.walletService.ensureWelcomeBonus(createdUser.id);
            }
            catch { }
        }
        try {
            await this.notificationsService.create(createdUser.id, client_1.NotificationType.SYSTEM, 'Welcome to FarmsKing!', `Hello ${createdUser.name}! Your FarmsKing (${dto.role.replace(/_/g, ' ')}) account is now active. King ID: ${createdUser.kingId}.`);
        }
        catch { }
        this.whatsappBotService
            ?.sendDirectTextMessage(cleanMobile, `🌾 *Welcome to FarmsKing!* 🙏✨\n\nHello *${createdUser.name}*,\nYour FarmsKing *${dto.role.replace(/_/g, ' ')}* account has been activated by Admin!\n\n🔑 *King ID:* ${createdUser.kingId}\n📱 *Mobile:* ${cleanMobile}${isPasswordRole && !customPassword ? `\n🔐 *Temporary Password:* ${plainPassword}` : ''}\n\nVisit https://farmsking.in to get started.\n\n- FARMSKING TECHNOLOGIES PRIVATE LIMITED`)
            .catch(() => { });
        this.whatsappGroupSyncService
            ?.autoAddNewUser(createdUser.id, cleanMobile, createdUser.name)
            .catch(() => { });
        return {
            success: true,
            user: createdUser,
            tempPassword: isPasswordRole && !customPassword ? plainPassword : null,
            message: `${createdUser.name} created successfully with King ID ${createdUser.kingId}.`,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, common_1.Optional)()),
    __param(5, (0, common_1.Optional)()),
    __param(6, (0, common_1.Optional)()),
    __param(7, (0, common_1.Optional)()),
    __param(8, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService,
        whatsapp_group_sync_service_1.WhatsAppGroupSyncService,
        notifications_service_1.NotificationsService,
        app_settings_service_1.AppSettingsService,
        whatsapp_service_1.WhatsappBotService,
        email_service_1.EmailService,
        user_session_service_1.UserSessionService,
        jwt_1.JwtService])
], UsersService);
//# sourceMappingURL=users.service.js.map