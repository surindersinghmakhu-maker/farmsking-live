import { randomBytes } from 'crypto';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OperatorPermission, Prisma, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateAdvisorDto } from './dto/create-advisor.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
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
} as const;

function generateTempPassword(): string {
  // 10-char alphanumeric temp password, e.g. "a1b2c3d4e5"
  return randomBytes(8).toString('hex').slice(0, 10);
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly whatsappGroupSyncService: WhatsAppGroupSyncService,
  ) {}

  async list(query: ListUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const status = query.status ?? 'all';

    const where: Prisma.UserWhereInput = {
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
              { name: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
              { mobile: { contains: query.search } },
              { kingId: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
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

  /** Self-service Account Deletion (Google Play Store Policy Requirement): Soft-deletes user profile. */
  async deleteMe(user: AuthUser) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date() },
    });
    return { success: true, message: 'Account and associated data deleted successfully.' };
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
      ? [Role.SUPER_ADMIN, Role.ADMIN, Role.FARMER, Role.BUSINESS_PARTNER]
      : isPartnerDeactivated
        ? [Role.FARMER]
        : [Role.FARMER, Role.BUSINESS_PARTNER];

    const newRoles = Array.from(new Set([...currentRoles, ...rolesToAdd]));
    const newDeactivated = currentDeactivated.filter((r) => r !== Role.FARMER && r !== Role.SUPER_ADMIN);
    const primaryRole = isSuperAdminMobile ? Role.SUPER_ADMIN : Role.FARMER;

    const profileData: Prisma.UserUpdateInput = {};
    if (dto) {
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
      await provisionPartnerReferralCoupon(this.prisma, user.id, user.id);
    }
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

    const isPartnerDeactivated = currentDeactivated.includes(Role.BUSINESS_PARTNER);
    const rolesToAdd = isPartnerDeactivated ? [Role.GARDENER] : [Role.GARDENER, Role.BUSINESS_PARTNER];

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
    if (!isPartnerDeactivated) {
      await provisionPartnerReferralCoupon(this.prisma, user.id, user.id);
    }
    return updated;
  }

  createAdmin(dto: CreateStaffDto) {
    return this.createStaff(dto, Role.ADMIN);
  }

  private async findActiveOrThrow(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  /** Resolves a farmer's FarmsKing ID to their account — used by advisors/admins/business partners to apply a coupon on their behalf. */
  async lookupByKingId(kingId: string) {
    const user = await this.prisma.user.findFirst({
      where: { kingId: kingId.toUpperCase(), roles: { has: Role.FARMER }, deletedAt: null },
      select: { id: true, name: true, kingId: true, mobile: true, role: true },
    });
    if (!user) {
      throw new NotFoundException('No farmer found with that FarmsKing ID.');
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
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        role,
        roles: user.roles.includes(role) ? undefined : { push: role },
        ...(isNewAdvisor ? { specialization: null, bio: null, yearsExperience: null, advisorType: null } : {}),
      },
      select: SAFE_USER_SELECT,
    });
    if (role === Role.BUSINESS_PARTNER && !user.roles.includes(Role.BUSINESS_PARTNER)) {
      await provisionPartnerReferralCoupon(this.prisma, id, caller.id);
    }

    // 📲 WhatsApp Group: add if newly assigned FARMER or ADVISOR role
    const eligibleRoles: Role[] = [Role.FARMER, Role.ADVISOR];
    if (eligibleRoles.includes(role)) {
      this.whatsappGroupSyncService.autoAddNewUser(
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
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });

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

    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: SAFE_USER_SELECT,
    });
  }

  async reactivate(caller: AuthUser, id: string) {
    const user = await this.findActiveOrThrow(id);
    this.assertCanManageTarget(caller, user);
    if (!user.deletedAt) {
      throw new ConflictException('User is already active.');
    }

    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: null },
      select: SAFE_USER_SELECT,
    });
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

  /** Farmer self-service: fills in the onboarding fields an advisor needs (photo, tank size, soil/water type). */
  async updateFarmerProfile(user: AuthUser, dto: UpdateFarmerProfileDto) {
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

  /** Super Admin: permanently deletes user and ALL associated records from the database */
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

    await this.prisma.$transaction(
      async (tx) => {
        // 1. Clear referral links
        await tx.user.updateMany({ where: { referredById: id }, data: { referredById: null } });

        // 2. Delete child plans, subscriptions & assignments
        await tx.farmerPlan.deleteMany({ where: { farmerId: id } });
        await tx.gardenerPlan.deleteMany({ where: { gardenerId: id } });
        await tx.advisorTierPlan.deleteMany({ where: { advisorId: id } });
        await tx.advisorAssignment.deleteMany({ where: { OR: [{ farmerId: id }, { advisorId: id }, { assignedById: id }] } });
        await tx.callRequest.deleteMany({ where: { OR: [{ farmerId: id }, { advisorId: id }] } });
        await tx.partnerAssignment.deleteMany({ where: { OR: [{ businessPartnerId: id }, { customerId: id }] } });
        await tx.advisorSubscription.deleteMany({ where: { OR: [{ farmerId: id }, { approvedById: id }] } });

        // 3. Delete financial requests, transactions & wallet data
        await tx.walletTransaction.deleteMany({ where: { OR: [{ userId: id }, { relatedUserId: id }] } });
        await tx.withdrawalRequest.deleteMany({ where: { OR: [{ businessPartnerId: id }, { processedById: id }] } });
        await tx.planPaymentRequest.deleteMany({ where: { OR: [{ farmerId: id }, { confirmedById: id }] } });
        await tx.farmerPlanPaymentRequest.deleteMany({ where: { OR: [{ farmerId: id }, { confirmedById: id }] } });
        await tx.saleBill.deleteMany({ where: { farmerId: id } });
        await tx.paymentReceipt.deleteMany({ where: { farmerId: id } });

        // 4. Delete messages, notifications & chats
        await tx.notification.deleteMany({ where: { userId: id } });
        await tx.adminChatMessage.deleteMany({ where: { OR: [{ farmerId: id }, { adminId: id }] } });
        await tx.message.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } });
        await tx.cropProblem.deleteMany({ where: { OR: [{ reportedById: id }, { assignedAdvisorId: id }] } });
        await tx.groupVoiceCallParticipant.deleteMany({ where: { userId: id } });

        // 5. Delete labour records
        await tx.labourEntry.deleteMany({ where: { recordedById: id } });
        await tx.labourWorkEntry.deleteMany({ where: { OR: [{ recordedById: id }, { farmerId: id }] } });
        await tx.labourPayment.deleteMany({ where: { OR: [{ recordedById: id }, { farmerId: id }] } });
        await tx.labourWorker.deleteMany({ where: { OR: [{ farmerId: id }, { userId: id }] } });

        // 6. Delete expenses, sales & parties
        await tx.expense.deleteMany({ where: { recordedById: id } });
        await tx.sale.deleteMany({ where: { recordedById: id } });
        await tx.payment.deleteMany({ where: { recordedById: id } });
        await tx.party.deleteMany({ where: { ownerId: id } });
        await tx.unifiedParty.deleteMany({ where: { OR: [{ ownerFarmerId: id }, { userId: id }] } });
        await tx.customer.deleteMany({ where: { farmerId: id } });

        // 7. Delete farms & related plots
        await tx.farm.deleteMany({ where: { ownerId: id } });

        // 8. Delete orders, addresses, coupons & logs
        await tx.customerOrder.deleteMany({ where: { customerId: id } });
        await tx.customerAddress.deleteMany({ where: { ownerId: id } });
        await tx.couponRedemption.deleteMany({ where: { customerId: id } });
        await tx.coupon.deleteMany({ where: { OR: [{ businessPartnerId: id }, { createdById: id }] } });
        await tx.farmerPlanCoupon.deleteMany({ where: { OR: [{ createdById: id }, { assignedFarmerId: id }, { assignedAdvisorId: id }, { assignedBusinessPartnerId: id }] } });
        await tx.gardenerPlanCoupon.deleteMany({ where: { OR: [{ createdById: id }, { assignedGardenerId: id }] } });
        await tx.auditLog.deleteMany({ where: { actorId: id } });
        await tx.upload.deleteMany({ where: { uploadedById: id } });

        // 9. Delete KingConnect & Voice AI
        await tx.kingConnectLink.deleteMany({ where: { OR: [{ initiatorId: id }, { receiverId: id }] } });
        await tx.p2pLedgerSyncRequest.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } });
        await tx.demandRequest.deleteMany({ where: { OR: [{ requesterId: id }, { farmerId: id }] } });
        await tx.kingPaymentRequest.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } });
        await tx.voiceAILog.deleteMany({ where: { userId: id } });

        // 10. Finally, hard delete the User record itself from the database
        await tx.user.delete({ where: { id } });
      },
      {
        timeout: 30000,
        maxWait: 10000,
      },
    );

    return { success: true, message: `User ${user.name} (${user.mobile}) and all associated records deleted permanently.` };
  }
}
