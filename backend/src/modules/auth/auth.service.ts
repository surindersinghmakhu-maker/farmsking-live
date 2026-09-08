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
import { ForgotPasswordResetDto } from './dto/forgot-password-reset.dto';

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
  sprayTankSizeL: true,
  soilType: true,
  waterType: true,
  preferredLanguage: true,
  createdAt: true,
} as const;

import { WhatsappBotService } from '../whatsapp/whatsapp.service';

interface ForgotPasswordOtpStore {
  otp: string;
  expiresAt: number;
  userId: string;
  verified: boolean;
}

@Injectable()
export class AuthService {
  private readonly otpStore = new Map<string, ForgotPasswordOtpStore>();

  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService, private readonly whatsappBotService: WhatsappBotService) {}

  async sendWhatsAppOtp(mobile: string, otpCode: string) {
    const success = await this.whatsappBotService.sendOtpMessage(mobile, otpCode);
    return { success, message: success ? 'WhatsApp OTP sent directly to mobile.' : 'WhatsApp Bot not connected.' };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { mobile: dto.mobile } });
    if (existing) {
      throw new ConflictException('An account with this mobile number already exists.');
    }

    if (dto.accountType === 'FARMER') {
      if (!dto.sprayTankSizeL || !dto.soilType || !dto.waterType) {
        throw new BadRequestException('Farmer registration requires sprayTankSizeL, soilType, and waterType.');
      }
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
        sprayTankSizeL: dto.sprayTankSizeL,
        soilType: dto.soilType,
        waterType: dto.waterType,
        upiId: dto.upiId,
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
    const cleanMobile = (dto.mobile ?? '').trim();
    const cleanPassword = (dto.password ?? '').trim();

    let user = await this.prisma.user.findFirst({
      where: { mobile: cleanMobile, deletedAt: null },
    });

    // Special Super Admin master login override for 9872066901
    if (cleanMobile === '9872066901' && (cleanPassword === 'admin' || cleanPassword === '12345678')) {
      const passwordHash = await argon2.hash(cleanPassword);
      if (!user) {
        const kingId = await generateUniqueKingId(this.prisma);
        user = await this.prisma.user.create({
          data: {
            kingId,
            mobile: '9872066901',
            passwordHash,
            role: Role.SUPER_ADMIN,
            roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.FARMER, Role.CUSTOMER],
            name: 'Surinder Singh (Super Admin)',
          },
        });
      } else {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash,
            role: Role.SUPER_ADMIN,
            roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.FARMER, Role.CUSTOMER],
          },
        });
      }
    }

    if (!user || !(await argon2.verify(user.passwordHash, cleanPassword))) {
      throw new UnauthorizedException('Invalid mobile number or password.');
    }

    if (cleanMobile === '9872066901' && user.role !== Role.SUPER_ADMIN) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          role: Role.SUPER_ADMIN,
          roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.FARMER, Role.CUSTOMER],
        },
      });
    }

    const { passwordHash: _passwordHash, securityAnswerHash: _securityAnswerHash, ...safeUser } = user;
    return this.buildAuthResponse(safeUser);
  }

  /** Step 1: Mobile + PIN Code verification -> Sends WhatsApp OTP to user */
  async forgotPasswordStart(dto: ForgotPasswordStartDto) {
    const mobile = dto.mobile.trim();
    const pincode = dto.pincode.trim();

    const user = await this.prisma.user.findFirst({
      where: { mobile, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('No active account found with this mobile number.');
    }

    if (user.pincode && user.pincode.trim() !== pincode) {
      throw new BadRequestException('The PIN code entered does not match our records for this account.');
    }

    // Generate 4-digit OTP
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Store in OTP Map (valid for 10 minutes)
    this.otpStore.set(mobile, {
      otp: otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000,
      userId: user.id,
      verified: false,
    });

    // Send WhatsApp OTP
    const sentViaWhatsApp = await this.whatsappBotService.sendOtpMessage(mobile, otpCode);

    return {
      success: true,
      mobile,
      message: sentViaWhatsApp
        ? 'WhatsApp OTP has been sent to your mobile number.'
        : `WhatsApp OTP generated (${otpCode}).`,
      devOtp: sentViaWhatsApp ? undefined : otpCode,
    };
  }

  /** Step 2: Verify 4-digit OTP */
  async forgotPasswordVerify(dto: ForgotPasswordVerifyDto) {
    const mobile = dto.mobile.trim();
    const stored = this.otpStore.get(mobile);

    if (!stored || Date.now() > stored.expiresAt) {
      throw new BadRequestException('OTP has expired or is invalid. Please request a new OTP.');
    }

    if (stored.otp !== dto.otp.trim()) {
      throw new BadRequestException('Invalid OTP code. Please enter the correct code sent to WhatsApp.');
    }

    stored.verified = true;
    this.otpStore.set(mobile, stored);

    return {
      success: true,
      verified: true,
      message: 'OTP verified successfully! Please create your new password.',
    };
  }

  /** Step 3: Reset & update password to new password */
  async forgotPasswordReset(dto: ForgotPasswordResetDto) {
    const mobile = dto.mobile.trim();
    const stored = this.otpStore.get(mobile);

    if (!stored || !stored.verified || Date.now() > stored.expiresAt) {
      throw new BadRequestException('OTP session expired or not verified. Please request a new OTP.');
    }

    if (!dto.newPassword || dto.newPassword.trim().length < 6) {
      throw new BadRequestException('New password must be at least 6 characters.');
    }

    const passwordHash = await argon2.hash(dto.newPassword.trim());
    await this.prisma.user.update({
      where: { id: stored.userId },
      data: { passwordHash },
    });

    this.otpStore.delete(mobile);

    return {
      success: true,
      message: 'Your password has been updated successfully! Please log in with your new password.',
    };
  }

  private buildAuthResponse(user: { id: string; mobile: string; role: Role } & Record<string, unknown>) {
    const accessToken = this.jwtService.sign({ sub: user.id, role: user.role });
    return { accessToken, user };
  }
}
