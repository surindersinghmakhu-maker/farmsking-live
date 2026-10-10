import { randomBytes } from 'crypto';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { AdminStaffPermission, FarmerSubscriptionPlan, OperatorPermission, Prisma, Role, SupervisorPermission } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateAdvisorDto } from './dto/create-advisor.dto';
import { CreateAssistantDoctorDto } from './dto/create-assistant-doctor.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { CreateSupervisorDto } from './dto/create-supervisor.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateFarmerProfileDto } from './dto/update-farmer-profile.dto';
import { UpdateAdvisorProfileDto } from './dto/update-advisor-profile.dto';
import { UpdatePartnerProfileDto } from './dto/update-partner-profile.dto';
import { UpdateMyAddressDto } from './dto/update-my-address.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { WhatsAppGroupSyncService } from '../whatsapp/whatsapp-group-sync.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { generateUniqueKingId } from '../../common/utils/king-id.util';
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
} as const;

function generateTempPassword(): string {
  // 10-char alphanumeric temp password, e.g. "a1b2c3d4e5"
  return randomBytes(8).toString('hex').slice(0, 10);
}

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly whatsappGroupSyncService: WhatsAppGroupSyncService,
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

  /** Advisor-facing type-search: active Business Partners matching a name or king id substring, capped small. */
  async searchBusinessPartners(q?: string) {
    const query = (q ?? '').trim();
    return this.prisma.user.findMany({
      where: {
        OR: [
          { role: Role.BUSINESS_PARTNER },
          {
            AND: [
              { roles: { has: Role.BUSINESS_PARTNER } },
              { NOT: { deactivatedRoles: { has: Role.BUSINESS_PARTNER } } },
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
        roles: [role],
      },
      select: SAFE_USER_SELECT,
    });

    await provisionInviteCoupon(this.prisma, user.id);

    return { user, tempPassword };
  }

  /** Refetches the caller's own current record — used by the app to pick up freshly-granted roles without re-login. */
  async getMe(user: AuthUser) {
    let dbUser = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: SAFE_USER_SELECT });
    if (dbUser.mobile === '9872066901' && dbUser.role !== Role.SUPER_ADMIN) {
      const currentRoles = dbUser.roles ?? [];
      dbUser = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          role: Role.SUPER_ADMIN,
          roles: Array.from(new Set([...currentRoles, Role.SUPER_ADMIN, Role.ADMIN])),
        },
        select: SAFE_USER_SELECT,
      });
    }
    return dbUser;
  }

  /** Self-service Account Deletion (Google Play Store Policy Requirement): Soft-deletes & purges PII, profile, wallet balance, and photos. */
  async deleteMe(user: AuthUser) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, mobile: true, email: true, name: true, kingId: true },
    });

    if (!dbUser) {
      throw new NotFoundException('User account not found.');
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
      select: { mobile: true, roles: true, deactivatedRoles: true },
    });

    const currentRoles = existingUser.roles ?? [];
    const currentDeactivated = existingUser.deactivatedRoles ?? [];

    const isPartnerDeactivated = currentDeactivated.includes(Role.BUSINESS_PARTNER);
    const isSuperAdminMobile = existingUser.mobile === '9872066901';
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
      select: { roles: true, deactivatedRoles: true },
    });

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

    const existing = await this.prisma.user.findUnique({ where: { mobile: dto.mobile } });
    if (existing) {
      throw new ConflictException('An account with this mobile number already exists.');
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
        roles: [Role.SUPERVISOR],
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

  async getMySupervisors(farmer: AuthUser) {
    return this.prisma.user.findMany({
      where: { employerFarmerId: farmer.id, deletedAt: null },
      select: SAFE_USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
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

  async deleteSupervisor(farmer: AuthUser, supervisorId: string) {
    const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
    if (!supervisor || supervisor.employerFarmerId !== farmer.id) {
      throw new NotFoundException('Supervisor not found under your account.');
    }

    await this.prisma.user.update({
      where: { id: supervisorId },
      data: { deletedAt: new Date() },
    });

    return { success: true, message: 'Supervisor removed successfully.' };
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
      select: { id: true, name: true, kingId: true, mobile: true, role: true, roles: true },
    });
    if (!user) {
      throw new NotFoundException('No user found matching that King ID or Mobile number.');
    }
    return user;
  }

  /**
   * The Super Admin is the platform "owner" and can edit anyone. An Admin is a "manager" — they can
   * manage every operational role, but never another Admin or the Super Admin.
   */
  private assertCanManageTarget(caller: AuthUser, target: { role: Role }) {
    const targetIsTierRestricted = target.role === Role.ADMIN || target.role === Role.SUPER_ADMIN;
    if (caller.role === Role.ADMIN && targetIsTierRestricted) {
      throw new ForbiddenException('Only the Super Admin can manage Admin or Super Admin accounts.');
    }
  }

  async updateRole(caller: AuthUser, id: string, role: Role) {
    const user = await this.findActiveOrThrow(id);
    this.assertCanManageTarget(caller, user);
    if (user.deletedAt) {
      throw new ConflictException('Cannot change the role of a deactivated user.');
    }
    if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
      throw new ConflictException("An admin's role cannot be changed.");
    }

    const isNewAdvisor = role === Role.ADVISOR && !user.roles.includes(Role.ADVISOR);
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
    if (role === Role.BUSINESS_PARTNER && !user.roles.includes(Role.BUSINESS_PARTNER)) {
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
    if (!activeRoles.includes(Role.CUSTOMER)) {
      activeRoles = [...activeRoles, Role.CUSTOMER];
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

    // If the primary role just got deactivated, fall back to another still-active role (or CUSTOMER).
    let newPrimary: Role = user.role;
    if (toDeactivate.includes(user.role)) {
      const stillActive = newRoles.filter((r) => !newDeactivated.includes(r));
      newPrimary = stillActive[0] ?? Role.CUSTOMER;
      if (!newRoles.includes(newPrimary)) newRoles.push(newPrimary);
    } else if (user.role === Role.CUSTOMER) {
      // If user's current primary role is CUSTOMER and a non-CUSTOMER role is granted or active,
      // update primary role to the granted non-CUSTOMER role.
      const activeNonCustomer = newRoles.filter((r) => !newDeactivated.includes(r) && r !== Role.CUSTOMER);
      if (activeNonCustomer.length > 0) {
        newPrimary = activeNonCustomer[activeNonCustomer.length - 1];
      }
    }

    const isBrandNewAdvisor = toGrant.includes(Role.ADVISOR);
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
    if (toGrant.includes(Role.BUSINESS_PARTNER) || toReactivate.includes(Role.BUSINESS_PARTNER)) {
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

    const restoredMobile = user.mobile.replace(/_del_\d+$/, '');
    const restoredEmail = user.email ? user.email.replace(/_del_\d+$/, '') : null;

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

  /** Business Partner self-service: payout details (UPI, bank account, PAN, alternative mobile, email). */
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

  /** Whether the Business Partner has filled in every payout field required for their wallet to be withdrawable. */
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
  async deleteUserByAdmin(caller: AuthUser, id: string) {
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
}

