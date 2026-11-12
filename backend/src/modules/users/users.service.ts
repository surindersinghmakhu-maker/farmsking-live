import { randomBytes, randomInt, timingSafeEqual } from 'crypto';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, OnModuleInit, Optional } from '@nestjs/common';
import {
  AdminStaffPermission,
  FarmerSubscriptionPlan,
  NotificationType,
  OperatorPermission,
  PartnerApplicationStatus,
  Prisma,
  Role,
  SellerKycStatus,
  SellerType,
  SupervisorPermission,
  VerifiedLeadStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { WhatsappBotService } from '../whatsapp/whatsapp.service';
import { EmailService } from '../email/email.service';
import { CreateAdvisorDto } from './dto/create-advisor.dto';
import { CreateAssistantDoctorDto } from './dto/create-assistant-doctor.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { CreateSupervisorDto } from './dto/create-supervisor.dto';
import { AppointSupervisorRequestDto, RespondSupervisorRequestDto } from './dto/appoint-supervisor-request.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateFarmerProfileDto } from './dto/update-farmer-profile.dto';
import { UpdateAdvisorProfileDto } from './dto/update-advisor-profile.dto';
import { UpdatePartnerProfileDto } from './dto/update-partner-profile.dto';
import { UpdateMyAddressDto } from './dto/update-my-address.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ConvertVerifiedLeadDto, UpdateVerifiedLeadNotesDto } from './dto/convert-verified-lead.dto';
import { WhatsAppGroupSyncService } from '../whatsapp/whatsapp-group-sync.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { generateUniqueKingId } from '../../common/utils/king-id.util';
import {
  ADMIN_STAFF_ROLES,
  FARM_STAFF_ROLES,
  assertRoleCombinationAllowed,
  getActiveRolesList,
  pickBestPrimaryRole,
} from '../../common/utils/role-policy.util';
import { provisionInviteCoupon } from '../../common/utils/invite-coupon.util';
import { UnauthorizedException } from '@nestjs/common';
import { getAuth } from 'firebase-admin/auth';
import { provisionPartnerReferralCoupon } from '../../common/utils/partner-coupon.util';
import { provisionReferralWelcomeCoupon } from '../../common/utils/referral-coupon.util';
import {
  ADVISOR_PROFILE_FIELDS,
  BUSINESS_PARTNER_PROFILE_FIELDS,
  getAdvisorPayoutProfileStatus,
  getPartnerProfileStatus as computePartnerProfileStatus,
} from '../../common/utils/partner-profile.util';

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
} as const;

