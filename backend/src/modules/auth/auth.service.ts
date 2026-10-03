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
import type { AuthUser } from '../../common/types/auth-user.type';

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
  farmName: true,
  farmAddress: true,
  referredById: true,
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

interface MobileLinkOtpStore {
  otp: string;
  mobile: string;
  expiresAt: number;
  userId: string;
}

import { AppSettingsService } from '../app-settings/app-settings.service';
import { WalletService } from '../wallet/wallet.service';
import { UserSessionService } from './user-session.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private readonly otpStore = new Map<string, ForgotPasswordOtpStore>();
  private readonly mobileLinkOtpStore = new Map<string, MobileLinkOtpStore>();
  private readonly loginOtpStore = new Map<string, { otp: string; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly whatsappBotService: WhatsappBotService,
    private readonly whatsappGroupSyncService: WhatsAppGroupSyncService,
    private readonly appSettingsService: AppSettingsService,
    private readonly walletService: WalletService,
    private readonly userSessionService: UserSessionService,
    private readonly emailService: EmailService,
  ) {}

  async sendWhatsAppOtp(mobile: string, otpCode: string) {
    const success = await this.whatsappBotService.sendOtpMessage(mobile, otpCode);
    return { success, message: success ? 'WhatsApp OTP sent directly to mobile.' : 'WhatsApp Bot not connected.' };
  }

  async sendEmailOtp(email: string, otpCode: string) {
    const success = await this.emailService.sendEmailOtp(email, otpCode);
    return { success, message: success ? 'Email OTP sent directly via Gmail SMTP.' : 'Failed to send Email OTP.' };
  }

  async googleLogin(dto: { email: string; name?: string; photoUrl?: string; googleId?: string }) {
    const cleanEmail = dto.email.trim().toLowerCase();

    let user = await this.prisma.user.findFirst({
      where: { email: cleanEmail, deletedAt: null },
    });

    if (!user) {
      const kingId = await generateUniqueKingId(this.prisma);
      const passwordHash = await argon2.hash(Math.random().toString(36).slice(-10));
      user = await this.prisma.user.create({
        data: {
          kingId,
          email: cleanEmail,
          name: dto.name || cleanEmail.split('@')[0],
          photoUrl: dto.photoUrl || null,
          mobile: `G_${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          passwordHash,
          role: Role.CUSTOMER,
          roles: [Role.CUSTOMER],
          isPhoneVerified: true,
        },
      });
    } else if (dto.photoUrl && !user.photoUrl) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { photoUrl: dto.photoUrl },
      });
    }

    const { passwordHash: _ph, securityAnswerHash: _sah, ...safeUser } = user;
    const isProfileIncomplete = !user.mobile || user.mobile.startsWith('G_') || !user.village || !user.pincode;

    return {
      ...this.buildAuthResponse(safeUser as any),
      isProfileIncomplete,
      missingFields: [
        ...(!user.mobile || user.mobile.startsWith('G_') ? ['mobile'] : []),
        ...(!user.pincode ? ['pincode'] : []),
        ...(!user.village ? ['village'] : []),
      ],
    };
  }

  async linkGoogleAccount(currentUser: AuthUser, dto: { email: string; name?: string; photoUrl?: string; googleId?: string }) {
    const cleanEmail = dto.email.trim().toLowerCase();

    // Check if another active user has this email
    const existing = await this.prisma.user.findFirst({
      where: { email: cleanEmail, deletedAt: null },
    });

    if (existing && existing.id !== currentUser.id) {
      // If the existing user is an auto-created placeholder Google account (mobile starts with G_)
      if (existing.mobile && existing.mobile.startsWith('G_')) {
        await this.reassignUserRecords(existing.id, currentUser.id);
        // Soft-delete the placeholder user account to allow merging email onto current account
        await this.prisma.user.update({
          where: { id: existing.id },
          data: { deletedAt: new Date() },
        });
      } else {
        throw new ConflictException('This Google account is already linked to another active FarmsKing user.');
      }
    }

    const dbUser = await this.prisma.user.findUnique({ where: { id: currentUser.id } });
    if (!dbUser) throw new NotFoundException('User not found.');

    const updated = await this.prisma.user.update({
      where: { id: currentUser.id },
      data: {
        email: cleanEmail,
        ...(dto.photoUrl && !dbUser.photoUrl ? { photoUrl: dto.photoUrl } : {}),
      },
      select: SAFE_USER_SELECT,
    });

    return {
      success: true,
      message: 'Google account successfully linked!',
      user: updated,
    };
  }

  async sendMobileLinkOtp(user: AuthUser, mobile: string) {
    const rawDigits = mobile.replace(/\D/g, '');
    const cleanMobile = rawDigits.slice(-10);
    if (cleanMobile.length !== 10) {
      throw new BadRequestException('Please enter a valid 10-digit mobile number.');
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.mobileLinkOtpStore.set(user.id, {
      otp: otpCode,
      mobile: cleanMobile,
      expiresAt: Date.now() + 10 * 60 * 1000,
      userId: user.id,
    });

    const sent = await this.whatsappBotService.sendOtpMessage(cleanMobile, otpCode);

    return {
      success: true,
      message: sent ? 'OTP sent via WhatsApp successfully!' : 'OTP generated (WhatsApp bot offline).',
      devOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
    };
  }

  async verifyMobileLinkOtp(user: AuthUser, dto: { mobile: string; otp: string; password?: string }) {
    const rawDigits = dto.mobile.replace(/\D/g, '');
    const cleanMobile = rawDigits.slice(-10);

    const stored = this.mobileLinkOtpStore.get(user.id);
    if (!stored || stored.mobile !== cleanMobile) {
      throw new BadRequestException('OTP expired or not requested for this mobile number.');
    }

    if (Date.now() > stored.expiresAt) {
      this.mobileLinkOtpStore.delete(user.id);
      throw new BadRequestException('OTP has expired. Please request a new OTP.');
    }

    if (stored.otp !== dto.otp.trim()) {
      throw new BadRequestException('Invalid OTP. Please check the 6-digit code and try again.');
    }

    let passwordHash: string | undefined = undefined;
    if (dto.password && dto.password.trim().length >= 4) {
      passwordHash = await argon2.hash(dto.password.trim());
    }

    // Check if an existing account already owns this mobile number
    const existingMobileUser = await this.prisma.user.findFirst({
      where: {
        mobile: cleanMobile,
        deletedAt: null,
        id: { not: user.id },
      },
    });

    let targetUser: any;
    let isMerged = false;

    if (existingMobileUser) {
      // User verified OTP for existing mobile account -> Merge Google email onto existing mobile user
      const currentUserData = await this.prisma.user.findUnique({ where: { id: user.id } });

      // Transfer email and photoUrl if present
      targetUser = await this.prisma.user.update({
        where: { id: existingMobileUser.id },
        data: {
          ...(currentUserData?.email ? { email: currentUserData.email } : {}),
          ...(currentUserData?.photoUrl && !existingMobileUser.photoUrl ? { photoUrl: currentUserData.photoUrl } : {}),
          ...(passwordHash ? { passwordHash } : {}),
        },
        select: SAFE_USER_SELECT,
      });

      // Transfer any farms, orders, expenses, addresses created on Google account to existing mobile account
      await this.reassignUserRecords(user.id, existingMobileUser.id);

      // Soft-delete the temporary Google account
      await this.prisma.user.update({
        where: { id: user.id },
        data: { deletedAt: new Date() },
      });

      isMerged = true;
    } else {
      // Standard update on current user
      targetUser = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          mobile: cleanMobile,
          isPhoneVerified: true,
          ...(passwordHash ? { passwordHash } : {}),
        },
        select: SAFE_USER_SELECT,
      });
    }

    this.mobileLinkOtpStore.delete(user.id);

    const authResponse = this.buildAuthResponse(targetUser);

    return {
      success: true,
      message: isMerged
        ? 'Accounts merged successfully! On your Free Plan, your 3 latest crops remain active for editing. Older crops stay visible in View-Only mode (upgrade plan to edit older crops).'
        : 'Mobile number verified and linked successfully!',
      isMerged,
      user: targetUser,
      accessToken: authResponse.accessToken,
    };
  }

  /** Reassigns all user-generated records (farms, orders, expenses, addresses, labour) when merging two accounts */
  private async reassignUserRecords(sourceUserId: string, targetUserId: string) {
    await this.prisma.$transaction([
      this.prisma.farm.updateMany({ where: { ownerId: sourceUserId }, data: { ownerId: targetUserId } }),
      this.prisma.customerOrder.updateMany({ where: { customerId: sourceUserId }, data: { customerId: targetUserId } }),
      this.prisma.customerAddress.updateMany({ where: { ownerId: sourceUserId }, data: { ownerId: targetUserId } }),
      this.prisma.expense.updateMany({ where: { recordedById: sourceUserId }, data: { recordedById: targetUserId } }),
      this.prisma.sale.updateMany({ where: { recordedById: sourceUserId }, data: { recordedById: targetUserId } }),
      this.prisma.payment.updateMany({ where: { recordedById: sourceUserId }, data: { recordedById: targetUserId } }),
      this.prisma.party.updateMany({ where: { ownerId: sourceUserId }, data: { ownerId: targetUserId } }),
      this.prisma.labourWorker.updateMany({ where: { farmerId: sourceUserId }, data: { farmerId: targetUserId } }),
      this.prisma.cropProblem.updateMany({ where: { reportedById: sourceUserId }, data: { reportedById: targetUserId } }),
      // Mobile account retains ONLY its own original wallet balance — discard temp Google account wallet transactions
      this.prisma.walletTransaction.deleteMany({ where: { userId: sourceUserId } }),
    ]);
  }


  async register(dto: RegisterDto) {
    const rawMobileDigits = dto.mobile ? dto.mobile.replace(/\D/g, '') : '';
    const cleanMobileNum = rawMobileDigits.slice(-10);

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { mobile: dto.mobile.trim() },
          ...(cleanMobileNum ? [
            { mobile: cleanMobileNum },
            { mobile: `+91${cleanMobileNum}` },
            { mobile: { endsWith: cleanMobileNum } },
          ] : []),
        ],
        deletedAt: null,
      },
    });

    let referrer: { id: string } | null = null;
    if (dto.referralCode?.trim()) {
      const cleanCode = dto.referralCode.trim();
      const rawDigits = cleanCode.replace(/\D/g, '');
      const cleanReferrerMobile = rawDigits.slice(-10);

      // 1. Try finding by exact King ID, padded King ID, or endsWith digits
      referrer = await this.prisma.user.findFirst({
        where: {
          OR: [
            { kingId: cleanCode },
            ...(rawDigits ? [
              { kingId: rawDigits },
              { kingId: rawDigits.padStart(8, '0') },
              { kingId: { endsWith: rawDigits } },
            ] : []),
          ],
        },
        select: { id: true },
      });

      // 2. Try finding by Referrer's Mobile Number (if user typed phone number instead of King ID)
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

      // 3. Try finding by Coupon code (case-insensitive)
      if (!referrer) {
        const coupon = await this.prisma.coupon.findFirst({
          where: { code: { equals: cleanCode, mode: 'insensitive' } },
          select: { createdById: true, businessPartnerId: true },
        });
        const ownerId = coupon?.createdById || coupon?.businessPartnerId;
        if (ownerId) {
          referrer = { id: ownerId };
        }
      }

      // If referral code is provided but not matched, log warning & allow registration to complete
      if (!referrer) {
        console.warn(`[Register] Referral code "${cleanCode}" provided but not found. Proceeding with registration without referrer.`);
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

    if (referrer) {
      await provisionReferralWelcomeCoupon(this.prisma, user.id, referrer.id);
    }

    // Auto-credit Welcome Signup Bonus to new user and Referral Income to referrer (if referred)
    await this.walletService.ensureWelcomeBonus(user.id);

    const finalUser = await this.applyAccountType(user.id, dto.accountType);

    // Send WhatsApp Welcome & Registration message directly to mobile via WhatsApp Bot
    const userReferralLink = `https://farmsking.in/register?ref=${user.kingId}`;
    const welcomeMsg = `🌾 *Welcome to FarmsKing!* 🙏✨\n\n` +
      `Hello *${dto.name || user.name}* ji,\n` +
      `FarmsKing Smart Farming App पर आपका खाता सफलतापूर्वक बन गया है! 🎉\n\n` +
      `🔑 *Your King ID:* ${user.kingId}\n` +
      `📱 *Registered Mobile:* ${dto.mobile}\n\n` +
      `💶 *Invite & Earn Cashback Offer:* 💶\n` +
      `अपने अन्य किसान भाइयों को FarmsKing App से जोड़ें और हर सफल रजिस्ट्रेशन पर पाएं *Cashback Bonus!* 🎁✨\n\n` +
      `👉 *Share Your Referral Link:* 👇\n` +
      `${userReferralLink}\n\n` +
      `इस लिंक को खोल के register करने पर पाएं cashback! 💶💶💶💶💶\n\n` +
      `FarmsKing App से जुड़ने के लिए धन्यवाद! 🌾🚜`;
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
        : 'WhatsApp OTP message triggered. Please check your WhatsApp.',
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

    if (!dto.newPassword || dto.newPassword.trim().length < 8) {
      throw new BadRequestException('New password must be at least 8 characters.');
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

  async logoutOtherSessions(userId: string, currentSessionId?: string) {
    const result = this.userSessionService.logoutOtherSessions(userId, currentSessionId || '');
    return {
      success: true,
      message: `Logged out from ${result.loggedOutCount} other device(s).`,
      loggedOutCount: result.loggedOutCount,
    };
  }

  async verifyPassword(identifier: string, password: string) {
    const cleanPassword = (password ?? '').trim();
    if (!cleanPassword) {
      return {
        success: false,
        message: 'Kripya apna account password darj karo.',
      };
    }

    const cleanDigits = identifier ? identifier.replace(/\D/g, '').slice(-10) : '';

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: identifier },
          { mobile: identifier },
          ...(cleanDigits
            ? [
                { mobile: cleanDigits },
                { mobile: `+91${cleanDigits}` },
                { mobile: { endsWith: cleanDigits } },
              ]
            : []),
        ],
        deletedAt: null,
      },
    });

    if (!user || !user.passwordHash) {
      return {
        success: false,
        message: 'User account or password not found.',
      };
    }

    const isValid = await argon2.verify(user.passwordHash, cleanPassword);
    if (!isValid) {
      return {
        success: false,
        message: '❌ ਪਾਸਵਰਡ ਗਲਤ ਹੈ! ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਸਹੀ ਪਾਸਵਰਡ ਭਰੋ (Re-enter Password).',
      };
    }

    return {
      success: true,
      message: 'Password verified successfully.',
    };
  }

  // ─── OTP-based Login ──────────────────────────────────────────────────────
  /** Step 1: Send 6-digit WhatsApp OTP for login */
  async sendLoginOtp(mobile: string) {
    const rawDigits = mobile.replace(/\D/g, '');
    const cleanMobile = rawDigits.slice(-10);
    if (cleanMobile.length !== 10) {
      throw new BadRequestException('Please enter a valid 10-digit mobile number.');
    }

    const user = await this.prisma.user.findFirst({
      where: { mobile: cleanMobile, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('No account found with this mobile number. Please register first.');
    }

    // Check lockout/block
    if (user.isPermanentlyBlocked) {
      throw new UnauthorizedException('🔒 Your account has been permanently blocked. Please contact Admin.');
    }
    if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
      const msLeft = new Date(user.lockoutUntil).getTime() - Date.now();
      const minutesLeft = Math.ceil(msLeft / (1000 * 60));
      throw new UnauthorizedException(`⏳ Account is locked for ${minutesLeft} minutes. Please try later.`);
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.loginOtpStore.set(cleanMobile, {
      otp: otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const sent = await this.whatsappBotService.sendOtpMessage(cleanMobile, otpCode);

    return {
      success: true,
      message: sent ? 'OTP sent via WhatsApp!' : 'OTP generated (WhatsApp bot offline).',
      devOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
    };
  }

  /** Step 2: Verify OTP and return auth session */
  async verifyLoginOtp(mobile: string, otp: string) {
    const rawDigits = mobile.replace(/\D/g, '');
    const cleanMobile = rawDigits.slice(-10);

    const stored = this.loginOtpStore.get(cleanMobile);
    if (!stored) {
      throw new BadRequestException('OTP expired or not requested. Please request a new OTP.');
    }
    if (Date.now() > stored.expiresAt) {
      this.loginOtpStore.delete(cleanMobile);
      throw new BadRequestException('OTP has expired. Please request a new OTP.');
    }
    if (stored.otp !== otp.trim()) {
      throw new BadRequestException('Invalid OTP. Please check the 6-digit code sent to your WhatsApp.');
    }

    this.loginOtpStore.delete(cleanMobile);

    let user = await this.prisma.user.findFirst({
      where: { mobile: cleanMobile, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User account not found.');
    }

    // Reset any failed login attempts on successful OTP login
    if (user.failedLoginAttempts > 0 || user.lockoutUntil !== null) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockoutUntil: null },
      });
    }

    const { passwordHash: _ph, securityAnswerHash: _sah, ...safeUser } = user;
    return this.buildAuthResponse(safeUser as any);
  }

  private buildAuthResponse(
    user: { id: string; mobile: string; role: Role } & Record<string, unknown>,
    deviceInfo?: string,
  ) {
    const sessionInfo = this.userSessionService.createSession(user.id, deviceInfo);
    const accessToken = this.jwtService.sign({
      sub: user.id,
      role: user.role,
      sid: sessionInfo.sessionId,
    });
    return {
      accessToken,
      user,
      sessionMeta: {
        sessionId: sessionInfo.sessionId,
        totalActiveSessions: sessionInfo.totalActiveSessions,
        hasMultipleLogins: sessionInfo.hasMultipleLogins,
        warningMessage: sessionInfo.warningMessage,
        evictedOldest: sessionInfo.evictedOldest,
      },
    };
  }
}
