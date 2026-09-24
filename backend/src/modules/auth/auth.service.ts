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
  upiId: true,
  billPrintingAddress: true,
  printName: true,
  printAddress: true,
  createdAt: true,
} as const;

import { WhatsappBotService } from '../whatsapp/whatsapp.service';
import { WhatsAppGroupSyncService } from '../whatsapp/whatsapp-group-sync.service';

interface ForgotPasswordOtpStore {
  otp: string;
  expiresAt: number;
  userId: string;
  verified: boolean;
}

import { AppSettingsService } from '../app-settings/app-settings.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class AuthService {
  private readonly otpStore = new Map<string, ForgotPasswordOtpStore>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly whatsappBotService: WhatsappBotService,
    private readonly whatsappGroupSyncService: WhatsAppGroupSyncService,
    private readonly appSettingsService: AppSettingsService,
    private readonly walletService: WalletService,
  ) {}

  async sendWhatsAppOtp(mobile: string, otpCode: string) {
    const success = await this.whatsappBotService.sendOtpMessage(mobile, otpCode);
    return { success, message: success ? 'WhatsApp OTP sent directly to mobile.' : 'WhatsApp Bot not connected.' };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { mobile: dto.mobile } });

    let referrer: { id: string } | null = null;
    if (dto.referralCode?.trim()) {
      const cleanCode = dto.referralCode.trim();
      referrer = await this.prisma.user.findUnique({ where: { kingId: cleanCode }, select: { id: true } });
      if (!referrer) {
        const coupon = await this.prisma.coupon.findUnique({ where: { code: cleanCode }, select: { createdById: true, businessPartnerId: true } });
        const ownerId = coupon?.createdById || coupon?.businessPartnerId;
        if (ownerId) {
          referrer = { id: ownerId };
        }
      }
      if (!referrer) {
        throw new BadRequestException('Invalid referral code or coupon code.');
      }
    }

    const passwordHash = await argon2.hash(dto.password);
    const securityAnswerHash = dto.securityAnswer ? await argon2.hash(dto.securityAnswer.trim().toLowerCase()) : undefined;
    const defaultAddress = [dto.village, dto.district, dto.state].filter(Boolean).join(', ');

    let user: any;

    if (existing) {
      // Existing User Account (e.g. created as worker with King ID) -> Update details & apply selected role to SAME King ID!
      const targetRole = dto.accountType === 'FARMER' ? Role.FARMER : dto.accountType === 'GARDENER' ? Role.GARDENER : Role.CUSTOMER;
      const updatedRoles = Array.from(new Set([...(existing.roles || []), targetRole, Role.CUSTOMER]));

      user = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          name: dto.name || existing.name,
          farmName: dto.farmName || dto.name || existing.farmName,
          farmAddress: dto.farmAddress || defaultAddress || existing.farmAddress,
          farmMobile: dto.farmMobile || dto.mobile,
          pincode: dto.pincode || existing.pincode,
          postOffice: dto.postOffice || existing.postOffice,
          village: dto.village || existing.village,
          district: dto.district || existing.district,
          state: dto.state || existing.state,
          preferredLanguage: dto.preferredLanguage ?? existing.preferredLanguage ?? 'en',
          sprayTankSizeL: dto.sprayTankSizeL ?? existing.sprayTankSizeL ?? null,
          soilType: dto.soilType ?? existing.soilType ?? null,
          waterType: dto.waterType ?? existing.waterType ?? null,
          upiId: dto.upiId || existing.upiId || null,
          role: targetRole,
          roles: updatedRoles,
          ...(securityAnswerHash && { securityQuestion: dto.securityQuestion, securityAnswerHash }),
          ...(referrer && !existing.referredById && { referredById: referrer.id }),
        },
        select: SAFE_USER_SELECT,
      });
    } else {
      // New User -> Create User with generated King ID
      const kingId = await generateUniqueKingId(this.prisma);
      user = await this.prisma.user.create({
        data: {
          kingId,
          mobile: dto.mobile,
          passwordHash,
          name: dto.name,
          farmName: dto.farmName || dto.name,
          farmAddress: dto.farmAddress || defaultAddress || null,
          farmMobile: dto.farmMobile || dto.mobile,
          pincode: dto.pincode || null,
          postOffice: dto.postOffice || null,
          village: dto.village || null,
          district: dto.district || null,
          state: dto.state || null,
          preferredLanguage: dto.preferredLanguage ?? 'en',
          sprayTankSizeL: dto.sprayTankSizeL ?? null,
          soilType: dto.soilType ?? null,
          waterType: dto.waterType ?? null,
          upiId: dto.upiId || null,
          role: Role.CUSTOMER,
          roles: [Role.CUSTOMER],
          securityQuestion: dto.securityQuestion || null,
          securityAnswerHash: securityAnswerHash || null,
          referredById: referrer?.id || null,
        },
        select: SAFE_USER_SELECT,
      });
    }

    await provisionInviteCoupon(this.prisma, user.id);

    if (referrer && !existing) {
      await provisionReferralWelcomeCoupon(this.prisma, user.id, referrer.id);

      const appSettings = await this.appSettingsService.get();
      const referralBonus = Number(appSettings.referralSignupBonusAmount ?? 10);
      const newUserBonus = Number(appSettings.newUserSignupBonusAmount ?? 10);

      if (referralBonus > 0) {
        await this.walletService.credit(
          referrer.id,
          referralBonus,
          `🎉 Referral Income (New user joined: ${user.name || user.kingId})`,
          { relatedUserId: user.id },
        );
      }

      if (newUserBonus > 0) {
        await this.walletService.credit(
          user.id,
          newUserBonus,
          `🎁 Welcome Offer Bonus (Referral Signup)`,
          { relatedUserId: referrer.id },
        );
      }
    }

    const finalUser = await this.applyAccountType(user.id, dto.accountType);

    // Send WhatsApp Welcome & Registration message directly to mobile via WhatsApp Bot
    const welcomeMsg = `🌾 *Welcome to FarmsKing!* 🙏✨\n\nHello *${dto.name || user.name}* ji,\nYour FarmsKing account has been registered successfully!\n\n🔑 *King ID:* ${user.kingId}\n📱 *Registered Mobile:* ${dto.mobile}\n\nThank you for choosing FarmsKing!`;
    this.whatsappBotService.sendDirectTextMessage(dto.mobile, welcomeMsg).catch(() => {});

    // Auto-add new user to WhatsApp group immediately after signup (non-blocking)
    this.whatsappGroupSyncService.autoAddNewUser(
      user.id,
      dto.mobile,
      dto.name ?? 'New User',
    ).catch(() => {});

    return this.buildAuthResponse(finalUser ?? user);
  }

  /**
   * Farmer/Gardener signup grants FARMER or GARDENER role plus FREE plan record.
   * NOTE: Role.BUSINESS_PARTNER is NOT automatically assigned. Only Super Admin/Admin can assign BUSINESS_PARTNER.
   */
  private async applyAccountType(userId: string, accountType?: 'CUSTOMER' | 'FARMER' | 'GARDENER') {
    if (accountType === 'FARMER') {
      const [updated] = await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: { role: Role.FARMER, roles: { push: [Role.FARMER] } },
          select: SAFE_USER_SELECT,
        }),
        this.prisma.farmerPlan.upsert({ where: { farmerId: userId }, create: { farmerId: userId }, update: {} }),
      ]);
      return updated;
    }
    if (accountType === 'GARDENER') {
      const [updated] = await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: { role: Role.GARDENER, roles: { push: [Role.GARDENER] } },
          select: SAFE_USER_SELECT,
        }),
        this.prisma.gardenerPlan.upsert({ where: { gardenerId: userId }, create: { gardenerId: userId }, update: {} }),
      ]);
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
            failedLoginAttempts: 0,
            lockoutUntil: null,
            isPermanentlyBlocked: false,
          },
        });
      } else {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash,
            role: Role.SUPER_ADMIN,
            roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.FARMER, Role.CUSTOMER],
            failedLoginAttempts: 0,
            lockoutUntil: null,
            isPermanentlyBlocked: false,
          },
        });
      }
    }

    if (!user) {
      throw new UnauthorizedException('Invalid mobile number or password.');
    }

    // 1. Check if user is permanently blocked (50 wrong attempts)
    if (user.isPermanentlyBlocked) {
      throw new UnauthorizedException(
        '🔒 Your account has been permanently blocked due to 50 failed login attempts. Please contact Admin to reset your password.',
      );
    }

    // 2. Check if user is currently locked out (5, 10, 20 wrong attempts)
    if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
      const msLeft = new Date(user.lockoutUntil).getTime() - Date.now();
      const minutesLeft = Math.ceil(msLeft / (1000 * 60));
      let durationStr = `${minutesLeft} minutes`;
      if (minutesLeft >= 60) {
        const hoursLeft = (minutesLeft / 60).toFixed(1);
        durationStr = `${hoursLeft} hours`;
      }
      throw new UnauthorizedException(
        `⏳ Account is locked for ${durationStr} due to multiple failed login attempts. Please contact Admin to unlock or reset your password.`,
      );
    }

    // 3. Verify Password
    const isPasswordValid = await argon2.verify(user.passwordHash, cleanPassword);

    if (!isPasswordValid) {
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      let lockoutDurationMs = 0;
      let isPermanent = false;
      let errorMsg = '';

      if (newAttempts >= 50) {
        isPermanent = true;
        errorMsg = '🔒 Your account has been PERMANENTLY BLOCKED due to 50 failed login attempts. Contact Admin to reset.';
      } else if (newAttempts >= 20) {
        lockoutDurationMs = 24 * 60 * 60 * 1000; // 24 hours
        errorMsg = `⏳ Account locked for 24 hours due to ${newAttempts} failed login attempts. Contact Admin to reset sooner.`;
      } else if (newAttempts >= 10) {
        lockoutDurationMs = 2 * 60 * 60 * 1000; // 2 hours
        errorMsg = `⏳ Account locked for 2 hours due to ${newAttempts} failed login attempts. Contact Admin to reset sooner.`;
      } else if (newAttempts >= 5) {
        lockoutDurationMs = 30 * 60 * 1000; // 30 minutes
        errorMsg = `⏳ Account locked for 30 minutes due to ${newAttempts} failed login attempts. Contact Admin to reset sooner.`;
      } else {
        const left = 5 - newAttempts;
        errorMsg = `Invalid mobile number or password. (${left} attempt${left === 1 ? '' : 's'} left before 30m lock)`;
      }

      const lockoutUntil = lockoutDurationMs > 0 ? new Date(Date.now() + lockoutDurationMs) : null;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newAttempts,
          lockoutUntil: lockoutUntil ?? user.lockoutUntil,
          isPermanentlyBlocked: isPermanent,
        },
      });

      throw new UnauthorizedException(errorMsg);
    }

    // 4. Successful Password Verification -> Reset failed attempts & lockout
    if (user.failedLoginAttempts > 0 || user.lockoutUntil !== null) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockoutUntil: null,
        },
      });
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
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        isPermanentlyBlocked: false,
      },
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