function generateTempPassword(): string {
  // 10-char alphanumeric temp password, e.g. "a1b2c3d4e5"
  return randomBytes(8).toString('hex').slice(0, 10);
}

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly deleteMeOtpStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly whatsappGroupSyncService: WhatsAppGroupSyncService,
    private readonly notificationsService: NotificationsService,
    @Optional() private readonly appSettingsService?: AppSettingsService,
    @Optional() private readonly whatsappBotService?: WhatsappBotService,
    @Optional() private readonly emailService?: EmailService,
  ) {}

  async onModuleInit() {
    // Intentionally left blank to avoid blocking app boot.
  }

  async list(query: ListUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const status = query.status ?? 'all';

    const conditions: Prisma.UserWhereInput[] = [];

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
    } else if (status === 'inactive') {
      conditions.push({ deletedAt: { not: null } });
    }

    if (query.search) {
      conditions.push({
        OR: [
          { name: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
          { mobile: { contains: query.search } },
          { kingId: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
        ],
      });
    }

    const where: Prisma.UserWhereInput = conditions.length > 0 ? { AND: conditions } : {};

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

  /** Advisor-facing type-search: active Agents matching a name or king id substring, capped small. */
  async searchBusinessPartners(q?: string) {
    const query = (q ?? '').trim();
    return this.prisma.user.findMany({
      where: {
        OR: [
          { role: Role.AGENT },
          {
            AND: [
              { roles: { has: Role.AGENT } },
              { NOT: { deactivatedRoles: { has: Role.AGENT } } },
            ],
          },
        ],
        deletedAt: null,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
                { kingId: { contains: query, mode: Prisma.QueryMode.insensitive } },
              ],
            }
          : {}),
      },
      select: { id: true, name: true, kingId: true, mobile: true },
      orderBy: { name: 'asc' },
      take: 20,
    });
  }

  async createAdvisor(dto: CreateAdvisorDto) {
    const existing = await this.prisma.user.findUnique({ where: { mobile: dto.mobile } });
    if (existing) {
      throw new ConflictException('An account with this mobile number already exists.');
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await argon2.hash(tempPassword);
    const kingId = await generateUniqueKingId(this.prisma);

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
        role: Role.ADVISOR,
        roles: [Role.ADVISOR, Role.CUSTOMER],
        advisorType: dto.advisorType,
      },
      select: SAFE_USER_SELECT,
    });

    await provisionInviteCoupon(this.prisma, user.id);

    return { user, tempPassword };
  }

  async createAssistantDoctorBySenior(currentUser: AuthUser, dto: CreateAssistantDoctorDto) {
    const senior = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { id: true, isSeniorDoctor: true, role: true, name: true },
    });

    if (currentUser.role !== Role.SUPER_ADMIN && currentUser.role !== Role.ADMIN && !senior?.isSeniorDoctor) {
      throw new ForbiddenException('Only Senior Doctors can create Assistant Doctors.');
    }

    const existing = await this.prisma.user.findUnique({ where: { mobile: dto.mobile } });
    if (existing) {
      throw new ConflictException('An account with this mobile number already exists.');
    }

    const initialPassword = dto.password?.trim() || generateTempPassword();
    const passwordHash = await argon2.hash(initialPassword);
    const kingId = await generateUniqueKingId(this.prisma);

    const user = await this.prisma.user.create({
      data: {
        kingId,
        mobile: dto.mobile,
        passwordHash,
        name: dto.name,
        role: Role.ADVISOR,
        roles: [Role.ADVISOR, Role.CUSTOMER],
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

    await provisionInviteCoupon(this.prisma, user.id);

    return { user, tempPassword: initialPassword };
  }

  async getMyAssistantDoctors(currentUser: AuthUser) {
    return this.prisma.user.findMany({
      where: { seniorDoctorId: currentUser.id, deletedAt: null },
      select: SAFE_USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }


  private async createStaff(dto: CreateStaffDto, role: Role) {
    const existing = await this.prisma.user.findUnique({ where: { mobile: dto.mobile } });
    if (existing) {
      throw new ConflictException('An account with this mobile number already exists.');
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await argon2.hash(tempPassword);
    const kingId = await generateUniqueKingId(this.prisma);

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
        roles: (role === Role.ADMIN || role === Role.SUPER_ADMIN || role === Role.ACCOUNTANT) ? [role] : [role, Role.CUSTOMER],
      },
      select: SAFE_USER_SELECT,
    });

    await provisionInviteCoupon(this.prisma, user.id);

    return { user, tempPassword };
  }

  /** Refetches the caller's own current record — used by the app to pick up freshly-granted roles without re-login. */
  async getMe(user: AuthUser) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: SAFE_USER_SELECT });
  }

  /** Self-service Account Deletion Step 1: Server-side OTP dispatch */
  async requestDeleteMeOtp(user: AuthUser, mobile?: string) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, mobile: true, farmMobile: true, email: true, name: true },
    });
    if (!dbUser) {
      throw new NotFoundException('User account not found.');
    }

    const regDigits = (dbUser.mobile || '').replace(/\D/g, '').slice(-10);
    const farmDigits = (dbUser.farmMobile || '').replace(/\D/g, '').slice(-10);
    const requestedDigits = mobile ? mobile.replace(/\D/g, '').slice(-10) : regDigits;

    if (!requestedDigits || (requestedDigits !== regDigits && requestedDigits !== farmDigits)) {
      throw new BadRequestException('Please enter the 10-digit mobile number registered with this account.');
    }

    const otpCode = randomInt(100000, 1000000).toString();
    this.deleteMeOtpStore.set(user.id, {
      otp: otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    });

    const isDev = process.env.NODE_ENV !== 'production';
    const channels: string[] = [];

    if (this.whatsappBotService) {
      try {
        const waRes = await this.whatsappBotService.sendOtpMessage(requestedDigits, otpCode);
        if (waRes?.success) channels.push('WhatsApp');
      } catch {}
    }

    if (dbUser.email && !dbUser.email.includes('placeholder') && this.emailService) {
      try {
        const emailSent = await this.emailService.sendEmailOtp(dbUser.email, otpCode);
        if (emailSent) channels.push('Email');
      } catch {}
    }

    return {
      success: true,
      deliveredVia: channels,
      message:
        channels.length > 0
          ? `6-digit account deletion OTP sent via ${channels.join(' & ')}.`
          : isDev
          ? 'Local development mode: 6-digit account deletion OTP generated.'
          : 'Verification code generated for account deletion.',
      devOtp: isDev ? otpCode : undefined,
      expiresInSeconds: 600,
    };
  }

  /** Self-service Account Deletion (Google Play Store Policy Requirement): Soft-deletes & purges PII, profile, wallet balance, and photos. */
  async deleteMe(user: AuthUser, verification?: { otp?: string; firebaseIdToken?: string }) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, mobile: true, farmMobile: true, email: true, name: true, kingId: true },
    });

    if (!dbUser) {
      throw new NotFoundException('User account not found.');
    }

    const regDigits = (dbUser.mobile || '').replace(/\D/g, '').slice(-10);
    const farmDigits = (dbUser.farmMobile || '').replace(/\D/g, '').slice(-10);

    let verified = false;

    if (verification?.firebaseIdToken) {
      try {
        const decoded = await getAuth().verifyIdToken(verification.firebaseIdToken);
        const tokenDigits = (decoded?.phone_number || '').replace(/\D/g, '').slice(-10);
        if (!tokenDigits || (tokenDigits !== regDigits && tokenDigits !== farmDigits)) {
          throw new UnauthorizedException('Verified phone number does not match this account.');
        }
        verified = true;
      } catch (err: any) {
        if (err instanceof UnauthorizedException) throw err;
        throw new UnauthorizedException('Invalid or expired Firebase phone verification token.');
      }
    } else if (verification?.otp?.trim()) {
      const provided = verification.otp.trim();
      const stored = this.deleteMeOtpStore.get(user.id);
      if (!stored) {
        throw new BadRequestException('No active deletion OTP found. Please request a fresh 6-digit verification code.');
      }
      if (Date.now() > stored.expiresAt) {
        this.deleteMeOtpStore.delete(user.id);
        throw new BadRequestException('Deletion OTP has expired. Please request a new verification code.');
      }
      if (stored.attempts >= 5) {
        this.deleteMeOtpStore.delete(user.id);
        throw new BadRequestException('Too many invalid OTP attempts. Please request a new verification code.');
      }
      const expectedBuf = Buffer.from(stored.otp, 'utf8');
      const providedBuf = Buffer.from(provided, 'utf8');
      const isMatch = expectedBuf.length === providedBuf.length && timingSafeEqual(expectedBuf, providedBuf);
      if (!isMatch) {
        stored.attempts += 1;
        if (stored.attempts >= 5) {
          this.deleteMeOtpStore.delete(user.id);
          throw new BadRequestException('Too many invalid OTP attempts. Code invalidated; please request a fresh OTP.');
        }
        throw new BadRequestException(`Invalid 6-digit OTP code. ${5 - stored.attempts} attempt(s) remaining.`);
      }
      this.deleteMeOtpStore.delete(user.id);
      verified = true;
    }

    if (!verified) {
      throw new BadRequestException('Server-side OTP or Firebase phone verification is required before deleting your account.');
    }

    // 1. Zero out & clear remaining wallet balance — mark transaction clearly for audit
    try {
      const currentBalance = await this.walletService.getBalance(user.id);
      if (currentBalance > 0) {
        await this.walletService.debit(
          user.id,
          currentBalance,
          `Account Deleted — Wallet balance of ₹${currentBalance} debited. Reason: Account deletion by user.`,
        );
      }
      // If balance is already 0, nothing to debit — wallet is already clean
    } catch (e) {
      console.warn('Failed to clear wallet balance during account deletion:', e);
    }

    // 2. Soft-delete employer supervisor sub-accounts created under this account
    try {
      await this.prisma.user.updateMany({
        where: { employerFarmerId: user.id },
        data: { deletedAt: new Date() },
      });
    } catch (e) {
      console.warn('Failed to soft-delete supervisor sub-accounts:', e);
    }

    // 3. Scrub & anonymize PII — Google Play Store Account Deletion Policy Compliance.
    //    IMPORTANT: kingId is intentionally NOT changed — all linked historical records
    //    (bills, orders, salary entries, workers, wallet transactions) stay traceable.
    //    Mobile & Email get a DEL_ prefix so they are unusable for login
    //    but still uniquely distinguishable in the DB for auditing.
    const ts = Date.now();
    const delMobile = dbUser.mobile ? `${dbUser.mobile}_del_${ts}` : `UNKNOWN_${user.id}_del_${ts}`;
    const delEmail  = dbUser.email  ? `${dbUser.email}_del_${ts}`  : null;
    const delKingId = dbUser.kingId ? `${dbUser.kingId}_del_${ts}` : null;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: 'Deleted Account',
        mobile: delMobile,       // Appended _del so login is blocked but recovery/signup is possible
        email: delEmail,         // Appended _del
        kingId: delKingId,       // Appended _del to disable login via kingId and allow freeing up the ID if needed
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

    // 4. Auto-remove from WhatsApp Group
    this.whatsappGroupSyncService.autoRemoveUser(user.id, dbUser.mobile ?? '', dbUser.name ?? 'User').catch(() => {});

    return {
      success: true,
      message: 'Account deleted successfully. Your King ID and all linked historical records (orders, bills, workers, wallet) are retained for audit. Personal information has been permanently removed in accordance with Google Play Store policy.',
    };
  }

  /** Every user's shareable invite code — reuses their auto-issued personal Coupon (see provisionInviteCoupon). */
  async getMyInviteLink(user: AuthUser) {
    const coupon = await this.prisma.coupon.findFirst({
      where: { businessPartnerId: user.id, createdById: user.id },
      orderBy: { createdAt: 'asc' },
    });
    if (!coupon) {
      throw new NotFoundException('No invite code found for this account.');
    }
    return { code: coupon.code };
  }

  /** Every account this user directly referred in (via King ID at signup or a Super Admin manual link), with what each has earned them so far from their welcome-coupon redemptions. */
  async getMyReferrals(user: AuthUser) {
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
    const earnedByReferralId = new Map<string, number>();
    for (const c of coupons) {
      const total = c.redemptions.reduce((sum, r) => sum + Number(r.commissionAmount), 0);
      earnedByReferralId.set(c.createdById, (earnedByReferralId.get(c.createdById) ?? 0) + total);
    }

    return referrals.map((r) => ({ ...r, commissionEarned: earnedByReferralId.get(r.id) ?? 0 }));
  }

  /** Super Admin: manually link a customer's account to a referrer (by King ID) when they signed up without a referral code. Permanent — can only be set once. */
  async setReferrer(id: string, referredByKingId: string) {
    const user = await this.findActiveOrThrow(id);
    if (user.referredById) {
      throw new ConflictException('This account already has a referrer set — it cannot be changed.');
    }
    const referrer = await this.prisma.user.findUnique({ where: { kingId: referredByKingId.trim() }, select: { id: true } });
    if (!referrer) {
      throw new BadRequestException('No account found with that King ID.');
    }
    if (referrer.id === id) {
      throw new BadRequestException('An account cannot refer itself.');
    }
    await this.prisma.user.update({ where: { id }, data: { referredById: referrer.id } });
    await provisionReferralWelcomeCoupon(this.prisma, id, referrer.id);
    return this.prisma.user.findUniqueOrThrow({ where: { id }, select: SAFE_USER_SELECT });
  }

  createTrainer(dto: CreateStaffDto) {
    return this.createStaff(dto, Role.TECHNICAL_TRAINER);
  }

  createOperator(dto: CreateStaffDto) {
    return this.createStaff(dto, Role.OPERATOR);
  }

  /** Self-serve: a CUSTOMER becomes a FARMER and gets a FREE FarmerPlan. */
  async becomeFarmer(user: AuthUser, dto?: UpdateFarmerProfileDto) {
    const existingUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { mobile: true, role: true, roles: true, deactivatedRoles: true },
    });

    const activeRoles = getActiveRolesList(existingUser);
    const isSuperAdminMobile = existingUser.mobile === '9872066901';
    if (!isSuperAdminMobile) {
      if (activeRoles.some((r) => ADMIN_STAFF_ROLES.includes(r))) {
        throw new ConflictException('Admin Panel staff accounts cannot hold Farmer role.');
      }
      if (activeRoles.some((r) => FARM_STAFF_ROLES.includes(r))) {
        throw new ConflictException(
          'Farm Staff accounts (Supervisor and Labour Worker) cannot become Farmers on the same mobile number.',
        );
      }
      if (activeRoles.includes(Role.GARDENER)) {
        throw new ConflictException(
          'This account is already registered as a Gardener. An account cannot be both Farmer and Gardener at the same time.',
        );
      }
    }

    const currentRoles = existingUser.roles ?? [];
    const currentDeactivated = existingUser.deactivatedRoles ?? [];

    const rolesToAdd = isSuperAdminMobile
      ? [Role.SUPER_ADMIN, Role.ADMIN, Role.FARMER]
      : [Role.FARMER];

    const newRoles = Array.from(new Set([...currentRoles, ...rolesToAdd]));
    const newDeactivated = currentDeactivated.filter((r) => r !== Role.FARMER && r !== Role.SUPER_ADMIN);
    const primaryRole = isSuperAdminMobile ? Role.SUPER_ADMIN : Role.FARMER;

    const profileData: Prisma.UserUpdateInput = {};
    if (dto) {
      if (dto.name !== undefined) profileData.name = dto.name;
      if (dto.photoUrl !== undefined) profileData.photoUrl = dto.photoUrl;
      if (dto.sprayTankSizeL !== undefined) profileData.sprayTankSizeL = dto.sprayTankSizeL;
      if (dto.soilType !== undefined) profileData.soilType = dto.soilType;
      if (dto.waterType !== undefined) profileData.waterType = dto.waterType;
      if (dto.pincode !== undefined) profileData.pincode = dto.pincode;
      if (dto.postOffice !== undefined) profileData.postOffice = dto.postOffice;
      if (dto.village !== undefined) profileData.village = dto.village;
      if (dto.district !== undefined) profileData.district = dto.district;
      if (dto.state !== undefined) profileData.state = dto.state;
      if (dto.billPrintingAddress !== undefined) profileData.billPrintingAddress = dto.billPrintingAddress;
      if (dto.upiId !== undefined) profileData.upiId = dto.upiId;
      if (dto.farmName !== undefined) profileData.farmName = dto.farmName;
      if (dto.farmAddress !== undefined) profileData.farmAddress = dto.farmAddress;
      if (dto.farmMobile !== undefined) profileData.farmMobile = dto.farmMobile;
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

  /** Self-serve: a CUSTOMER becomes a GARDENER and gets a FREE GardenerPlan. */
  async becomeGardener(user: AuthUser) {
    const existingUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { role: true, roles: true, deactivatedRoles: true },
    });

    const activeRoles = getActiveRolesList(existingUser);
    if (activeRoles.some((r) => ADMIN_STAFF_ROLES.includes(r))) {
      throw new ConflictException('Admin Panel staff accounts cannot hold Gardener role.');
    }
    if (activeRoles.some((r) => FARM_STAFF_ROLES.includes(r))) {
      throw new ConflictException(
        'Farm Staff accounts (Supervisor and Labour Worker) cannot become Gardeners on the same mobile number.',
      );
    }
    if (activeRoles.includes(Role.FARMER)) {
      throw new ConflictException(
        'This account is already registered as a Farmer. An account cannot be both Farmer and Gardener at the same time.',
      );
    }

    const currentRoles = existingUser.roles ?? [];
    const currentDeactivated = existingUser.deactivatedRoles ?? [];

    const rolesToAdd = [Role.GARDENER];

    const newRoles = Array.from(new Set([...currentRoles, ...rolesToAdd]));
    const newDeactivated = currentDeactivated.filter((r) => r !== Role.GARDENER);

    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          role: Role.GARDENER,
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

  createAdmin(dto: CreateStaffDto) {
    return this.createStaff(dto, Role.ADMIN);
  }

  createManager(dto: CreateStaffDto) {
    return this.createStaff(dto, Role.MANAGER);
  }

  createAccountant(dto: CreateStaffDto) {
    return this.createStaff(dto, Role.ACCOUNTANT);
  }

  async updateAdminStaffPermissions(id: string, permissions: AdminStaffPermission[]) {
    const user = await this.findActiveOrThrow(id);
    if (user.role !== Role.ADMIN && user.role !== Role.MANAGER && user.role !== Role.OPERATOR) {
      throw new BadRequestException('Can only set staff permissions for Admin, Manager, or Operator accounts.');
    }
    return this.prisma.user.update({
      where: { id },
      data: { adminStaffPermissions: permissions },
      select: SAFE_USER_SELECT,
    });
  }

  async createSupervisorByFarmer(farmer: AuthUser, dto: CreateSupervisorDto) {
    const farmerPlan = await this.prisma.farmerPlan.findUnique({
      where: { farmerId: farmer.id },
    });
    const isVipOrSuper = farmerPlan?.plan === FarmerSubscriptionPlan.SUPER || farmerPlan?.plan === FarmerSubscriptionPlan.VIP;
    if (!isVipOrSuper && farmer.role !== Role.SUPER_ADMIN && farmer.role !== Role.ADMIN) {
      throw new ForbiddenException('Only farmers with VIP Membership (or Super Admin) can add Supervisors.');
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
      // Domain Rule: A supervisor can work for only 1 farmer at a time!
      if (existing.employerFarmerId && existing.employerFarmerId !== farmer.id) {
        const currentEmployer = await this.prisma.user.findUnique({
          where: { id: existing.employerFarmerId },
          select: { name: true, kingId: true, mobile: true },
        });
        throw new ConflictException(
          `This supervisor is currently actively working under farmer "${currentEmployer?.name || 'Another Farmer'}" (${currentEmployer?.kingId || ''}). A supervisor cannot work for 2 farmers at the same time. They must resign from their current employer before joining a new farmer.`,
        );
      }

      if (existing.employerFarmerId === farmer.id) {
        const updated = await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            supervisorPermissions: dto.permissions ?? [
              SupervisorPermission.MANAGE_SPRAY_SCHEDULE,
              SupervisorPermission.MANAGE_LABOUR_EXPENSES,
              SupervisorPermission.CROP_DOCTOR_CHAT,
              SupervisorPermission.MANAGE_HARVEST_SALES,
            ],
            deletedAt: null,
          },
          select: SAFE_USER_SELECT,
        });
        return { supervisor: updated, tempPassword: '(Already Assigned)' };
      }

      // Existing user has resigned or was unassigned: link them as supervisor for this farmer ONLY if compatible!
      const activeExisting = getActiveRolesList(existing);
      const incompatibleRoles = activeExisting.filter(
        (r) => r !== Role.SUPERVISOR && r !== Role.CUSTOMER,
      );
      if (incompatibleRoles.length > 0) {
        throw new ConflictException(
          `This mobile number already holds active role (${incompatibleRoles.join(', ')}). A supervisor must use a dedicated mobile number without Farmer, Gardener, Labour, Agent, Seller, Advisor, Trader, or Staff roles.`,
        );
      }
      const updatedRoles = Array.from(new Set([...(existing.roles ?? []), Role.SUPERVISOR, Role.CUSTOMER]));
      const nextDeactivated = (existing.deactivatedRoles ?? []).filter((r) => r !== Role.SUPERVISOR);
      const updated = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          employerFarmerId: farmer.id,
          role: Role.SUPERVISOR,
          roles: updatedRoles,
          deactivatedRoles: nextDeactivated,
          supervisorPermissions: dto.permissions ?? [
            SupervisorPermission.MANAGE_SPRAY_SCHEDULE,
            SupervisorPermission.MANAGE_LABOUR_EXPENSES,
            SupervisorPermission.CROP_DOCTOR_CHAT,
            SupervisorPermission.MANAGE_HARVEST_SALES,
          ],
          deletedAt: null,
        },
        select: SAFE_USER_SELECT,
      });

      return { supervisor: updated, tempPassword: '(Existing Account Linked)' };
    }

    if (process.env.NODE_ENV === 'production' && !dto.firebaseIdToken) {
      throw new BadRequestException('Firebase ID Token is required.');
    }

    if (dto.firebaseIdToken) {
      try {
        const decoded = await getAuth().verifyIdToken(dto.firebaseIdToken);
        const fbPhone = decoded.phone_number;
        if (!fbPhone) throw new UnauthorizedException('No phone attached to Firebase credential.');
        const cleanFbMobile = fbPhone.replace(/\D/g, '').slice(-10);
        const cleanDtoMobile = dto.mobile.replace(/\D/g, '').slice(-10);
        if (cleanFbMobile !== cleanDtoMobile) {
          throw new UnauthorizedException('Verified phone number does not match requested mobile.');
        }
      } catch (err: any) {
        throw new UnauthorizedException('Invalid Firebase ID Token: ' + err.message);
      }
    }

    const initialPassword = dto.password?.trim() || generateTempPassword();
    const passwordHash = await argon2.hash(initialPassword);
    const kingId = await generateUniqueKingId(this.prisma);

    const supervisor = await this.prisma.user.create({
      data: {
        kingId,
        mobile: dto.mobile,
        passwordHash,
        name: dto.name,
        role: Role.SUPERVISOR,
        roles: [Role.SUPERVISOR, Role.CUSTOMER],
        employerFarmerId: farmer.id,
        supervisorPermissions: dto.permissions ?? [
          SupervisorPermission.MANAGE_SPRAY_SCHEDULE,
          SupervisorPermission.MANAGE_LABOUR_EXPENSES,
          SupervisorPermission.CROP_DOCTOR_CHAT,
          SupervisorPermission.MANAGE_HARVEST_SALES,
        ],
      },
      select: SAFE_USER_SELECT,
    });

    return { supervisor, tempPassword: initialPassword };
  }

  /** Farmer appoints a supervisor by King ID with specific features & permissions (View & Entry) */
  async appointSupervisorRequest(farmer: AuthUser, dto: AppointSupervisorRequestDto) {
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
      throw new NotFoundException('Candidate not found matching King ID / Mobile number.');
    }

    if (target.id === farmer.id) {
      throw new BadRequestException('You cannot appoint yourself as your own supervisor.');
    }

    const activeTargetRoles = getActiveRolesList(target);
    const incompatibleTargetRoles = activeTargetRoles.filter(
      (r) => r !== Role.SUPERVISOR && r !== Role.CUSTOMER,
    );
    if (incompatibleTargetRoles.length > 0) {
      throw new ConflictException(
        `This account already holds an active role (${incompatibleTargetRoles.join(', ')}). Supervisors must use a dedicated mobile number without Farmer, Gardener, Labour, Agent, Seller, Advisor, Trader, or Staff roles.`,
      );
    }

    // Domain Rule: 1 supervisor can only work for 1 farmer at a time
    if (target.employerFarmerId && target.employerFarmerId !== farmer.id) {
      const currentEmployer = await this.prisma.user.findUnique({
        where: { id: target.employerFarmerId },
        select: { name: true, kingId: true },
      });
      throw new ConflictException(
        `This supervisor is currently actively working under farmer "${currentEmployer?.name || 'Another Farmer'}" (${currentEmployer?.kingId || ''}). A supervisor cannot work for 2 farmers at the same time. They must resign from their current employer first.`,
      );
    }

    const cfgJson = JSON.stringify(dto.featuresConfig || {});

    // Check if an existing pending request exists
    const existingRows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM "supervisor_requests" WHERE "farmerId" = $1 AND "supervisorId" = $2 AND "status" = 'PENDING' LIMIT 1`,
      farmer.id,
      target.id,
    );

    let requestId: string;
    if (existingRows && existingRows.length > 0) {
      requestId = existingRows[0].id;
      await this.prisma.$executeRawUnsafe(
        `UPDATE "supervisor_requests" SET "featuresConfig" = $1::jsonb, "note" = $2, "updatedAt" = NOW() WHERE "id" = $3`,
        cfgJson,
        dto.note || null,
        requestId,
      );
    } else {
      requestId = `sr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "supervisor_requests" ("id", "farmerId", "supervisorId", "status", "featuresConfig", "note", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, 'PENDING', $4::jsonb, $5, NOW(), NOW())`,
        requestId,
        farmer.id,
        target.id,
        cfgJson,
        dto.note || null,
      );
    }

    // In-app notification to the supervisor candidate
    try {
      await this.notificationsService.create(
        target.id,
        NotificationType.SYSTEM,
        '🚜 Farm Supervisor Appointment Request',
        `Farmer ${farmer.name} (${farmer.kingId || ''}) has sent you an appointment request to manage their farm operations. Tap to view allowed features and accept or reject.`,
        { requestId, farmerId: farmer.id },
      );
    } catch (err: any) {
      // Non-blocking notification
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

  /** Gets incoming requests for candidate/supervisor, or outgoing requests for farmer */
  async getSupervisorRequests(user: AuthUser) {
    try {
      const incoming: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT sr.id, sr."farmerId", sr."supervisorId", sr.status, sr."featuresConfig", sr.note, sr."createdAt",
                f.name as "farmerName", f."kingId" as "farmerKingId", f.mobile as "farmerMobile", f.village as "farmerVillage", f."farmName"
         FROM "supervisor_requests" sr
         JOIN "users" f ON f.id = sr."farmerId"
         WHERE sr."supervisorId" = $1 AND sr.status = 'PENDING'
         ORDER BY sr."createdAt" DESC`,
        user.id,
      );

      const outgoing: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT sr.id, sr."farmerId", sr."supervisorId", sr.status, sr."featuresConfig", sr.note, sr."createdAt", sr."respondedAt",
                s.name as "supervisorName", s."kingId" as "supervisorKingId", s.mobile as "supervisorMobile"
         FROM "supervisor_requests" sr
         JOIN "users" s ON s.id = sr."supervisorId"
         WHERE sr."farmerId" = $1
         ORDER BY sr."createdAt" DESC`,
        user.id,
      );

      const parseRows = (rows: any[]) =>
        rows.map((r) => ({
          ...r,
          featuresConfig: typeof r.featuresConfig === 'string' ? JSON.parse(r.featuresConfig) : (r.featuresConfig || {}),
        }));

      return {
        incoming: parseRows(incoming),
        outgoing: parseRows(outgoing),
      };
    } catch {
      return { incoming: [], outgoing: [] };
    }
  }

  /** Candidate supervisor accepts or rejects appointment request — zero Admin intervention */
  async respondToSupervisorRequest(user: AuthUser, requestId: string, dto: RespondSupervisorRequestDto) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM "supervisor_requests" WHERE "id" = $1 AND "supervisorId" = $2 LIMIT 1`,
      requestId,
      user.id,
    );

    if (!rows || rows.length === 0) {
      throw new NotFoundException('Appointment request not found.');
    }

    const request = rows[0];
    if (request.status !== 'PENDING') {
      throw new BadRequestException(`This request has already been ${request.status.toLowerCase()}.`);
    }

    if (dto.action === 'REJECT') {
      await this.prisma.$executeRawUnsafe(
        `UPDATE "supervisor_requests" SET "status" = 'REJECTED', "respondedAt" = NOW(), "updatedAt" = NOW() WHERE "id" = $1`,
        requestId,
      );

      try {
        await this.notificationsService.create(
          request.farmerId,
          NotificationType.SYSTEM,
          'Supervisor Request Declined',
          `${user.name} declined your farm supervisor appointment request.`,
        );
      } catch {}

      return { success: true, status: 'REJECTED', message: 'You have declined this supervisor request.' };
    }

    // Action: ACCEPT
    const currentUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (currentUser) {
      const activeExisting = getActiveRolesList(currentUser);
      const incompatible = activeExisting.filter(
        (r) => r !== Role.SUPERVISOR && r !== Role.CUSTOMER,
      );
      if (incompatible.length > 0) {
        throw new ConflictException(
          `Your account already holds active role (${incompatible.join(', ')}). Only a dedicated mobile account without Farmer, Gardener, Labour, Agent, Seller, Advisor, Trader, or Staff roles can accept a Farm Supervisor appointment.`,
        );
      }
    }
    if (currentUser?.employerFarmerId && currentUser.employerFarmerId !== request.farmerId) {
      const employer = await this.prisma.user.findUnique({ where: { id: currentUser.employerFarmerId }, select: { name: true, kingId: true } });
      throw new ConflictException(
        `You are currently actively assigned to farmer "${employer?.name || 'Another Farmer'}" (${employer?.kingId || ''}). Please resign from that farmer before accepting a new appointment.`,
      );
    }

    const cfg = typeof request.featuresConfig === 'string' ? JSON.parse(request.featuresConfig) : (request.featuresConfig || {});
    const permissions: SupervisorPermission[] = [];
    if (cfg.spray?.view || cfg.spray?.entry) permissions.push(SupervisorPermission.MANAGE_SPRAY_SCHEDULE);
    if (cfg.labour?.view || cfg.labour?.entry) permissions.push(SupervisorPermission.MANAGE_LABOUR_EXPENSES);
    if (cfg.advisory?.view || cfg.advisory?.entry) permissions.push(SupervisorPermission.CROP_DOCTOR_CHAT);
    if (cfg.sales?.view || cfg.sales?.entry) permissions.push(SupervisorPermission.MANAGE_HARVEST_SALES);

    await this.prisma.$executeRawUnsafe(
      `UPDATE "supervisor_requests" SET "status" = 'ACCEPTED', "respondedAt" = NOW(), "updatedAt" = NOW() WHERE "id" = $1`,
      requestId,
    );

    // Cancel or decline any other pending requests for this supervisor since they can only work for 1 farmer
    await this.prisma.$executeRawUnsafe(
      `UPDATE "supervisor_requests" SET "status" = 'CANCELLED', "updatedAt" = NOW() WHERE "supervisorId" = $1 AND "status" = 'PENDING'`,
      user.id,
    );

    const updatedRoles = Array.from(new Set([...(currentUser?.roles ?? []), Role.SUPERVISOR]));

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        employerFarmerId: request.farmerId,
        role: Role.SUPERVISOR,
        roles: updatedRoles,
        supervisorPermissions: permissions,
        deletedAt: null,
      },
    });

    await this.prisma.$executeRawUnsafe(
      `UPDATE "users" SET "supervisorFeaturesConfig" = $1::jsonb WHERE "id" = $2`,
      JSON.stringify(cfg),
      user.id,
    );

    const farmer = await this.prisma.user.findUnique({
      where: { id: request.farmerId },
      select: { id: true, name: true, kingId: true, mobile: true, farmName: true, village: true },
    });

    try {
      await this.notificationsService.create(
        request.farmerId,
        NotificationType.SYSTEM,
        '🎉 Supervisor Appointed!',
        `${user.name} accepted your request and is now your active Farm Supervisor.`,
        { supervisorId: user.id },
      );
    } catch {}

    return {
      success: true,
      status: 'ACCEPTED',
      message: `You are now the Farm Supervisor for ${farmer?.name || 'the farmer'}!`,
      employerFarmer: farmer,
      featuresConfig: cfg,
    };
  }

  /** Supervisor gets their active employer farmer and allowed features */
  async getActiveSupervisorAssignment(user: AuthUser) {
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
      const rows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT "supervisorFeaturesConfig" FROM "users" WHERE "id" = $1 LIMIT 1`,
        user.id,
      );
      if (rows && rows.length > 0 && rows[0].supervisorFeaturesConfig) {
        cfg = typeof rows[0].supervisorFeaturesConfig === 'string'
          ? JSON.parse(rows[0].supervisorFeaturesConfig)
          : rows[0].supervisorFeaturesConfig;
      }
    } catch {}

    return {
      isAssigned: true,
      employerFarmer: dbUser.employerFarmer,
      supervisorPermissions: dbUser.supervisorPermissions,
      featuresConfig: cfg,
    };
  }

  /** Farmer updates features (View & Entry) for an active supervisor */
  async updateSupervisorFeaturesConfig(farmer: AuthUser, supervisorId: string, featuresConfig: any) {
    const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
    if (!supervisor || supervisor.employerFarmerId !== farmer.id) {
      throw new NotFoundException('Supervisor not found under your account.');
    }

    const cfg = featuresConfig || {};
    const permissions: SupervisorPermission[] = [];
    if (cfg.spray?.view || cfg.spray?.entry) permissions.push(SupervisorPermission.MANAGE_SPRAY_SCHEDULE);
    if (cfg.labour?.view || cfg.labour?.entry) permissions.push(SupervisorPermission.MANAGE_LABOUR_EXPENSES);
    if (cfg.advisory?.view || cfg.advisory?.entry) permissions.push(SupervisorPermission.CROP_DOCTOR_CHAT);
    if (cfg.sales?.view || cfg.sales?.entry) permissions.push(SupervisorPermission.MANAGE_HARVEST_SALES);

    await this.prisma.user.update({
      where: { id: supervisorId },
      data: { supervisorPermissions: permissions },
    });

    await this.prisma.$executeRawUnsafe(
      `UPDATE "users" SET "supervisorFeaturesConfig" = $1::jsonb WHERE "id" = $2`,
      JSON.stringify(cfg),
      supervisorId,
    );

    return {
      success: true,
      message: 'Supervisor permissions and features updated successfully.',
      supervisorId,
      featuresConfig: cfg,
    };
  }

  async getMySupervisors(farmer: AuthUser) {
    const list = await this.prisma.user.findMany({
      where: { employerFarmerId: farmer.id, deletedAt: null },
      select: SAFE_USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });

    if (list.length === 0) return [];

    try {
      const ids = list.map((u) => u.id);
      const configs: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT id, "supervisorFeaturesConfig" FROM "users" WHERE id = ANY($1::text[])`,
        ids,
      );
      const configMap = new Map<string, any>();
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
    } catch {
      return list;
    }
  }

  async updateSupervisorPermissions(farmer: AuthUser, supervisorId: string, permissions: SupervisorPermission[]) {
    const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
    if (!supervisor || supervisor.employerFarmerId !== farmer.id) {
      throw new NotFoundException('Supervisor not found under your account.');
    }

    return this.prisma.user.update({
      where: { id: supervisorId },
      data: { supervisorPermissions: permissions },
      select: SAFE_USER_SELECT,
    });
  }

  /**
   * Resigns/releases a supervisor from their current employer farmer so they can join another farmer.
   * Account and King ID are preserved.
   */
  async resignSupervisor(actor: AuthUser, supervisorId: string) {
    const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
    if (!supervisor) {
      throw new NotFoundException('Supervisor not found.');
    }
    const isOwnerFarmer = supervisor.employerFarmerId === actor.id;
    const isSelf = supervisor.id === actor.id;
    const isAdmin = actor.role === Role.SUPER_ADMIN || actor.role === Role.ADMIN;

    if (!isOwnerFarmer && !isSelf && !isAdmin) {
      throw new ForbiddenException('Only the employer farmer, the supervisor themselves, or Admin can resign this supervisor.');
    }

    const updated = await this.prisma.user.update({
      where: { id: supervisorId },
      data: {
        employerFarmerId: null,
      },
      select: SAFE_USER_SELECT,
    });

    try {
      await this.prisma.$executeRawUnsafe(
        `UPDATE "users" SET "supervisorFeaturesConfig" = '{}'::jsonb WHERE "id" = $1`,
        supervisorId,
      );
      await this.prisma.$executeRawUnsafe(
        `UPDATE "supervisor_requests" SET "status" = 'RESIGNED', "updatedAt" = NOW() WHERE "supervisorId" = $1 AND "status" = 'ACCEPTED'`,
        supervisorId,
      );
    } catch {}

    return {
      success: true,
      message: `Supervisor ${supervisor.name} has resigned / been released. They can now join another farmer if appointed.`,
      supervisor: updated,
    };
  }

  /** Admin/Super Admin: Assigns or unassigns a supervisor to an employer farmer */
  async assignSupervisorEmployer(caller: AuthUser, supervisorId: string, employerFarmerId: string | null) {
    const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
    if (!supervisor) {
      throw new NotFoundException('Supervisor not found.');
    }
    if (caller.role !== Role.SUPER_ADMIN && caller.role !== Role.ADMIN) {
      throw new ForbiddenException('Only an Admin or Super Admin can assign a supervisor to an employer.');
    }

    if (employerFarmerId) {
      const employerFarmer = await this.prisma.user.findUnique({ where: { id: employerFarmerId } });
      if (!employerFarmer) {
        throw new NotFoundException('Target employer farmer not found.');
      }
    }

    const updatedRoles = Array.from(new Set([...(supervisor.roles ?? []), Role.SUPERVISOR]));

    const updated = await this.prisma.user.update({
      where: { id: supervisorId },
      data: {
        employerFarmerId,
        role: Role.SUPERVISOR,
        roles: updatedRoles,
      },
      select: SAFE_USER_SELECT,
    });

    return updated;
  }

  async deleteSupervisor(farmer: AuthUser, supervisorId: string) {
    const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
    if (!supervisor || supervisor.employerFarmerId !== farmer.id) {
      throw new NotFoundException('Supervisor not found under your account.');
    }

    // Unlink employer so they are free, and soft delete only if farmer specifically removes
    await this.prisma.user.update({
      where: { id: supervisorId },
      data: { employerFarmerId: null },
    });

    return { success: true, message: 'Supervisor resigned / unlinked successfully.' };
  }

  private async findActiveOrThrow(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  /** Resolves a user's FarmsKing ID or Mobile Number to their account — used for appointing trainers, coupons, and wallet payouts. */
  async lookupByKingId(query: string) {
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
      throw new NotFoundException('No user found matching that King ID or Mobile number.');
    }

    let currentEmployerName: string | null = null;
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

  /**
   * The Super Admin is the platform "owner" and can edit anyone. An Admin is a "manager" — they can
   * manage every operational role, but never another Admin or the Super Admin.
   */
  private assertCanManageTarget(caller: AuthUser, target: { role: Role; roles?: Role[]; deactivatedRoles?: Role[] }) {
    const targetIsTierRestricted =
      target.role === Role.ADMIN ||
      target.role === Role.SUPER_ADMIN ||
      (target.roles ?? []).includes(Role.ADMIN) ||
      (target.roles ?? []).includes(Role.SUPER_ADMIN);
    const callerIsSuperAdmin =
      caller.role === Role.SUPER_ADMIN ||
      ((caller.roles ?? []).includes(Role.SUPER_ADMIN) && !(caller.deactivatedRoles ?? []).includes(Role.SUPER_ADMIN));
    if (!callerIsSuperAdmin && targetIsTierRestricted) {
      throw new ForbiddenException('Only the Super Admin can manage Admin or Super Admin accounts.');
    }
  }

  async updateRole(caller: AuthUser, id: string, role: Role) {
    const user = await this.findActiveOrThrow(id);
    this.assertCanManageTarget(caller, user);
    if (user.deletedAt) {
      throw new ConflictException('Cannot change the role of a deactivated user.');
    }
    if (ADMIN_STAFF_ROLES.some((r) => user.role === r || (user.roles ?? []).includes(r))) {
      throw new ConflictException("An Admin Panel staff member's roles are single-role only and cannot be changed here.");
    }
    if (ADMIN_STAFF_ROLES.includes(role)) {
      throw new ConflictException('Admin Panel staff roles cannot be assigned via this endpoint.');
    }

    const activeAfterUpdate = Array.from(new Set([...getActiveRolesList(user), role, Role.CUSTOMER]));
    assertRoleCombinationAllowed(activeAfterUpdate);

    const isNewAdvisor = role === Role.ADVISOR && !user.roles.includes(Role.ADVISOR);
    const newDeactivatedRoles = (user.deactivatedRoles ?? []).filter((r) => r !== role);
    const targetRoles = Array.from(new Set([...user.roles, role, Role.CUSTOMER]));
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
    if (role === Role.AGENT && !user.roles.includes(Role.AGENT)) {
      await provisionPartnerReferralCoupon(this.prisma, id, caller.id);
    }

    // 📲 WhatsApp Group: add if assigned FARMER or ADVISOR role, remove if non-eligible
    const eligibleRoles: Role[] = [Role.FARMER, Role.ADVISOR];
    const hasRemainingEligible =
      eligibleRoles.includes(role) ||
      (user.roles ?? [])
        .filter((r) => !(user.deactivatedRoles ?? []).includes(r))
        .some((r) => eligibleRoles.includes(r));

    if (eligibleRoles.includes(role)) {
      this.whatsappGroupSyncService.autoAddNewUser(
        id,
        user.mobile ?? '',
        user.name ?? 'User',
      ).catch(() => {});
    } else if (!hasRemainingEligible) {
      this.whatsappGroupSyncService.autoRemoveUser(
        id,
        user.mobile ?? '',
        user.name ?? 'User',
      ).catch(() => {});
    }

    return updated;
  }

  /**
   * Checkbox-driven multi-role assignment for a user's account: `activeRoles` is the full desired
   * set of active roles. Anything newly checked is granted; anything unchecked that was previously
   * active gets deactivated — moved into `deactivatedRoles`, never removed from `roles` itself.
   * If the user's current primary `role` gets deactivated, the primary falls back to another still-
   * active role (or CUSTOMER). CUSTOMER itself can never be deactivated — it's the baseline role
   * every partner/client account keeps for life. Granting FARMER or GARDENER here also provisions
   * their FREE FarmerPlan/GardenerPlan record, same as the self-serve becomeFarmer/becomeGardener flow.
   */
  async updateActiveRoles(caller: AuthUser, id: string, activeRoles: Role[]) {
    const user = await this.findActiveOrThrow(id);
    this.assertCanManageTarget(caller, user);
    if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
      throw new ConflictException("An admin's roles cannot be changed here.");
    }
    const isStaff = ADMIN_STAFF_ROLES.some(
      (r) => user.role === r || (user.roles ?? []).includes(r),
    );
    if (isStaff) {
      throw new ConflictException(
        'Admin Panel staff accounts (Super Admin, Admin, Manager, Operator, Technical Trainer) are single-role only and cannot be combined or edited here.',
      );
    }
    if (activeRoles.some((r) => ADMIN_STAFF_ROLES.includes(r))) {
      throw new ConflictException(
        'Admin Panel staff roles cannot be assigned here. Use Staff Management for dedicated single-role staff accounts.',
      );
    }
    if (!activeRoles.includes(Role.CUSTOMER)) {
      activeRoles = [...activeRoles, Role.CUSTOMER];
    }
    assertRoleCombinationAllowed(activeRoles);

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

    // If primary role was deactivated, removed from active set, or was just CUSTOMER while operational roles exist -> pick clean primary
    let newPrimary: Role = user.role;
    if (
      toDeactivate.includes(user.role) ||
      !activeRoles.includes(user.role) ||
      user.role === Role.CUSTOMER
    ) {
      newPrimary = pickBestPrimaryRole(activeRoles);
      if (!newRoles.includes(newPrimary)) newRoles.push(newPrimary);
    }

    const isBrandNewAdvisor = toGrant.includes(Role.ADVISOR);
    const deactivatingSupervisor = toDeactivate.includes(Role.SUPERVISOR);
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
    if (toGrant.includes(Role.AGENT) || toReactivate.includes(Role.AGENT)) {
      await provisionPartnerReferralCoupon(this.prisma, id, caller.id);
    }
    if (toGrant.includes(Role.FARMER) || toReactivate.includes(Role.FARMER)) {
      await this.prisma.farmerPlan.upsert({ where: { farmerId: id }, create: { farmerId: id }, update: {} });
    }
    if (toGrant.includes(Role.GARDENER) || toReactivate.includes(Role.GARDENER)) {
      await this.prisma.gardenerPlan.upsert({ where: { gardenerId: id }, create: { gardenerId: id }, update: {} });
    }

    // 📲 WhatsApp Group: instant add when FARMER/ADVISOR is granted or reactivated
    const eligibleRoles: Role[] = [Role.FARMER, Role.ADVISOR];
    const gettingEligible = [...toGrant, ...toReactivate].some((r) => eligibleRoles.includes(r));
    const losingEligible = toDeactivate.some((r) => eligibleRoles.includes(r));

    if (gettingEligible) {
      this.whatsappGroupSyncService.autoAddNewUser(
        id,
        user.mobile ?? '',
        user.name ?? 'User',
      ).catch(() => {});
    } else if (losingEligible) {
      // Only remove from group if user has NO remaining eligible role
      const remainingEligible = newRoles
        .filter((r) => !newDeactivated.includes(r))
        .some((r) => eligibleRoles.includes(r));
      if (!remainingEligible) {
        this.whatsappGroupSyncService.autoRemoveUser(
          id,
          user.mobile ?? '',
          user.name ?? 'User',
        ).catch(() => {});
      }
    }

    return updated;
  }

  /** Super Admin/Admin: one aggregated view of everything about a user — farms, wallet, coupons redeemed, orders placed. */
  async getDetail(caller: AuthUser, id: string) {
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

  /** Super Admin/Admin: edit any field on a user's profile — shared fields plus whichever role-specific ones apply. */
  async adminUpdateUser(caller: AuthUser, id: string, dto: AdminUpdateUserDto) {
    const user = await this.findActiveOrThrow(id);
    this.assertCanManageTarget(caller, user);

    if (dto.mobile && dto.mobile !== user.mobile) {
      const existing = await this.prisma.user.findUnique({ where: { mobile: dto.mobile } });
      if (existing) {
        throw new ConflictException('Another account already uses this mobile number.');
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

    // 🔔 Instant WhatsApp Group add/remove based on switch toggle
    if (dto.whatsappGroupEnabled === true) {
      // User turned group switch ON → add them to group immediately
      this.whatsappGroupSyncService.autoAddNewUser(
        id,
        updatedUser.mobile ?? '',
        (updatedUser as any).name ?? 'User',
      ).catch(() => {});
    } else if (dto.whatsappGroupEnabled === false) {
      // User turned group switch OFF → remove them from group immediately
      this.whatsappGroupSyncService.autoRemoveUser(
        id,
        updatedUser.mobile ?? '',
        (updatedUser as any).name ?? 'User',
      ).catch(() => {});
    }

    return updatedUser;
  }

  /** Admin/Super Admin: set a new password for a user. The old password is a one-way hash and can never be shown —
   * this replaces it outright. Leaves `newPassword` unset to auto-generate a temp password (returned once). */
  async resetPassword(caller: AuthUser, id: string, newPassword?: string) {
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

  async deactivate(caller: AuthUser, id: string) {
    const user = await this.findActiveOrThrow(id);
    this.assertCanManageTarget(caller, user);
    if (caller.role !== Role.SUPER_ADMIN && (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN)) {
      throw new ConflictException('An admin account cannot be deactivated.');
    }
    if (user.deletedAt) {
      throw new ConflictException('User is already deactivated.');
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

    // 📲 WhatsApp Group: remove deactivated user from group
    this.whatsappGroupSyncService.autoRemoveUser(id, user.mobile ?? '', user.name ?? 'User').catch(() => {});

    return updated;
  }

  async reactivate(caller: AuthUser, id: string) {
    const user = await this.findActiveOrThrow(id);
    this.assertCanManageTarget(caller, user);
    if (!user.deletedAt) {
      throw new ConflictException('User is already active.');
    }
    if (user.passwordHash === 'ACCOUNT_DELETED_PERMANENTLY') {
      throw new ConflictException('Permanently deleted user accounts cannot be reactivated.');
    }

    const restoredMobile = user.mobile.replace(/^DEL_/, '').replace(/_del_\d+$/, '');
    const restoredEmail = user.email ? user.email.replace(/_del_\d+$/, '') : null;
    const restoredKingId = user.kingId ? user.kingId.replace(/_del_\d+$/, '') : undefined;

    const existing = await this.prisma.user.findFirst({
      where: { mobile: restoredMobile, deletedAt: null, id: { not: id } },
    });
    if (existing) {
      throw new ConflictException(`Cannot reactivate: Mobile ${restoredMobile} is already in use by another active account.`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
        mobile: restoredMobile,
        email: restoredEmail,
        ...(restoredKingId ? { kingId: restoredKingId } : {}),
      },
      select: SAFE_USER_SELECT,
    });

    // 📲 WhatsApp Group: re-add if user holds FARMER or ADVISOR role
    const eligibleRoles: Role[] = [Role.FARMER, Role.ADVISOR];
    const isEligible =
      eligibleRoles.includes(user.role) ||
      (user.roles ?? [])
        .filter((r) => !(user.deactivatedRoles ?? []).includes(r))
        .some((r) => eligibleRoles.includes(r));

    if (isEligible) {
      this.whatsappGroupSyncService.autoAddNewUser(id, updated.mobile ?? '', updated.name ?? 'User').catch(() => {});
    }

    return updated;
  }

  /** Grants an Operator account read-only access to specific fixed areas — orders, coupons, users, wallets, farmer plans. */
  async updateOperatorPermissions(id: string, permissions: OperatorPermission[]) {
    const user = await this.findActiveOrThrow(id);
    if (user.role !== Role.OPERATOR) {
      throw new ConflictException('Only Operator accounts have grantable permissions.');
    }

    return this.prisma.user.update({
      where: { id },
      data: { operatorPermissions: permissions },
      select: SAFE_USER_SELECT,
    });
  }

  /**
   * Every role's self-service update for the shared profile fields (name, email, photo, address/PIN).
   * There is exactly one profile per mobile number regardless of how many roles it holds, so this is
   * the single write path for those fields — role-specific endpoints (farmer tank/soil/water, advisor
   * specialization/bio) only ever touch fields on top of this.
   */
  async updateMyAddress(user: AuthUser, dto: UpdateMyAddressDto) {
    let newPasswordHash: string | undefined = undefined;
    if (dto.password && dto.password.trim().length >= 4) {
      newPasswordHash = await argon2.hash(dto.password.trim());
    }

    let cleanMobile: string | undefined = undefined;
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
          throw new ConflictException('An account with this mobile number already exists.');
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
      this.whatsappGroupSyncService.autoAddNewUser(user.id, updated.mobile ?? '', updated.name ?? 'User').catch(() => {});
    } else if (dto.whatsappGroupEnabled === false) {
      this.whatsappGroupSyncService.autoRemoveUser(user.id, updated.mobile ?? '', updated.name ?? 'User').catch(() => {});
    }

    return updated;
  }

  /** Farmer self-service: fills in the onboarding fields an advisor needs (photo, tank size, soil/water type). */
  async updateFarmerProfile(user: AuthUser, dto: UpdateFarmerProfileDto) {
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
      this.whatsappGroupSyncService.autoAddNewUser(user.id, updated.mobile ?? '', updated.name ?? 'User').catch(() => {});
    } else if (dto.whatsappGroupEnabled === false) {
      this.whatsappGroupSyncService.autoRemoveUser(user.id, updated.mobile ?? '', updated.name ?? 'User').catch(() => {});
    }

    return updated;
  }

  /** Whether the farmer has filled all four advisor-onboarding fields yet. */
  async getFarmerProfileStatus(user: AuthUser) {
    const farmer = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { photoUrl: true, sprayTankSizeL: true, soilType: true, waterType: true },
    });
    if (!farmer) {
      throw new NotFoundException('User not found.');
    }

    const missingFields = (
      [
        ['photoUrl', farmer.photoUrl],
        ['sprayTankSizeL', farmer.sprayTankSizeL],
        ['soilType', farmer.soilType],
        ['waterType', farmer.waterType],
      ] as const
    )
      .filter(([, value]) => value === null || value === undefined)
      .map(([field]) => field);

    return { profileComplete: missingFields.length === 0, missingFields, profile: farmer };
  }

  /** Advisor self-service: photo, specialization/bio/experience, qualification/title, payout details, and contact details. */
  async updateAdvisorProfile(user: AuthUser, dto: UpdateAdvisorProfileDto) {
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

  /** Whether the advisor has filled in their display profile + payout details required for their wallet to be withdrawable. */
  async getAdvisorProfileStatus(user: AuthUser) {
    const advisor = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: Object.fromEntries(ADVISOR_PROFILE_FIELDS.map((f) => [f, true])) as Record<
        (typeof ADVISOR_PROFILE_FIELDS)[number],
        true
      >,
    });
    if (!advisor) {
      throw new NotFoundException('User not found.');
    }
    return { ...getAdvisorPayoutProfileStatus(advisor), profile: advisor };
  }

  /** Agent self-service: payout details (UPI, bank account, PAN, alternative mobile, email). */
  async updatePartnerProfile(user: AuthUser, dto: UpdatePartnerProfileDto) {
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

  /** Whether the Agent has filled in every payout field required for their wallet to be withdrawable. */
  async getPartnerProfileStatus(user: AuthUser) {
    const partner = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: Object.fromEntries(BUSINESS_PARTNER_PROFILE_FIELDS.map((f) => [f, true])) as Record<
        (typeof BUSINESS_PARTNER_PROFILE_FIELDS)[number],
        true
      >,
    });
    if (!partner) {
      throw new NotFoundException('User not found.');
    }
    return { ...computePartnerProfileStatus(partner), profile: partner };
  }

  /** Super Admin: anonymizes & soft-deletes a user account. KingID and all linked historical records
   *  (orders, bills, workers, wallet transactions) are retained for audit. Only PII is scrubbed.
   *  Mobile/Email get a DEL_ prefix so login is permanently blocked. Hard removal from DB is NOT done. */
  async deleteUserByAdmin(caller: AuthUser, id: string, adminConfirmationOtp?: string) {
    if (caller.role !== Role.SUPER_ADMIN && !caller.roles?.includes(Role.SUPER_ADMIN)) {
      throw new ForbiddenException('Only Super Admin can delete user records.');
    }
    if (caller.id === id) {
      throw new ConflictException('Super Admin cannot delete their own account.');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User record not found.');
    }
    if (user.mobile === '9872066901') {
      throw new ConflictException('Primary Super Admin account 9872066901 cannot be deleted.');
    }
    if (!user.deletedAt) {
      throw new BadRequestException('User must be soft-deleted (deactivated) before this operation. Please deactivate the user first.');
    }
    if (this.appSettingsService) {
      this.appSettingsService.verifyAdminActionOtp(caller.id, adminConfirmationOtp);
    }

    // Soft-delete — same policy as self-service deleteMe:
    // KingID stays intact so all linked historical records (bills, orders, salary,
    // workers, wallet transactions) remain fully traceable for audit.
    // Mobile & Email get a DEL_ prefix — login is permanently blocked.
    const ts = Date.now();
    const delMobile = user.mobile ? `DEL_${user.mobile}_${ts}` : `DEL_UNKNOWN_${id}_${ts}`;
    const delEmail  = user.email  ? `DEL_${user.email}_${ts}`  : null;

    await this.prisma.user.update({
      where: { id },
      data: {
        name: 'Deleted Account',
        mobile: delMobile,
        email: delEmail,
        // kingId → intentionally unchanged
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

    // 📲 WhatsApp Group: remove deleted user from WhatsApp group if present
    this.whatsappGroupSyncService.autoRemoveUser(id, user.mobile ?? '', user.name ?? 'User').catch(() => {});

    return {
      success: true,
      message: `Account for ${user.name} (${user.kingId ?? user.mobile}) has been anonymized. King ID and all linked historical records are retained for audit. Personal information permanently removed.`,
    };
  }

  /** Admin: Assign Staff Role & Staff ID to user, requiring profile completion & approval */
  async assignStaffRole(caller: AuthUser, dto: { userId: string; role: Role; staffId?: string; advisorType?: 'FARM' | 'GARDEN' }) {
    const user = await this.findActiveOrThrow(dto.userId);
    this.assertCanManageTarget(caller, user);

    const callerIsSuperAdmin =
      caller.role === Role.SUPER_ADMIN ||
      ((caller.roles ?? []).includes(Role.SUPER_ADMIN) && !(caller.deactivatedRoles ?? []).includes(Role.SUPER_ADMIN));
    if (!callerIsSuperAdmin && (dto.role === Role.SUPER_ADMIN || dto.role === Role.ADMIN)) {
      throw new ForbiddenException('Only the Super Admin can assign Admin or Super Admin roles.');
    }

    const activeExisting = getActiveRolesList(user);
    let nextRoles: Role[];
    const nextDeactivated = (user.deactivatedRoles ?? []).filter((r) => r !== dto.role);

    if (ADMIN_STAFF_ROLES.includes(dto.role)) {
      const conflicting = activeExisting.filter((r) => r !== dto.role && r !== Role.CUSTOMER);
      if (conflicting.length > 0) {
        throw new ConflictException(
          `Admin Panel Staff accounts (${dto.role}) must be single-role only and cannot be assigned to an account with active roles (${conflicting.join(', ')}). Create a dedicated staff account instead.`,
        );
      }
      nextRoles = [dto.role];
    } else {
      const candidateActive = Array.from(new Set([...activeExisting, dto.role, Role.CUSTOMER]));
      assertRoleCombinationAllowed(candidateActive);
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

  /** Staff / Expert: Submit full profile completion for Admin verification */
  async submitProfileCompletion(currentUser: AuthUser, data: {
    qualification?: string;
    profileTitle?: string;
    specialization?: string;
    yearsExperience?: number;
    bio?: string;
    photoUrl?: string;
    upiId?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
    bankAccountHolderName?: string;
    panNumber?: string;
    aadhaarLast4?: string;
    aadhaarDocUrl?: string;
    panDocUrl?: string;
    termsAccepted?: boolean;
    alternativeMobile?: string;
    billPrintingAddress?: string;
  }) {
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

  /** Admin: List all pending staff/expert profile submissions */
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

  /** Admin: Approve staff/expert profile */
  async approveProfile(caller: AuthUser, userId: string) {
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

  /** Admin: Reject staff/expert profile */
  async rejectProfile(caller: AuthUser, userId: string, reason: string) {
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

  /** Admin: List Partner self-signup applications with KYC & linked King ID summary */
  async listPartnerApplications(status?: string) {
    const cleanStatus = status?.toUpperCase();
    const where: any =
      cleanStatus && ['PENDING', 'APPROVED', 'REJECTED'].includes(cleanStatus)
        ? { status: cleanStatus as PartnerApplicationStatus }
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

  /**
   * Admin: Approve a Partner Self-Signup application (requires Step-Up 2FA OTP).
   * - If mobile is already registered as Farmer/Gardener/Customer/Trader, keeps exact SAME King ID
   *   and merges the approved Partner role + KYC/documents onto the existing account.
   * - If mobile is new, provisions a brand new User with unique 8-digit King ID + welcome bonus.
   * - Provisions Partner referral coupon (for AGENT) or verified SellerStore (for SELLER).
   */
  async approvePartnerApplication(caller: AuthUser, applicationId: string, adminConfirmationOtp?: string) {
    if (this.appSettingsService) {
      this.appSettingsService.verifyAdminActionOtp(caller.id, adminConfirmationOtp);
    }

    const existingApp = await this.prisma.partnerApplication.findUnique({
      where: { id: applicationId },
    });
    if (!existingApp) {
      throw new NotFoundException('Partner application not found.');
    }
    if (existingApp.status === PartnerApplicationStatus.APPROVED) {
      throw new ConflictException('This Partner application has already been approved.');
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
        const activeRoles = getActiveRolesList(existingUser);
        assertRoleCombinationAllowed([...activeRoles, existingApp.requestedRole]);
      }

      // Check email conflict before applying
      let safeEmailToAssign: string | undefined;
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
        ...(existingApp.requestedRole === Role.ADVISOR && existingApp.advisorType
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

      let targetUser: any;
      if (existingUser) {
        const nextRoles = Array.from(
          new Set([existingUser.role, ...(existingUser.roles ?? []), Role.CUSTOMER, existingApp.requestedRole]),
        );
        const nextDeactivated = (existingUser.deactivatedRoles ?? []).filter((r) => r !== existingApp.requestedRole);
        const nextPrimaryRole =
          existingUser.role === Role.CUSTOMER ? existingApp.requestedRole : pickBestPrimaryRole(nextRoles);
        const preservedKingId = existingUser.kingId || (await generateUniqueKingId(tx as any));

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
      } else {
        const newKingId = await generateUniqueKingId(tx as any);
        const fallbackHash = existingApp.passwordHash || (await argon2.hash(generateTempPassword()));
        targetUser = await tx.user.create({
          data: {
            kingId: newKingId,
            mobile: cleanMobile,
            name: existingApp.name,
            role: existingApp.requestedRole,
            roles: [Role.CUSTOMER, existingApp.requestedRole],
            ...commonKycData,
            passwordHash: fallbackHash,
          },
          select: SAFE_USER_SELECT,
        });
      }

      if (existingApp.requestedRole === Role.SELLER) {
        const existingStore = await tx.sellerStore.findUnique({
          where: { sellerId: targetUser.id },
        });
        if (!existingStore) {
          const rawBase = (existingApp.storeName || existingApp.name || 'seller-store')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 32) || 'farmsking-store';
          const slug = `${rawBase}-${randomBytes(3).toString('hex')}`;

          await tx.sellerStore.create({
            data: {
              sellerId: targetUser.id,
              storeName: existingApp.storeName || `${existingApp.name} Store`,
              slug,
              sellerType: existingApp.sellerType || SellerType.FARMER,
              legalName: existingApp.legalName || existingApp.name,
              gstin: existingApp.gstin || null,
              panNumber: existingApp.panNumber || null,
              aadhaarLast4: existingApp.aadhaarLast4 || null,
              upiId: existingApp.upiId || null,
              kycStatus: SellerKycStatus.VERIFIED,
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
        } else {
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
              kycStatus: SellerKycStatus.VERIFIED,
              kycVerifiedAt: new Date(),
              kycVerifiedById: caller.id,
            },
          });
        }
      }

      const updatedApplication = await tx.partnerApplication.update({
        where: { id: existingApp.id },
        data: {
          status: PartnerApplicationStatus.APPROVED,
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

    // Post-transaction non-blocking provisioning & notifications
    try {
      await provisionInviteCoupon(this.prisma, txResult.targetUser.id);
      if (existingApp.requestedRole === Role.AGENT) {
        await provisionPartnerReferralCoupon(this.prisma, txResult.targetUser.id, caller.id);
      }
      if (txResult.isBrandNewUser) {
        await this.walletService.ensureWelcomeBonus(txResult.targetUser.id);
      }
      await this.prisma.verifiedSignupLead
        ?.updateMany?.({
          where: { mobile: cleanMobile },
          data: {
            status: VerifiedLeadStatus.COMPLETED_SELF,
            convertedUserId: txResult.targetUser.id,
            convertedAt: new Date(),
            intendedRole: existingApp.requestedRole,
            capturedName: txResult.targetUser.name,
          },
        })
        .catch(() => {});
    } catch (e: any) {
      console.warn('[ApprovePartnerApplication] Coupon/wallet provision notice:', e?.message);
    }

    try {
      await this.notificationsService.create(
        txResult.targetUser.id,
        NotificationType.SYSTEM,
        `Partner Application Approved (${existingApp.requestedRole})`,
        `Congratulations ${txResult.targetUser.name}! Your ${existingApp.requestedRole} role is now active on King ID ${txResult.targetUser.kingId}. Sign in via the Partner Login tab.`,
      );
    } catch {}

    this.whatsappBotService
      ?.sendDirectTextMessage(
        cleanMobile,
        `🎉 FarmsKing Partner Approved!\n\nHello ${txResult.targetUser.name}, your application for *${existingApp.requestedRole}* is *APPROVED*!\n🔑 King ID: ${txResult.targetUser.kingId}\n\nYou can now sign in via the Partner Login portal on FarmsKing.`,
      )
      .catch(() => {});

    const { passwordHash: _ph, ...safeApp } = txResult.updatedApplication;
    return {
      success: true,
      application: safeApp,
      user: txResult.targetUser,
      message: `${txResult.targetUser.name} approved as ${existingApp.requestedRole} (King ID: ${txResult.targetUser.kingId}).`,
    };
  }

  /** Admin: Reject a Partner application with reason so applicant can edit profile/docs and resubmit */
  async rejectPartnerApplication(caller: AuthUser, applicationId: string, reason: string) {
    const cleanReason = reason?.trim();
    if (!cleanReason || cleanReason.length < 5) {
      throw new BadRequestException('Please provide a clear rejection reason (at least 5 characters) so the applicant knows what to fix.');
    }

    const existingApp = await this.prisma.partnerApplication.findUnique({
      where: { id: applicationId },
    });
    if (!existingApp) {
      throw new NotFoundException('Partner application not found.');
    }
    if (existingApp.status === PartnerApplicationStatus.APPROVED) {
      throw new ConflictException('Approved applications cannot be rejected.');
    }

    const updatedApp = await this.prisma.partnerApplication.update({
      where: { id: applicationId },
      data: {
        status: PartnerApplicationStatus.REJECTED,
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
        .create(
          existingApp.applicantUserId,
          NotificationType.SYSTEM,
          'Partner Application Requires Updates',
          `Your ${existingApp.requestedRole} application was not approved: "${cleanReason}". Open Partner Login to edit and resubmit.`,
        )
        .catch(() => {});
    }

    this.whatsappBotService
      ?.sendDirectTextMessage(
        existingApp.mobile,
        `⚠️ FarmsKing Partner Application Update\n\nHello ${existingApp.name}, your application for *${existingApp.requestedRole}* needs corrections before approval:\nReason: ${cleanReason}\n\nOpen Partner Login -> "Edit & Resubmit Application" to update your details.`,
      )
      .catch(() => {});

    const { passwordHash: _ph, ...safeApp } = updatedApp;
    return {
      success: true,
      application: safeApp,
      message: 'Partner application marked rejected with reason. Applicant can edit and resubmit.',
    };
  }

  /** Helper: resolve referrer by King ID, 10-digit mobile, or Coupon code */
  private async resolveReferrerByCode(rawCode?: string | null): Promise<{ id: string } | null> {
    const cleanCode = rawCode?.trim();
    if (!cleanCode) return null;

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

  /** Admin/Audit: List first-time signup attempts whose OTP was actually confirmed */
  async listVerifiedSignupLeads(status?: string, search?: string) {
    const validStatuses = new Set<string>(Object.values(VerifiedLeadStatus));
    const normalizedStatus = status?.trim().toUpperCase();
    const where: Prisma.VerifiedSignupLeadWhereInput = {};

    if (normalizedStatus && normalizedStatus !== 'ALL' && validStatuses.has(normalizedStatus)) {
      where.status = normalizedStatus as VerifiedLeadStatus;
    }

    const q = search?.trim();
    if (q) {
      where.OR = [
        { mobile: { contains: q } },
        { capturedName: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { capturedEmail: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { pincode: { contains: q } },
        { district: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { state: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { village: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { referralCode: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { adminNotes: { contains: q, mode: Prisma.QueryMode.insensitive } },
        {
          convertedUser: {
            kingId: { contains: q, mode: Prisma.QueryMode.insensitive },
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

    const countMap = new Map<string, number>();
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
        otpConfirmed: countMap.get(VerifiedLeadStatus.OTP_CONFIRMED) || 0,
        completedSelf: countMap.get(VerifiedLeadStatus.COMPLETED_SELF) || 0,
        convertedByAdmin: countMap.get(VerifiedLeadStatus.CONVERTED_BY_ADMIN) || 0,
        dismissed: countMap.get(VerifiedLeadStatus.DISMISSED) || 0,
      },
    };
  }

  /** Admin: Save follow-up notes, captured details, or dismiss/reopen an OTP-confirmed signup lead */
  async updateVerifiedSignupLeadNotes(
    caller: AuthUser,
    leadId: string,
    dto: UpdateVerifiedLeadNotesDto,
  ) {
    const existing = await this.prisma.verifiedSignupLead.findUnique({
      where: { id: leadId },
    });
    if (!existing) {
      throw new NotFoundException('Verified signup lead not found.');
    }

    let nextStatus: VerifiedLeadStatus | undefined;
    if (dto.status === VerifiedLeadStatus.DISMISSED || dto.status === VerifiedLeadStatus.OTP_CONFIRMED) {
      if (existing.convertedUserId) {
        throw new BadRequestException('Cannot change status after an account has already been created for this lead.');
      }
      nextStatus = dto.status as VerifiedLeadStatus;
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
        ...(dto.intendedRole !== undefined ? { intendedRole: dto.intendedRole as Role } : {}),
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
          action:
            nextStatus === VerifiedLeadStatus.DISMISSED
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
      .catch(() => {});

    return {
      success: true,
      lead: updated,
      message:
        nextStatus === VerifiedLeadStatus.DISMISSED
          ? 'Lead moved to Dismissed.'
          : nextStatus === VerifiedLeadStatus.OTP_CONFIRMED
            ? 'Lead restored to Waiting Follow-Up.'
            : 'Follow-up details and notes saved.',
    };
  }

  /** Admin: Convert an OTP-confirmed first-time lead directly into an active FarmsKing account */
  async convertVerifiedLeadToUser(caller: AuthUser, leadId: string, dto: ConvertVerifiedLeadDto) {
    const lead = await this.prisma.verifiedSignupLead.findUnique({
      where: { id: leadId },
    });
    if (!lead) {
      throw new NotFoundException('Verified signup lead not found.');
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
      if (lead.status === VerifiedLeadStatus.OTP_CONFIRMED) {
        await this.prisma.verifiedSignupLead.update({
          where: { id: lead.id },
          data: {
            status: VerifiedLeadStatus.COMPLETED_SELF,
            convertedUserId: existingActiveUser.id,
            convertedAt: new Date(),
            intendedRole: existingActiveUser.role,
          },
        });
      }
      throw new ConflictException(
        `This mobile number already has an active account (King ID: ${existingActiveUser.kingId || existingActiveUser.id}).`,
      );
    }

    const cleanEmail = dto.email?.trim() ? dto.email.trim().toLowerCase() : null;
    if (cleanEmail) {
      const emailOwner = await this.prisma.user.findFirst({
        where: { email: cleanEmail, deletedAt: null },
        select: { id: true },
      });
      if (emailOwner) {
        throw new ConflictException('This email address is already registered with another FarmsKing account.');
      }
    }

    const chosenRole: Role =
      dto.role === 'FARMER'
        ? Role.FARMER
        : dto.role === 'GARDENER'
          ? Role.GARDENER
          : Role.CUSTOMER;
    const assignedRoles: Role[] =
      chosenRole === Role.CUSTOMER ? [Role.CUSTOMER] : [Role.CUSTOMER, chosenRole];

    const referrer = await this.resolveReferrerByCode(dto.referralCode || lead.referralCode);
    const kingId = await generateUniqueKingId(this.prisma);
    const passwordHash = await argon2.hash(randomBytes(24).toString('hex'));

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
          sprayTankSizeL: chosenRole === Role.FARMER ? (dto.sprayTankSizeL ?? null) : null,
          soilType: chosenRole === Role.FARMER ? (dto.soilType ?? null) : null,
          waterType: chosenRole === Role.FARMER ? (dto.waterType ?? null) : null,
          referredById: referrer?.id || null,
          termsAcceptedAt: new Date(),
          privacyPolicyVersion: '2026.11',
        },
        select: SAFE_USER_SELECT,
      });

      if (chosenRole === Role.FARMER) {
        await tx.farmerPlan.upsert({
          where: { farmerId: createdUser.id },
          create: { farmerId: createdUser.id },
          update: {},
        });
      } else if (chosenRole === Role.GARDENER) {
        await tx.gardenerPlan.upsert({
          where: { gardenerId: createdUser.id },
          create: { gardenerId: createdUser.id },
          update: {},
        });
      }

      const updatedLead = await tx.verifiedSignupLead.update({
        where: { id: lead.id },
        data: {
          status: VerifiedLeadStatus.CONVERTED_BY_ADMIN,
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

    // Post-transaction non-blocking provisioning & welcome outreach
    try {
      await provisionInviteCoupon(this.prisma, txResult.createdUser.id);
      if (referrer) {
        await provisionReferralWelcomeCoupon(this.prisma, txResult.createdUser.id, referrer.id);
      }
    } catch (e: any) {
      console.warn('[ConvertVerifiedLead] Coupon provision notice:', e?.message);
    }
    try {
      await this.walletService.ensureWelcomeBonus(txResult.createdUser.id);
    } catch (e: any) {
      console.warn('[ConvertVerifiedLead] Wallet bonus notice:', e?.message);
    }

    try {
      await this.notificationsService.create(
        txResult.createdUser.id,
        NotificationType.SYSTEM,
        'Welcome to FarmsKing!',
        `Hello ${txResult.createdUser.name}! Your FarmsKing ${chosenRole} account is now active. King ID: ${txResult.createdUser.kingId}.`,
      );
    } catch {}

    this.whatsappBotService
      ?.sendDirectTextMessage(
        cleanMobile,
        `🌾 *Welcome to FarmsKing!* 🙏✨\n\nHello *${txResult.createdUser.name}*,\nYour FarmsKing *${chosenRole}* account has been activated!\n\n🔑 *King ID:* ${txResult.createdUser.kingId}\n📱 *Registered Mobile:* ${cleanMobile}\n\nYou can sign in directly using Mobile OTP on https://farmsking.in.\n\n- FARMSKING TECHNOLOGIES PRIVATE LIMITED`,
      )
      .catch(() => {});

    this.whatsappGroupSyncService
      .autoAddNewUser(txResult.createdUser.id, cleanMobile, txResult.createdUser.name)
      .catch(() => {});

    return {
      success: true,
      user: txResult.createdUser,
      lead: txResult.updatedLead,
      message: `${txResult.createdUser.name} account created with King ID ${txResult.createdUser.kingId}.`,
    };
  }
}

