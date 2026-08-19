import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { generateUniqueKingId } from '../../common/utils/king-id.util';
import { provisionInviteCoupon } from '../../common/utils/invite-coupon.util';
import { provisionPartnerReferralCoupon } from '../../common/utils/partner-coupon.util';
import { provisionReferralWelcomeCoupon } from '../../common/utils/referral-coupon.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordStartDto } from './dto/forgot-password-start.dto';
import { ForgotPasswordVerifyDto } from './dto/forgot-password-verify.dto';

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
  pincode: true,
  postOffice: true,
  preferredLanguage: true,
  referralWelcomeCouponCode: true,
  createdAt: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { mobile: dto.mobile } });
    if (existing) {
      throw new ConflictException('An account with this mobile number already exists.');
    }

    let referrer: { id: string } | null = null;
    if (dto.referralCode?.trim()) {
      referrer = await this.prisma.user.findUnique({ where: { kingId: dto.referralCode.trim() }, select: { id: true } });
      if (!referrer) {
        throw new BadRequestException('Invalid referral code.');
      }
    }

    const passwordHash = await argon2.hash(dto.password);
    const kingId = await generateUniqueKingId(this.prisma);
    const securityAnswerHash = dto.securityAnswer ? await argon2.hash(dto.securityAnswer.trim().toLowerCase()) : undefined;

    const user = await this.prisma.user.create({
      data: {
        kingId,
        mobile: dto.mobile,
        passwordHash,
        name: dto.name,
        pincode: dto.pincode,
        postOffice: dto.postOffice,
        village: dto.village,
        district: dto.district,
        state: dto.state,
        preferredLanguage: dto.preferredLanguage ?? 'en',
        role: Role.CUSTOMER,
        roles: [Role.CUSTOMER],
        securityQuestion: dto.securityQuestion,
        securityAnswerHash,
        referredById: referrer?.id,
      },
      select: SAFE_USER_SELECT,
    });

    await provisionInviteCoupon(this.prisma, user.id);
    if (referrer) {
      await provisionReferralWelcomeCoupon(this.prisma, user.id, referrer.id);
    }

    const finalUser = await this.applyAccountType(user.id, dto.accountType);

    return this.buildAuthResponse(finalUser ?? user);
  }

  /**
   * Farmer/Gardener signup also grants BUSINESS_PARTNER (they can refer customers and earn commission)
   * on top of the CUSTOMER role every account already has — plus their FREE plan record.
   */
  private async applyAccountType(userId: string, accountType?: 'CUSTOMER' | 'FARMER' | 'GARDENER') {
    if (accountType === 'FARMER') {
      const [updated] = await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: { role: Role.FARMER, roles: { push: [Role.FARMER, Role.BUSINESS_PARTNER] } },
          select: SAFE_USER_SELECT,
        }),
        this.prisma.farmerPlan.upsert({ where: { farmerId: userId }, create: { farmerId: userId }, update: {} }),
      ]);
      await provisionPartnerReferralCoupon(this.prisma, userId, userId);
      return updated;
    }
    if (accountType === 'GARDENER') {
      const [updated] = await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: { role: Role.GARDENER, roles: { push: [Role.GARDENER, Role.BUSINESS_PARTNER] } },
          select: SAFE_USER_SELECT,
        }),
        this.prisma.gardenerPlan.upsert({ where: { gardenerId: userId }, create: { gardenerId: userId }, update: {} }),
      ]);
      await provisionPartnerReferralCoupon(this.prisma, userId, userId);
      return updated;
    }
    return null;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { mobile: dto.mobile, deletedAt: null },
    });

    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid mobile number or password.');
    }

    const { passwordHash: _passwordHash, securityAnswerHash: _securityAnswerHash, ...safeUser } = user;
    return this.buildAuthResponse(safeUser);
  }

  /** Step 1: mobile + PIN code must match an account before the security question is revealed. */
  async forgotPasswordStart(dto: ForgotPasswordStartDto) {
    const user = await this.prisma.user.findFirst({
      where: { mobile: dto.mobile, pincode: dto.pincode, deletedAt: null },
    });
    if (!user || !user.securityQuestion) {
      throw new NotFoundException('No account found with this mobile number and PIN code, or no security question is set.');
    }
    return { securityQuestion: user.securityQuestion };
  }

  /** Step 2: correct security answer resets the password to the account's own mobile number. */
  async forgotPasswordVerify(dto: ForgotPasswordVerifyDto) {
    const user = await this.prisma.user.findFirst({
      where: { mobile: dto.mobile, pincode: dto.pincode, deletedAt: null },
    });
    if (!user || !user.securityAnswerHash) {
      throw new NotFoundException('No account found with this mobile number and PIN code, or no security question is set.');
    }

    const matches = await argon2.verify(user.securityAnswerHash, dto.securityAnswer.trim().toLowerCase());
    if (!matches) {
      throw new BadRequestException('Security answer does not match.');
    }

    const newPasswordHash = await argon2.hash(user.mobile);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: newPasswordHash } });

    return { message: 'Password reset. Your new password is your mobile number — please change it after logging in.' };
  }

  private buildAuthResponse(user: { id: string; mobile: string; role: Role } & Record<string, unknown>) {
    const accessToken = this.jwtService.sign({ sub: user.id, role: user.role });
    return { accessToken, user };
  }
}
