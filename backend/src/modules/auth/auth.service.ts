import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, Optional, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationType, PartnerApplicationStatus, Role, SellerType, VerifiedLeadStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { generateUniqueKingId } from '../../common/utils/king-id.util';
import { provisionInviteCoupon } from '../../common/utils/invite-coupon.util';
import { provisionPartnerReferralCoupon } from '../../common/utils/partner-coupon.util';
import { provisionReferralWelcomeCoupon } from '../../common/utils/referral-coupon.util';
import { RegisterDto } from './dto/register.dto';
import { RegisterTraderDto } from './dto/register-trader.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LinkGoogleDto } from './dto/link-google.dto';
import { ForgotPasswordStartDto } from './dto/forgot-password-start.dto';
import { ForgotPasswordVerifyDto } from './dto/forgot-password-verify.dto';
import { ForgotPasswordResetDto } from './dto/forgot-password-reset.dto';
import { PartnerApplyDto } from './dto/partner-apply.dto';
import type { AuthUser } from '../../common/types/auth-user.type';
import {
  ADMIN_STAFF_ROLES,
  FARM_STAFF_ROLES,
  PARTNER_PORTAL_ROLES,
  assertRoleCombinationAllowed,
  evaluatePortalEligibility,
  getActiveRolesList,
} from '../../common/utils/role-policy.util';
import { AADHAAR_LAST4_REGEX, IFSC_REGEX, isValidGstin, isValidPan } from '../../common/utils/tax-compliance.util';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  initializeApp({
    projectId: 'farmsking-510606',
  });
}

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
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class AuthService {
  private readonly otpStore = new Map<string, ForgotPasswordOtpStore>();
  private readonly mobileLinkOtpStore = new Map<string, MobileLinkOtpStore>();
  private readonly loginOtpStore = new Map<string, { otp: string; expiresAt: number }>();
  private readonly verifiedOtpMobiles = new Map<string, number>();
  private readonly registerOtpStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>();
  private readonly partyOtpStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>();
  private readonly partnerSignupOtpStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>();
  private readonly partnerVerifiedMap = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly whatsappBotService: WhatsappBotService,
    private readonly whatsappGroupSyncService: WhatsAppGroupSyncService,
    private readonly appSettingsService: AppSettingsService,
    private readonly walletService: WalletService,
    private readonly userSessionService: UserSessionService,
    private readonly emailService: EmailService,
    @Optional() private readonly uploadsService?: UploadsService,
  ) {}

  async sendWhatsAppOtp(mobile: string, otpCode: string) {
    const success = await this.whatsappBotService.sendOtpMessage(mobile, otpCode);
    return { success, message: success ? 'WhatsApp OTP sent directly to mobile.' : 'WhatsApp Bot not connected.' };
  }

  protected normalizeIndianMobile(raw: string): string {
    const clean = (raw || '').replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(clean)) {
      throw new BadRequestException('Please enter a valid 10-digit Indian mobile number.');
    }
    return clean;
  }

  protected async issueMobileOtpChallenge(
    store: Map<string, { otp: string; expiresAt: number; attempts: number }>,
    key: string,
    rawMobile: string,
    ttlMs = 10 * 60 * 1000,
    digits: 4 | 6 = 4,
  ) {
    const cleanMobile = this.normalizeIndianMobile(rawMobile);
    const min = digits === 6 ? 100000 : 1000;
    const max = digits === 6 ? 1000000 : 10000;
    const otpCode = crypto.randomInt(min, max).toString();
    store.set(key, {
      otp: otpCode,
      expiresAt: Date.now() + ttlMs,
      attempts: 0,
    });

    let sentViaWhatsApp = false;
    try {
      const waRes = await this.whatsappBotService.sendOtpMessage(cleanMobile, otpCode);
      sentViaWhatsApp = Boolean(waRes?.success);
    } catch {
      sentViaWhatsApp = false;
    }

    const isDev = process.env.NODE_ENV !== 'production';
    return {
      success: true,
      mobile: cleanMobile,
      sentViaWhatsApp,
      message: sentViaWhatsApp
        ? `${digits}-digit verification code sent via WhatsApp (+91 ${cleanMobile}).`
        : isDev
        ? `Localhost mode: ${digits}-digit verification code generated.`
        : `${digits}-digit verification code generated.`,
      devOtp: isDev ? otpCode : undefined,
      expiresInSeconds: Math.floor(ttlMs / 1000),
    };
  }

  protected verifyMobileOtpChallenge(
    store: Map<string, { otp: string; expiresAt: number; attempts: number }>,
    key: string,
    providedOtp: string,
    maxAttempts = 5,
  ) {
    const stored = store.get(key);
    const provided = (providedOtp || '').trim();
    if (!stored) {
      throw new BadRequestException('OTP not requested or already used. Please request a fresh OTP.');
    }
    if (Date.now() > stored.expiresAt) {
      store.delete(key);
      throw new BadRequestException('OTP has expired. Please request a fresh OTP.');
    }
    if (stored.attempts >= maxAttempts) {
      store.delete(key);
      throw new BadRequestException('Too many invalid OTP attempts. Please request a fresh OTP.');
    }
    const expectedBuf = Buffer.from(stored.otp, 'utf8');
    const providedBuf = Buffer.from(provided, 'utf8');
    const isMatch = expectedBuf.length === providedBuf.length && crypto.timingSafeEqual(expectedBuf, providedBuf);
    if (!isMatch) {
      stored.attempts += 1;
      if (stored.attempts >= maxAttempts) {
        store.delete(key);
        throw new BadRequestException('Too many invalid OTP attempts. Code invalidated; please request a fresh OTP.');
      }
      throw new BadRequestException(`Invalid OTP. ${maxAttempts - stored.attempts} attempt(s) remaining.`);
    }
    store.delete(key);
    return true;
  }

  async sendRegisterOtp(mobile: string) {
    const cleanMobile = this.normalizeIndianMobile(mobile);
    if (typeof this.prisma.user?.findFirst === 'function') {
      const existing = await this.findActiveUserByMobile(cleanMobile);
      if (existing?.isPermanentlyBlocked) {
        throw new UnauthorizedException(
          'This mobile number has been permanently blocked by Admin. You cannot sign in or sign up again. Please contact Admin Support.',
        );
      }
    }
    return this.issueMobileOtpChallenge(this.registerOtpStore, cleanMobile, cleanMobile, 10 * 60 * 1000, 4);
  }

  /** Record first-time unregistered user OTP verification (strictly AFTER OTP confirmation) */
  private async recordVerifiedSignupLead(params: {
    mobile: string;
    sourceChannel: 'CLIENT_LOGIN_OTP' | 'FIREBASE_PHONE_OTP' | 'REGISTER_OTP' | 'PARTNER_SIGNUP_OTP';
    portal?: string;
    ipAddress?: string;
    userAgent?: string;
    referralCode?: string;
    capturedName?: string;
    capturedEmail?: string;
    pincode?: string;
    district?: string;
    state?: string;
    village?: string;
    intendedRole?: Role | null;
    convertedUserId?: string | null;
    forceUnread?: boolean;
  }) {
    if (!this.prisma.verifiedSignupLead?.upsert) return;
    try {
      const cleanMobile = this.normalizeIndianMobile(params.mobile);
      const now = new Date();
      const existingLead = await this.prisma.verifiedSignupLead
        .findUnique?.({
          where: { mobile: cleanMobile },
          select: { id: true, attemptCount: true, status: true },
        })
        .catch(() => null);

      const nextStatus = params.forceUnread
        ? VerifiedLeadStatus.OTP_CONFIRMED
        : existingLead &&
            existingLead.status !== VerifiedLeadStatus.OTP_CONFIRMED &&
            existingLead.status !== VerifiedLeadStatus.DISMISSED
          ? existingLead.status
          : VerifiedLeadStatus.OTP_CONFIRMED;

      const saved = await this.prisma.verifiedSignupLead.upsert({
        where: { mobile: cleanMobile },
        create: {
          mobile: cleanMobile,
          sourceChannel: params.sourceChannel,
          portal: params.portal || (params.sourceChannel === 'PARTNER_SIGNUP_OTP' ? 'PARTNER' : 'CLIENT'),
          otpVerifiedAt: now,
          lastAttemptAt: now,
          attemptCount: 1,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
          referralCode: params.referralCode?.trim() || null,
          capturedName: params.capturedName?.trim() || null,
          capturedEmail: params.capturedEmail?.trim().toLowerCase() || null,
          pincode: params.pincode?.trim() || null,
          district: params.district?.trim() || null,
          state: params.state?.trim() || null,
          village: params.village?.trim() || null,
          intendedRole: params.intendedRole || null,
          convertedUserId: params.convertedUserId || null,
          status: VerifiedLeadStatus.OTP_CONFIRMED,
        },
        update: {
          sourceChannel: params.sourceChannel,
          ...(params.portal ? { portal: params.portal } : {}),
          lastAttemptAt: now,
          attemptCount: { increment: 1 },
          ...(params.ipAddress ? { ipAddress: params.ipAddress } : {}),
          ...(params.userAgent ? { userAgent: params.userAgent } : {}),
          ...(params.referralCode?.trim() ? { referralCode: params.referralCode.trim() } : {}),
          ...(params.capturedName?.trim() ? { capturedName: params.capturedName.trim() } : {}),
          ...(params.capturedEmail?.trim() ? { capturedEmail: params.capturedEmail.trim().toLowerCase() } : {}),
          ...(params.pincode?.trim() ? { pincode: params.pincode.trim() } : {}),
          ...(params.district?.trim() ? { district: params.district.trim() } : {}),
          ...(params.state?.trim() ? { state: params.state.trim() } : {}),
          ...(params.village?.trim() ? { village: params.village.trim() } : {}),
          ...(params.intendedRole ? { intendedRole: params.intendedRole } : {}),
          ...(params.convertedUserId ? { convertedUserId: params.convertedUserId } : {}),
          status: nextStatus,
        },
      });

      if (!existingLead) {
        const admins = await this.prisma.user
          .findMany?.({
            where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] }, deletedAt: null },
            select: { id: true },
          })
          .catch(() => []);
        if (Array.isArray(admins) && admins.length > 0 && this.prisma.notification?.createMany) {
          await this.prisma.notification
            .createMany({
              data: admins.map((a: any) => ({
                userId: a.id,
                type: NotificationType.SYSTEM,
                title: 'First-Time Verified OTP Signup Lead',
                body: `+91 ${cleanMobile} confirmed OTP via ${params.sourceChannel}${params.portal ? ` (${params.portal})` : ''} and has not completed signup yet.`,
              })),
            })
            .catch(() => {});
        }
        await this.prisma.isoAuditLog
          ?.create({
            data: {
              action: 'FIRST_TIME_OTP_CONFIRMED',
              actorId: saved?.id || cleanMobile,
              actorName: `+91 ${cleanMobile}`,
              details: {
                leadId: saved?.id,
                mobile: cleanMobile,
                sourceChannel: params.sourceChannel,
                portal: params.portal || null,
                ipAddress: params.ipAddress || null,
                userAgent: params.userAgent || null,
              },
            },
          })
          .catch(() => {});
      }
    } catch (err: any) {
      console.warn('[VerifiedSignupLead] Record notice:', err?.message);
    }
  }

  /** Mark any verified signup lead for this mobile as completed once an account becomes active */
  private async markVerifiedLeadCompleted(
    mobile: string,
    user: {
      id: string;
      role?: Role | string;
      name?: string | null;
      email?: string | null;
      pincode?: string | null;
      district?: string | null;
      state?: string | null;
      village?: string | null;
    },
    status: VerifiedLeadStatus = VerifiedLeadStatus.COMPLETED_SELF,
  ) {
    if (!this.prisma.verifiedSignupLead?.updateMany) return;
    try {
      const cleanMobile = this.normalizeIndianMobile(mobile);
      await this.prisma.verifiedSignupLead.updateMany({
        where: { mobile: cleanMobile },
        data: {
          status,
          convertedUserId: user.id,
          convertedAt: new Date(),
          ...(user.role ? { intendedRole: user.role as Role } : {}),
          ...(user.name?.trim() ? { capturedName: user.name.trim() } : {}),
          ...(user.email?.trim() ? { capturedEmail: user.email.trim().toLowerCase() } : {}),
          ...(user.pincode?.trim() ? { pincode: user.pincode.trim() } : {}),
          ...(user.district?.trim() ? { district: user.district.trim() } : {}),
          ...(user.state?.trim() ? { state: user.state.trim() } : {}),
          ...(user.village?.trim() ? { village: user.village.trim() } : {}),
        },
      });
    } catch {}
  }

  async verifyRegisterOtp(
    mobile: string,
    otp: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const cleanMobile = this.normalizeIndianMobile(mobile);
    this.verifyMobileOtpChallenge(this.registerOtpStore, cleanMobile, otp);
    this.verifiedOtpMobiles.set(cleanMobile, Date.now() + 30 * 60 * 1000);
    const existingUser = await this.findActiveUserByMobile(cleanMobile);
    if (existingUser?.isPermanentlyBlocked) {
      this.verifiedOtpMobiles.delete(cleanMobile);
      throw new UnauthorizedException(
        'This mobile number has been permanently blocked by Admin. You cannot sign in or sign up again. Please contact Admin Support.',
      );
    }
    if (!existingUser) {
      await this.recordVerifiedSignupLead({
        mobile: cleanMobile,
        sourceChannel: 'REGISTER_OTP',
        portal: 'CLIENT',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      });
    }
    return {
      success: true,
      verified: true,
      mobile: cleanMobile,
      message: 'Mobile number verified successfully on server.',
    };
  }

  async sendPartyOtp(callerId: string, mobile: string) {
    const cleanMobile = this.normalizeIndianMobile(mobile);
    return this.issueMobileOtpChallenge(this.partyOtpStore, `${callerId}:${cleanMobile}`, cleanMobile, 10 * 60 * 1000, 4);
  }

  async verifyPartyOtp(callerId: string, mobile: string, otp: string) {
    const cleanMobile = this.normalizeIndianMobile(mobile);
    this.verifyMobileOtpChallenge(this.partyOtpStore, `${callerId}:${cleanMobile}`, otp);
    const existingUser = await this.findActiveUserByMobile(cleanMobile);
    return {
      success: true,
      verified: true,
      mobile: cleanMobile,
      kingId: existingUser?.kingId || null,
      registeredName: existingUser?.name || null,
      message: existingUser?.kingId
        ? `Verified registered FarmsKing user (${existingUser.kingId}).`
        : 'Mobile number verified via server OTP.',
    };
  }

  private sanitizePartnerApplication(app: any) {
    if (!app) return null;
    const { passwordHash, ...rest } = app;
    return {
      ...rest,
      hasPassword: Boolean(passwordHash),
    };
  }

  private buildPartnerUserSummary(user: any) {
    if (!user) return null;
    return {
      id: user.id,
      kingId: user.kingId ?? null,
      name: user.name,
      mobile: user.mobile,
      email: user.email ?? null,
      activeRoles: getActiveRolesList(user),
      pincode: user.pincode ?? null,
      postOffice: user.postOffice ?? null,
      village: user.village ?? null,
      district: user.district ?? null,
      state: user.state ?? null,
      photoUrl: user.photoUrl ?? null,
      qualification: user.qualification ?? null,
      specialization: user.specialization ?? null,
      yearsExperience: user.yearsExperience ?? null,
      bio: user.bio ?? null,
      panNumber: user.panNumber ?? null,
      panDocUrl: user.panDocUrl ?? null,
      aadhaarLast4: user.aadhaarLast4 ?? null,
      aadhaarDocUrl: user.aadhaarDocUrl ?? null,
      aadhaarBackUrl: user.aadhaarBackUrl ?? null,
      gstin: user.gstin ?? null,
      gstDocUrl: user.gstDocUrl ?? null,
      bankAccountHolderName: user.bankAccountHolderName ?? null,
      bankAccountNumber: user.bankAccountNumber ?? null,
      bankIfsc: user.bankIfsc ?? null,
      upiId: user.upiId ?? null,
      chequeDocUrl: user.chequeDocUrl ?? null,
    };
  }

  private assertPartnerEligibilityForExistingUser(user: any, requestedRole?: Role) {
    if (!user) return;
    const activeRoles = getActiveRolesList(user);
    if (activeRoles.some((r) => ADMIN_STAFF_ROLES.includes(r) || FARM_STAFF_ROLES.includes(r))) {
      throw new ConflictException(
        'Supervisor, Labour Worker, and Admin Staff accounts cannot combine with Partner roles. Please apply with a dedicated mobile number.',
      );
    }
    if (requestedRole) {
      if (activeRoles.includes(requestedRole)) {
        throw new ConflictException(`Your FarmsKing account already holds an active ${requestedRole} role.`);
      }
      assertRoleCombinationAllowed([...activeRoles, requestedRole]);
    }
  }

  async sendPartnerSignupOtp(mobile: string) {
    const cleanMobile = this.normalizeIndianMobile(mobile);
    const existingUser = await this.findActiveUserByMobile(cleanMobile);
    if (existingUser?.isPermanentlyBlocked) {
      throw new UnauthorizedException('This account has been permanently blocked. Please contact Admin Support.');
    }
    if (existingUser) {
      this.assertPartnerEligibilityForExistingUser(existingUser);
    }
    return this.issueMobileOtpChallenge(
      this.partnerSignupOtpStore,
      cleanMobile,
      cleanMobile,
      15 * 60 * 1000,
      4,
    );
  }

  async verifyPartnerSignupOtp(
    mobile: string,
    otp: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const cleanMobile = this.normalizeIndianMobile(mobile);
    this.verifyMobileOtpChallenge(this.partnerSignupOtpStore, cleanMobile, otp);
    this.partnerVerifiedMap.set(cleanMobile, Date.now() + 30 * 60 * 1000);

    const existingUser = await this.findActiveUserByMobile(cleanMobile);
    if (existingUser?.isPermanentlyBlocked) {
      throw new UnauthorizedException(
        'This mobile number has been permanently blocked by Admin. You cannot sign in or sign up again. Please contact Admin Support.',
      );
    }
    if (existingUser) {
      this.assertPartnerEligibilityForExistingUser(existingUser);
    }

    const latestApp = await this.prisma.partnerApplication?.findFirst({
      where: { mobile: cleanMobile },
      orderBy: { createdAt: 'desc' },
    });

    const activeRoles = existingUser ? getActiveRolesList(existingUser) : [];
    const activePartnerRoles = activeRoles.filter((r) => PARTNER_PORTAL_ROLES.includes(r));

    if (!latestApp || latestApp.status !== PartnerApplicationStatus.PENDING) {
      await this.recordVerifiedSignupLead({
        mobile: cleanMobile,
        sourceChannel: 'PARTNER_SIGNUP_OTP',
        portal: 'PARTNER',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        capturedName: existingUser?.name || undefined,
        capturedEmail: existingUser?.email || undefined,
        pincode: existingUser?.pincode || undefined,
        district: existingUser?.district || undefined,
        state: existingUser?.state || undefined,
        village: existingUser?.village || undefined,
        convertedUserId: existingUser?.id || null,
        forceUnread: true,
      });
    }

    return {
      success: true,
      verified: true,
      mobile: cleanMobile,
      partnerUploadToken: this.signPartnerUploadToken(cleanMobile),
      existingUserSummary: this.buildPartnerUserSummary(existingUser),
      existingApplication: this.sanitizePartnerApplication(latestApp),
      activePartnerRoles,
      message: existingUser?.kingId
        ? `Verified! Existing FarmsKing King ID ${existingUser.kingId} found — approved partner role will link to the same King ID.`
        : 'Mobile verified! Complete your profile and KYC details to apply.',
    };
  }

  private signPartnerUploadToken(mobile: string): string {
    return this.jwtService.sign({ scope: 'PARTNER_KYC_UPLOAD', mobile }, { expiresIn: '30m' });
  }

  async uploadPartnerKycDocument(
    partnerUploadToken: string,
    file: { buffer?: Buffer; mimetype: string; originalname: string },
  ) {
    if (!partnerUploadToken) {
      throw new UnauthorizedException('Mobile OTP verification token is required before uploading KYC documents.');
    }
    let payload: any;
    try {
      payload = this.jwtService.verify(partnerUploadToken);
    } catch {
      throw new UnauthorizedException('Partner upload session expired. Please verify OTP again.');
    }
    if (payload?.scope !== 'PARTNER_KYC_UPLOAD' || !payload?.mobile) {
      throw new UnauthorizedException('Invalid Partner KYC upload token.');
    }

    const baseMime = String(file.mimetype || '').split(';')[0].trim().toLowerCase();
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!allowedMimes.includes(baseMime)) {
      throw new BadRequestException('Only JPG, PNG, or WebP images are allowed for KYC document upload.');
    }
    if (!file.buffer?.length) {
      throw new BadRequestException('Uploaded image file is empty.');
    }
    if (!this.uploadsService) {
      throw new BadRequestException('Upload storage service is unavailable.');
    }

    const ext = baseMime.includes('png') ? '.png' : baseMime.includes('webp') ? '.webp' : '.jpg';
    const filename = `${crypto.randomUUID()}${ext}`;
    const { fileUrl, provider } = await this.uploadsService.uploadToActiveStorage(
      file.buffer,
      filename,
      baseMime,
      'partner-kyc',
    );
    return {
      success: true,
      fileUrl,
      provider,
    };
  }

  async applyForPartnerRole(dto: PartnerApplyDto) {
    const cleanMobile = this.normalizeIndianMobile(dto.mobile);

    // 1. Verify mobile ownership via server OTP session or Firebase Phone Auth ID Token
    let isVerified = false;
    const otpVerifiedUntil = this.partnerVerifiedMap.get(cleanMobile);
    if (otpVerifiedUntil && otpVerifiedUntil > Date.now()) {
      isVerified = true;
    } else if (dto.firebaseIdToken) {
      try {
        const decoded = await getAuth().verifyIdToken(dto.firebaseIdToken);
        const tokenDigits = (decoded?.phone_number || '').replace(/\D/g, '').slice(-10);
        isVerified = Boolean(tokenDigits && tokenDigits === cleanMobile);
      } catch {
        throw new UnauthorizedException('Invalid or expired phone verification token.');
      }
    }

    if (!isVerified) {
      throw new UnauthorizedException('Please verify your mobile number with OTP before submitting your Partner application.');
    }

    if (!dto.termsAccepted) {
      throw new BadRequestException('Please accept the FarmsKing Partner Terms & Statutory TDS Compliance Policy.');
    }

    // 2. Role Policy check (keeps Supervisor/Labour/Admin isolated; merges Farmer/Gardener/Customer/Trader safely on approval)
    const existingUser = await this.findActiveUserByMobile(cleanMobile);
    if (existingUser) {
      if (existingUser.isPermanentlyBlocked) {
        throw new ForbiddenException('This account has been permanently blocked.');
      }
      this.assertPartnerEligibilityForExistingUser(existingUser, dto.requestedRole as Role);
    }

    // 3. Statutory KYC & document validation
    const cleanPan = dto.panNumber?.trim().toUpperCase();
    if (!isValidPan(cleanPan)) {
      throw new BadRequestException('Please enter a valid 10-character PAN Number (required for Sec 194-O/194-H/194-J TDS compliance).');
    }
    if (!dto.panDocUrl?.trim()) {
      throw new BadRequestException('PAN Card photo/document upload is required.');
    }

    const cleanAadhaarLast4 = dto.aadhaarLast4?.trim();
    if (!AADHAAR_LAST4_REGEX.test(cleanAadhaarLast4)) {
      throw new BadRequestException('Please enter the exact last 4 digits of your Aadhaar card.');
    }
    if (!dto.aadhaarDocUrl?.trim()) {
      throw new BadRequestException('Aadhaar Front document photo upload is required.');
    }

    const cleanIfsc = dto.bankIfsc?.trim().toUpperCase();
    if (!dto.bankAccountHolderName?.trim() || !dto.bankAccountNumber?.trim() || !IFSC_REGEX.test(cleanIfsc)) {
      throw new BadRequestException('Valid Bank Account Holder Name, Account Number, and 11-character IFSC Code are required for payouts.');
    }
    if (!dto.chequeDocUrl?.trim()) {
      throw new BadRequestException('Cancelled Cheque or Bank Passbook copy is required.');
    }
    if (!dto.photoUrl?.trim()) {
      throw new BadRequestException('Passport-size profile photo is required.');
    }

    const cleanGstin = dto.gstin?.trim() ? dto.gstin.trim().toUpperCase() : null;
    if (cleanGstin && !isValidGstin(cleanGstin)) {
      throw new BadRequestException('Entered GSTIN format is invalid. Please provide a valid 15-character GSTIN.');
    }

    if (dto.requestedRole === 'ADVISOR') {
      if (dto.advisorType !== 'FARM' && dto.advisorType !== 'GARDEN') {
        throw new BadRequestException('Please choose Farm Advisor or Garden Advisor specialization.');
      }
      if (!dto.qualification?.trim()) {
        throw new BadRequestException('Academic Qualification / Agronomy Certification is required for Advisors.');
      }
    }

    const resolvedSellerType = dto.sellerType || SellerType.FARMER;
    if (dto.requestedRole === 'SELLER') {
      if (!dto.storeName?.trim()) {
        throw new BadRequestException('Store / Brand Name is required for Seller registration.');
      }
      if (!dto.pickupAddress?.trim()) {
        throw new BadRequestException('Pickup Shop / Warehouse Address is required for Seller orders.');
      }
      if (!dto.pincode?.trim() || !/^\d{6}$/.test(dto.pincode.trim())) {
        throw new BadRequestException('Valid 6-digit Pickup PIN Code is required for Seller registration.');
      }
      if (resolvedSellerType === SellerType.COMMERCIAL) {
        if (!cleanGstin) {
          throw new BadRequestException('Valid 15-character GSTIN is mandatory for Commercial Sellers under CGST Section 24.');
        }
        if (!dto.gstDocUrl?.trim()) {
          throw new BadRequestException('GST Registration Certificate upload is mandatory for Commercial Sellers.');
        }
      }
    }

    // 4. Existing Pending / Rejected application check (supports seamless edit & resubmit!)
    const activeApp = await this.prisma.partnerApplication.findFirst({
      where: {
        mobile: cleanMobile,
        status: { in: [PartnerApplicationStatus.PENDING, PartnerApplicationStatus.REJECTED] },
      },
      orderBy: { createdAt: 'desc' },
    });

    let resolvedPasswordHash = activeApp?.passwordHash ?? null;
    if (dto.password?.trim()) {
      if (dto.password.trim().length < 8) {
        throw new BadRequestException('Partner login password must be at least 8 characters long.');
      }
      resolvedPasswordHash = await argon2.hash(dto.password.trim());
    } else if (!resolvedPasswordHash && (!existingUser || existingUser.passwordHash === 'OTP_ONLY_MANAGED')) {
      throw new BadRequestException('Please create a Partner login password (minimum 8 characters).');
    }

    const appPayload = {
      mobile: cleanMobile,
      requestedRole: dto.requestedRole as Role,
      advisorType: dto.requestedRole === 'ADVISOR' ? dto.advisorType ?? null : null,
      name: dto.name.trim(),
      email: dto.email?.trim() ? dto.email.trim().toLowerCase() : null,
      passwordHash: resolvedPasswordHash,
      pincode: dto.pincode?.trim() || null,
      postOffice: dto.postOffice?.trim() || null,
      village: dto.village?.trim() || null,
      district: dto.district?.trim() || null,
      state: dto.state?.trim() || null,
      qualification: dto.qualification?.trim() || null,
      specialization: dto.specialization?.trim() || null,
      yearsExperience: typeof dto.yearsExperience === 'number' ? dto.yearsExperience : null,
      bio: dto.bio?.trim() || null,
      panNumber: cleanPan,
      panDocUrl: dto.panDocUrl.trim(),
      aadhaarLast4: cleanAadhaarLast4,
      aadhaarDocUrl: dto.aadhaarDocUrl.trim(),
      aadhaarBackUrl: dto.aadhaarBackUrl?.trim() || null,
      gstin: cleanGstin,
      gstDocUrl: dto.gstDocUrl?.trim() || null,
      bankAccountHolderName: dto.bankAccountHolderName.trim(),
      bankAccountNumber: dto.bankAccountNumber.trim(),
      bankIfsc: cleanIfsc,
      upiId: dto.upiId?.trim() || null,
      chequeDocUrl: dto.chequeDocUrl.trim(),
      photoUrl: dto.photoUrl.trim(),
      storeName: dto.requestedRole === 'SELLER' ? dto.storeName?.trim() || null : null,
      legalName: dto.requestedRole === 'SELLER' ? dto.legalName?.trim() || null : null,
      sellerType: dto.requestedRole === 'SELLER' ? resolvedSellerType : null,
      pickupAddress: dto.requestedRole === 'SELLER' ? dto.pickupAddress?.trim() || null : null,
      isPhoneVerified: true,
      termsAcceptedAt: new Date(),
      status: PartnerApplicationStatus.PENDING,
      rejectionReason: null,
      applicantUserId: existingUser?.id || null,
      reviewedById: null,
      reviewedAt: null,
    };

    const savedApp = activeApp
      ? await this.prisma.partnerApplication.update({
          where: { id: activeApp.id },
          data: {
            ...appPayload,
            resubmissionCount: activeApp.resubmissionCount + 1,
          },
        })
      : await this.prisma.partnerApplication.create({
          data: appPayload,
        });

    this.partnerVerifiedMap.delete(cleanMobile);

    // Mark any verified signup lead as self-completed once Partner application is submitted
    if (this.prisma.verifiedSignupLead?.updateMany) {
      await this.prisma.verifiedSignupLead
        .updateMany({
          where: { mobile: cleanMobile, status: VerifiedLeadStatus.OTP_CONFIRMED },
          data: {
            status: VerifiedLeadStatus.COMPLETED_SELF,
            capturedName: savedApp.name,
            capturedEmail: savedApp.email,
            pincode: savedApp.pincode,
            district: savedApp.district,
            state: savedApp.state,
            village: savedApp.village,
            intendedRole: dto.requestedRole as Role,
            convertedAt: new Date(),
          },
        })
        .catch(() => {});
    }

    // Notify Admins + log audit trail (non-blocking)
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] }, deletedAt: null },
        select: { id: true },
      });
      if (admins.length > 0) {
        await this.prisma.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            type: 'SYSTEM',
            title: `New ${dto.requestedRole} Partner Application`,
            body: `${savedApp.name} (+91 ${cleanMobile})${existingUser?.kingId ? ` [Existing King ID: ${existingUser.kingId}]` : ''} submitted KYC documents for ${dto.requestedRole} approval.`,
          })),
        });
      }
      await this.prisma.isoAuditLog.create({
        data: {
          action: activeApp ? 'PARTNER_APPLICATION_RESUBMITTED' : 'PARTNER_APPLICATION_SUBMITTED',
          actorId: existingUser?.id || savedApp.id,
          actorName: savedApp.name,
          details: {
            applicationId: savedApp.id,
            mobile: cleanMobile,
            requestedRole: dto.requestedRole,
            existingKingId: existingUser?.kingId || null,
          },
        },
      });
    } catch {}

    this.whatsappBotService
      .sendDirectTextMessage(
        cleanMobile,
        `🌾 FarmsKing Partner Application Received!\n\nHello ${savedApp.name}, your application for *${dto.requestedRole}* role is now *Under Admin Review*.\nYou will receive a confirmation once approved.${existingUser?.kingId ? `\nExisting King ID: ${existingUser.kingId} (preserved upon approval)` : ''}`,
      )
      .catch(() => {});

    return {
      success: true,
      applicationId: savedApp.id,
      status: savedApp.status,
      requestedRole: savedApp.requestedRole,
      existingKingId: existingUser?.kingId || null,
      message: activeApp
        ? 'Updated Partner profile & KYC documents resubmitted for Admin approval.'
        : 'Partner application submitted! You can sign in to the Partner Dashboard once an Admin approves your account.',
    };
  }

  async sendEmailOtp(email: string, otpCode: string) {
    const success = await this.emailService.sendEmailOtp(email, otpCode);
    return { success, message: success ? 'Email OTP sent directly via Gmail SMTP.' : 'Failed to send Email OTP.' };
  }

  private getActiveUserRoles(user: { role: Role; roles?: Role[] | null; deactivatedRoles?: Role[] | null }): Role[] {
    return getActiveRolesList(user);
  }

  private assertPortalAllowed(
    user: { role: Role; roles?: Role[] | null; deactivatedRoles?: Role[] | null } | null,
    portal?: 'CLIENT' | 'PARTNER',
  ) {
    const check = evaluatePortalEligibility(user, portal);
    if (!check.allowed) {
      throw new ForbiddenException(check.reason);
    }
  }

  private async assertPortalAccessOrPartnerStatus(
    cleanMobile: string,
    user: any,
    portal: 'CLIENT' | 'PARTNER' | undefined,
    includeEditableAppOnProof: boolean,
  ) {
    const check = evaluatePortalEligibility(user, portal);
    if (check.allowed) return;

    if (portal === 'PARTNER') {
      const activeRoles = user ? getActiveRolesList(user) : [];
      if (activeRoles.some((r) => ADMIN_STAFF_ROLES.includes(r) || FARM_STAFF_ROLES.includes(r))) {
        throw new ForbiddenException(check.reason);
      }

      const latestApp = await this.prisma.partnerApplication?.findFirst({
        where: { mobile: cleanMobile },
        orderBy: { createdAt: 'desc' },
      });

      if (latestApp?.status === PartnerApplicationStatus.PENDING) {
        throw new ForbiddenException({
          statusCode: 403,
          error: 'Forbidden',
          code: 'PARTNER_APPLICATION_PENDING',
          status: 'PENDING',
          applicationId: latestApp.id,
          requestedRole: latestApp.requestedRole,
          mobile: cleanMobile,
          existingKingId: user?.kingId || null,
          message:
            'Your Partner application is currently under Admin review. You will be able to log into the Partner Dashboard as soon as an Admin approves it.',
        });
      }

      if (latestApp?.status === PartnerApplicationStatus.REJECTED) {
        if (includeEditableAppOnProof) {
          this.partnerVerifiedMap.set(cleanMobile, Date.now() + 30 * 60 * 1000);
        }
        throw new ForbiddenException({
          statusCode: 403,
          error: 'Forbidden',
          code: 'PARTNER_APPLICATION_REJECTED',
          status: 'REJECTED',
          applicationId: latestApp.id,
          requestedRole: latestApp.requestedRole,
          rejectionReason: latestApp.rejectionReason || 'Documents or profile details need correction.',
          mobile: cleanMobile,
          existingKingId: user?.kingId || null,
          ...(includeEditableAppOnProof
            ? {
                partnerUploadToken: this.signPartnerUploadToken(cleanMobile),
                existingApplication: this.sanitizePartnerApplication(latestApp),
                existingUserSummary: user ? this.buildPartnerUserSummary(user) : null,
              }
            : {}),
          message:
            'Your Partner application was rejected. Tap "Edit & Resubmit Application" to update your profile/KYC documents.',
        });
      }

      if (includeEditableAppOnProof) {
        this.partnerVerifiedMap.set(cleanMobile, Date.now() + 30 * 60 * 1000);
        if (user) {
          await this.recordVerifiedSignupLead({
            mobile: cleanMobile,
            sourceChannel: 'PARTNER_SIGNUP_OTP',
            portal: 'PARTNER',
            capturedName: user.name || undefined,
            capturedEmail: user.email || undefined,
            pincode: user.pincode || undefined,
            district: user.district || undefined,
            state: user.state || undefined,
            village: user.village || undefined,
            convertedUserId: user.id,
            forceUnread: true,
          });
        }
      }
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        code: 'PARTNER_ROLE_NOT_GRANTED',
        mobile: cleanMobile,
        existingKingId: user?.kingId || null,
        ...(includeEditableAppOnProof
          ? {
              partnerUploadToken: this.signPartnerUploadToken(cleanMobile),
              existingUserSummary: user ? this.buildPartnerUserSummary(user) : null,
            }
          : {}),
        message: check.reason,
      });
    }

    throw new ForbiddenException(check.reason);
  }

  async googleLogin(dto: GoogleLoginDto) {
    let verifiedEmail: string | undefined;
    let verifiedName = dto.name;
    let verifiedPhoto = dto.photoUrl;
    let verifiedGoogleSub: string | undefined;

    // 1. Verify Firebase ID Token cryptographically if provided
    if (dto.idToken) {
      try {
        const decoded = await getAuth().verifyIdToken(dto.idToken);
        if (decoded?.email && decoded.email_verified !== false) {
          verifiedEmail = decoded.email;
          verifiedName = decoded.name || verifiedName;
          verifiedPhoto = decoded.picture || verifiedPhoto;
          verifiedGoogleSub = decoded.uid;
        }
      } catch (fbErr: any) {
        console.warn('[GoogleLogin] Firebase idToken verification note:', fbErr?.message);
      }
    }

    // 2. Verify Google OAuth Access Token directly with Google UserInfo if not already verified
    if (!verifiedEmail && dto.accessToken) {
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${dto.accessToken}` },
        });
        if (response.ok) {
          const userInfo = await response.json();
          if (userInfo?.email && userInfo.email_verified !== false) {
            const infoEmail = String(userInfo.email);
            verifiedEmail = infoEmail;
            verifiedName = userInfo.name || userInfo.given_name || infoEmail.split('@')[0] || verifiedName;
            verifiedPhoto = userInfo.picture || verifiedPhoto;
            verifiedGoogleSub = userInfo.sub || verifiedGoogleSub;
          }
        }
      } catch (err: any) {
        console.warn('[GoogleLogin] Google userinfo verification note:', err?.message);
      }
    }

    if (!verifiedEmail) {
      throw new UnauthorizedException('A valid verified Google sign-in token is required.');
    }

    const cleanEmail = verifiedEmail.trim().toLowerCase();

    let user = await this.prisma.user.findFirst({
      where: {
        email: cleanEmail,
        AND: [{ OR: [{ deletedAt: null }, { isPermanentlyBlocked: true }] }],
      },
    });

    if (!user) {
      this.assertPortalAllowed(null, dto.portal);
      const kingId = await generateUniqueKingId(this.prisma);
      const passwordHash = await argon2.hash(crypto.randomBytes(24).toString('hex'));
      user = await this.prisma.user.create({
        data: {
          kingId,
          email: cleanEmail,
          googleId: verifiedGoogleSub || dto.googleId || null,
          name: verifiedName || cleanEmail.split('@')[0],
          photoUrl: verifiedPhoto || null,
          mobile: `G_${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          passwordHash,
          role: Role.CUSTOMER,
          roles: [Role.CUSTOMER],
          isPhoneVerified: false,
          isEmailVerified: true,
        },
      });
    } else {
      if (user.isPermanentlyBlocked) {
        throw new UnauthorizedException('Your account has been permanently blocked. Please contact Admin Support.');
      }
      if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
        const minutesLeft = Math.ceil((new Date(user.lockoutUntil).getTime() - Date.now()) / (1000 * 60));
        throw new UnauthorizedException(`Account is locked for ${minutesLeft} minutes. Please try later.`);
      }
      const cleanUserMobile = (user.mobile || '').replace(/\D/g, '').slice(-10);
      if (dto.portal && cleanUserMobile) {
        await this.assertPortalAccessOrPartnerStatus(cleanUserMobile, user, dto.portal, false);
      } else {
        this.assertPortalAllowed(user, dto.portal);
      }
      if (!user.googleId && (verifiedGoogleSub || dto.googleId)) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: verifiedGoogleSub || dto.googleId, isEmailVerified: true },
        });
      } else if (user.isEmailVerified !== true) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { isEmailVerified: true },
        });
      } else if (verifiedPhoto && !user.photoUrl) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { photoUrl: verifiedPhoto },
        });
      }
    }

    const { passwordHash: _ph, securityAnswerHash: _sah, ...safeUser } = user;
    const requiresMobileVerification = !user.mobile || user.mobile.startsWith('G_');
    const isProfileIncomplete = requiresMobileVerification || !user.village || !user.pincode;

    return {
      ...this.buildAuthResponse(safeUser as any),
      requiresMobileVerification,
      isProfileIncomplete,
      missingFields: [
        ...(requiresMobileVerification ? ['mobile'] : []),
        ...(!user.pincode ? ['pincode'] : []),
        ...(!user.village ? ['village'] : []),
      ],
    };
  }

  async linkGoogleAccount(currentUser: AuthUser, dto: LinkGoogleDto) {
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

    const oldEmail = dbUser.email;
    const isEmailChanged = oldEmail && oldEmail.trim().toLowerCase() !== cleanEmail;

    const updated = await this.prisma.user.update({
      where: { id: currentUser.id },
      data: {
        email: cleanEmail,
        isEmailVerified: true,
        ...(dto.googleId ? { googleId: dto.googleId } : {}),
        ...(dto.photoUrl && !dbUser.photoUrl ? { photoUrl: dto.photoUrl } : {}),
      },
      select: SAFE_USER_SELECT,
    });

    // 1. If previous email is being disconnected/replaced, send security disconnect notification to old email
    if (isEmailChanged) {
      this.emailService
        .sendEmailDisconnectedNotification(
          oldEmail,
          dbUser.name || 'FarmsKing Member',
          dbUser.mobile || '',
          cleanEmail,
        )
        .catch((e: any) => console.warn('[AuthService] Old email disconnect notification error:', e?.message));
    }

    // 2. Send email attached alert to newly linked email with masked mobile (First 2 digits + xxxxx + Last 3 digits)
    if (dbUser.mobile && !dbUser.mobile.startsWith('G_')) {
      this.emailService
        .sendEmailLinkedNotification(
          cleanEmail,
          dbUser.name || 'FarmsKing Member',
          dbUser.mobile,
        )
        .catch((e: any) => console.warn('[AuthService] Email linked notification error:', e?.message));
    }

    return {
      success: true,
      message: isEmailChanged
        ? 'Previous Google account disconnected and new account linked successfully!'
        : 'Google account successfully linked!',
      user: updated,
    };
  }

  async unlinkGoogleAccount(currentUser: AuthUser) {
    const dbUser = await this.prisma.user.findUnique({ where: { id: currentUser.id } });
    if (!dbUser) throw new NotFoundException('User not found.');

    if (!dbUser.mobile || dbUser.mobile.startsWith('G_')) {
      throw new ConflictException('You cannot unlink Google account because you do not have a registered mobile number. Please link a mobile number first.');
    }

    const oldEmail = dbUser.email;

    const updated = await this.prisma.user.update({
      where: { id: currentUser.id },
      data: {
        email: null,
        isEmailVerified: false,
        googleId: null,
      },
      select: SAFE_USER_SELECT,
    });

    // Send disconnect notification to the old email
    if (oldEmail) {
      this.emailService
        .sendEmailDisconnectedNotification(
          oldEmail,
          dbUser.name || 'FarmsKing Member',
          dbUser.mobile || '',
        )
        .catch((e: any) => console.warn('[AuthService] Email disconnect notification error:', e?.message));
    }

    return {
      success: true,
      message: 'Google account disconnected successfully.',
      user: updated,
    };
  }

  async sendMobileLinkOtp(user: AuthUser, mobile: string) {
    const rawDigits = mobile.replace(/\D/g, '');
    const cleanMobile = rawDigits.slice(-10);
    if (cleanMobile.length !== 10) {
      throw new BadRequestException('Please enter a valid 10-digit mobile number.');
    }

    // Check if the mobile is already registered or permanently blocked
    const existingMobileUser = await this.prisma.user.findFirst({
      where: {
        id: { not: user.id },
        OR: [
          { mobile: cleanMobile },
          { mobile: `+91${cleanMobile}` },
          { mobile: { endsWith: cleanMobile } },
        ],
        AND: [{ OR: [{ deletedAt: null }, { isPermanentlyBlocked: true }] }],
      },
      select: { id: true, kingId: true, role: true, isPermanentlyBlocked: true },
    });

    if (existingMobileUser?.isPermanentlyBlocked) {
      throw new UnauthorizedException(
        'This mobile number has been permanently blocked by Admin. You cannot sign in or sign up again. Please contact Admin Support.',
      );
    }

    const isPlaceholderGoogleAccount = !user.mobile || user.mobile.startsWith('G_');
    if (existingMobileUser) {
      if (!isPlaceholderGoogleAccount || ADMIN_STAFF_ROLES.includes(existingMobileUser.role)) {
        throw new BadRequestException(
          `This mobile number is already attached to King ID: ${existingMobileUser.kingId}. Please use a different number.`,
        );
      }
    }

    const isDev = process.env.NODE_ENV !== 'production';
    const otpCode = isDev ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    this.mobileLinkOtpStore.set(user.id, {
      otp: otpCode,
      mobile: cleanMobile,
      expiresAt: Date.now() + 10 * 60 * 1000,
      userId: user.id,
    });

    let sent = false;
    if (!isDev) {
      try {
        const waRes = await this.whatsappBotService.sendOtpMessage(cleanMobile, otpCode);
        sent = Boolean(waRes?.success);
      } catch {
        sent = false;
      }
    }

    return {
      success: true,
      message: isDev
        ? 'Localhost test mode active. Use code: 123456'
        : sent
        ? 'OTP sent via WhatsApp successfully!'
        : 'OTP generated (WhatsApp bot offline).',
      devOtp: isDev ? '123456' : undefined,
    };
  }

  async verifyMobileLinkOtp(user: AuthUser, dto: { mobile: string; otp: string; password?: string }) {
    const rawDigits = dto.mobile.replace(/\D/g, '');
    const cleanMobile = rawDigits.slice(-10);
    if (cleanMobile.length !== 10) {
      throw new BadRequestException('Please enter a valid 10-digit mobile number.');
    }

    const stored = this.mobileLinkOtpStore.get(user.id);
    if (!stored || stored.mobile !== cleanMobile) {
      throw new BadRequestException('OTP expired or not requested for this mobile number.');
    }

    if (Date.now() > stored.expiresAt) {
      this.mobileLinkOtpStore.delete(user.id);
      throw new BadRequestException('OTP has expired. Please request a new OTP.');
    }

    const isDev = process.env.NODE_ENV !== 'production';
    if (stored.otp !== dto.otp.trim() && (!isDev || dto.otp.trim() !== '123456')) {
      throw new BadRequestException('Invalid OTP. Please check the 6-digit code and try again.');
    }

    this.mobileLinkOtpStore.delete(user.id);
    return this.completeMobileLinkForUser(user, cleanMobile, dto.password);
  }

  async firebaseMobileLink(user: AuthUser, dto: { idToken: string; password?: string }) {
    if (!dto.idToken) {
      throw new BadRequestException('Firebase ID Token is required.');
    }
    let decodedToken: any;
    try {
      decodedToken = await getAuth().verifyIdToken(dto.idToken);
    } catch (err: any) {
      throw new UnauthorizedException('Invalid Firebase ID Token: ' + (err?.message || 'Verification failed.'));
    }

    const phone = decodedToken?.phone_number;
    if (!phone) {
      throw new UnauthorizedException('No verified phone number attached to this Firebase credential.');
    }

    const cleanMobile = String(phone).replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      throw new BadRequestException('Please verify a valid 10-digit Indian mobile number.');
    }

    return this.completeMobileLinkForUser(user, cleanMobile, dto.password);
  }

  private async completeMobileLinkForUser(user: AuthUser, cleanMobile: string, rawPassword?: string) {
    let passwordHash: string | undefined = undefined;
    if (rawPassword && rawPassword.trim().length >= 4) {
      passwordHash = await argon2.hash(rawPassword.trim());
    }

    // Check if an existing account already owns or is blocked on this mobile number
    const existingMobileUser = await this.prisma.user.findFirst({
      where: {
        id: { not: user.id },
        OR: [
          { mobile: cleanMobile },
          { mobile: `+91${cleanMobile}` },
          { mobile: { endsWith: cleanMobile } },
        ],
        AND: [{ OR: [{ deletedAt: null }, { isPermanentlyBlocked: true }] }],
      },
    });

    if (existingMobileUser?.isPermanentlyBlocked) {
      throw new UnauthorizedException(
        'This mobile number has been permanently blocked by Admin. You cannot sign in or sign up again. Please contact Admin Support.',
      );
    }

    const isPlaceholderGoogleAccount = !user.mobile || user.mobile.startsWith('G_');
    if (existingMobileUser && (!isPlaceholderGoogleAccount || ADMIN_STAFF_ROLES.includes(existingMobileUser.role))) {
      throw new BadRequestException(
        `This mobile number is already attached to King ID: ${existingMobileUser.kingId}. Please use a different number.`,
      );
    }

    let targetUser: any;
    let isMerged = false;

    if (existingMobileUser) {
      // User verified OTP for existing mobile account -> Merge Google email onto existing mobile user
      const currentUserData = await this.prisma.user.findUnique({ where: { id: user.id } });

      targetUser = await this.prisma.user.update({
        where: { id: existingMobileUser.id },
        data: {
          ...(currentUserData?.email ? { email: currentUserData.email, isEmailVerified: true } : {}),
          ...(currentUserData?.googleId && !existingMobileUser.googleId ? { googleId: currentUserData.googleId } : {}),
          ...(currentUserData?.photoUrl && !existingMobileUser.photoUrl ? { photoUrl: currentUserData.photoUrl } : {}),
          isPhoneVerified: true,
          ...(passwordHash ? { passwordHash } : {}),
        },
        select: SAFE_USER_SELECT,
      });

      // Transfer any farms, orders, expenses, addresses created on Google account to existing mobile account
      await this.reassignUserRecords(user.id, existingMobileUser.id);

      // Soft-delete the temporary Google account freeing up unique googleId if needed
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          deletedAt: new Date(),
          googleId: null,
        },
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

    // 1. If user previously had a registered mobile, and now updated to a new mobile, send email security notice
    const previousMobile = user.mobile;
    const isMobileUpdated = previousMobile && !previousMobile.startsWith('G_') && previousMobile !== cleanMobile;

    if (isMobileUpdated && targetUser.email) {
      this.emailService
        .sendMobileUpdatedEmailNotification(
          targetUser.email,
          targetUser.name || 'FarmsKing Member',
          previousMobile,
          cleanMobile,
        )
        .catch((e: any) => console.warn('[AuthService] sendMobileUpdatedEmailNotification error:', e?.message));
    } else if (targetUser.email && cleanMobile) {
      // First time mobile linked to Google account
      this.emailService
        .sendEmailLinkedNotification(
          targetUser.email,
          targetUser.name || 'FarmsKing Member',
          cleanMobile,
        )
        .catch((e: any) => console.warn('[AuthService] sendEmailLinkedNotification error:', e?.message));
    }

    // 2. If existing mobile account previously had another email that is replaced, notify old email
    if (existingMobileUser && existingMobileUser.email && existingMobileUser.email.toLowerCase() !== targetUser.email?.toLowerCase()) {
      this.emailService
        .sendEmailDisconnectedNotification(
          existingMobileUser.email,
          existingMobileUser.name || 'FarmsKing Member',
          cleanMobile,
          targetUser.email,
        )
        .catch((e: any) => console.warn('[AuthService] sendEmailDisconnectedNotification error:', e?.message));
    }

    const authResponse = this.buildAuthResponse(targetUser);

    return {
      success: true,
      message: isMerged
        ? 'Mobile verified and linked to your existing FarmsKing account!'
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
        AND: [{ OR: [{ deletedAt: null }, { isPermanentlyBlocked: true }] }],
      },
    });

    if (existing?.isPermanentlyBlocked) {
      throw new UnauthorizedException(
        'This mobile number has been permanently blocked by Admin. You cannot sign in or sign up again. Please contact Admin Support.',
      );
    }

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

    if (existing) {
      throw new ConflictException(
        'This mobile number is already registered with FarmsKing. Please sign in using Mobile OTP.',
      );
    }

    let isFirebasePhoneVerified = false;
    if (dto.firebaseIdToken) {
      try {
        const decoded = await getAuth().verifyIdToken(dto.firebaseIdToken);
        const tokenDigits = (decoded?.phone_number || '').replace(/\D/g, '').slice(-10);
        isFirebasePhoneVerified = Boolean(tokenDigits && cleanMobileNum && tokenDigits === cleanMobileNum);
      } catch {
        throw new UnauthorizedException('Invalid or expired Firebase phone verification token.');
      }
    }

    const serverVerifiedUntil = cleanMobileNum ? this.verifiedOtpMobiles.get(cleanMobileNum) : undefined;
    const isServerOtpVerified = Boolean(serverVerifiedUntil && serverVerifiedUntil > Date.now());
    const isPhoneVerified = isFirebasePhoneVerified || isServerOtpVerified;

    if (!isPhoneVerified && process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Please verify your mobile number via server OTP before completing registration.');
    }
    if (isServerOtpVerified && cleanMobileNum) {
      this.verifiedOtpMobiles.delete(cleanMobileNum);
    }

    let user: any;

    // New User -> Create User with generated King ID
    const kingId = await generateUniqueKingId(this.prisma);
    user = await this.prisma.user.create({
      data: {
        kingId,
        mobile: cleanMobileNum || dto.mobile.trim(),
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
        isPhoneVerified,
        ...(dto.termsAccepted ? { termsAcceptedAt: new Date(), privacyPolicyVersion: '2026.11' } : {}),
      },
      select: SAFE_USER_SELECT,
    });

    await provisionInviteCoupon(this.prisma, user.id);

    if (referrer) {
      await provisionReferralWelcomeCoupon(this.prisma, user.id, referrer.id);
    }

    // Auto-credit Welcome Signup Bonus to new user and Referral Income to referrer (if referred)
    await this.walletService.ensureWelcomeBonus(user.id);

    const finalUser = await this.applyAccountType(user.id, dto.accountType);
    const createdAccount = (finalUser ?? user) as any;

    await this.markVerifiedLeadCompleted(dto.mobile, createdAccount, VerifiedLeadStatus.COMPLETED_SELF);

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
   * Stage 2: Self-Upgrade & Trader/Shopkeeper Registration.
   *
   * Registers a new trader account or upgrades an existing customer/guest account
   * with the `TRADER` and `CUSTOMER` roles, assigns an 8-digit King ID if not present,
   * hashes the chosen password with argon2, and automatically links all existing
   * `UnifiedParty` ledger records across different farmers matching this mobile number.
   *
   * @param dto - Object containing mobile, password, name, shopName, mandiName, location
   * @returns Complete authentication response with JWT access token and sanitized user profile
   */
  async registerTrader(dto: RegisterTraderDto) {
    const rawMobileDigits = dto.mobile.replace(/\D/g, '');
    const cleanMobileNum = rawMobileDigits.slice(-10);

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { mobile: dto.mobile.trim() },
          { mobile: cleanMobileNum },
          { mobile: `+91${cleanMobileNum}` },
          { mobile: { endsWith: cleanMobileNum } },
        ],
        deletedAt: null,
      },
    });

    const passwordHash = await argon2.hash(dto.password);
    let user: any;

    if (existing) {
      if (!existing.passwordHash) {
        throw new ConflictException(
          'This mobile number is already registered. Please sign in with Mobile OTP first.',
        );
      }
      const passwordMatches = await argon2.verify(existing.passwordHash, dto.password);
      if (!passwordMatches) {
        throw new ConflictException(
          'This mobile number is already registered with FarmsKing. Please sign in with Mobile OTP or provide your existing password.',
        );
      }
      const activeExisting = getActiveRolesList(existing);
      if (activeExisting.some((r) => ADMIN_STAFF_ROLES.includes(r) || r === Role.SUPERVISOR || r === Role.LABOUR)) {
        throw new ConflictException(
          'Farm Staff and Admin Panel Staff accounts cannot register as a Trader on the same mobile number.',
        );
      }
      const updatedRoles = Array.from(new Set([...(existing.roles || []), Role.TRADER, Role.CUSTOMER]));
      const nextPrimary =
        activeExisting.includes(Role.FARMER) || activeExisting.includes(Role.GARDENER)
          ? existing.role
          : Role.TRADER;
      user = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          name: dto.name || existing.name,
          farmName: dto.shopName || existing.farmName,
          farmAddress: dto.mandiName || existing.farmAddress,
          district: dto.district || existing.district,
          state: dto.state || existing.state,
          gstin: dto.gstin?.trim().toUpperCase() || existing.gstin,
          panNumber: dto.panNumber?.trim().toUpperCase() || existing.panNumber,
          mandiLicenseNo: dto.mandiLicenseNo?.trim() || existing.mandiLicenseNo,
          aadhaarLast4: dto.aadhaarLast4?.trim() || existing.aadhaarLast4,
          ...(dto.termsAccepted ? { termsAcceptedAt: new Date(), privacyPolicyVersion: '2026.11' } : {}),
          role: nextPrimary,
          roles: updatedRoles,
        },
        select: SAFE_USER_SELECT,
      });
    } else {
      const kingId = await generateUniqueKingId(this.prisma);
      user = await this.prisma.user.create({
        data: {
          kingId,
          mobile: cleanMobileNum,
          passwordHash,
          name: dto.name,
          farmName: dto.shopName || null,
          farmAddress: dto.mandiName || null,
          district: dto.district || null,
          state: dto.state || null,
          gstin: dto.gstin?.trim().toUpperCase() || null,
          panNumber: dto.panNumber?.trim().toUpperCase() || null,
          mandiLicenseNo: dto.mandiLicenseNo?.trim() || null,
          aadhaarLast4: dto.aadhaarLast4?.trim() || null,
          termsAcceptedAt: dto.termsAccepted ? new Date() : null,
          privacyPolicyVersion: dto.termsAccepted ? '2026.11' : null,
          role: Role.TRADER,
          roles: [Role.CUSTOMER, Role.TRADER],
        },
        select: SAFE_USER_SELECT,
      });
    }

    // Auto-link any existing UnifiedParty records that match this mobile number
    try {
      await this.prisma.unifiedParty.updateMany({
        where: {
          OR: [
            { mobile: cleanMobileNum },
            { mobile: dto.mobile.trim() },
            { mobile: `+91${cleanMobileNum}` },
          ],
          userId: null,
        },
        data: {
          userId: user.id,
        },
      });
    } catch (err) {
      console.warn('Could not auto-link UnifiedParty in registerTrader:', err);
    }

    return this.buildAuthResponse(user);
  }

  /**
   * Farmer/Gardener signup grants FARMER or GARDENER role plus FREE plan record.
   * NOTE: Role.AGENT is NOT automatically assigned. Only Super Admin/Admin can assign BUSINESS_PARTNER.
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
    let identifier = (dto.mobile ?? '').trim();
    const cleanPassword = (dto.password ?? '').trim();



    // If identifier looks like a mobile number with spaces/country code, clean it up
    if (/^(\+91|91|0)?\s*\d{10}$/.test(identifier)) {
      identifier = identifier.replace(/\D/g, '').slice(-10);
    }

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { mobile: identifier },
          ...(identifier.length === 10 ? [{ mobile: `+91${identifier}` }] : []),
          { kingId: identifier },
        ],
        AND: [{ OR: [{ deletedAt: null }, { isPermanentlyBlocked: true }] }],
      },
    });

    if (!user) {
      if (dto.portal === 'PARTNER' && /^\d{10}$/.test(identifier)) {
        const pendingOrRejected = await this.prisma.partnerApplication?.findFirst({
          where: {
            mobile: identifier,
            status: { in: [PartnerApplicationStatus.PENDING, PartnerApplicationStatus.REJECTED] },
          },
          orderBy: { createdAt: 'desc' },
        });
        if (pendingOrRejected) {
          const pwValid =
            Boolean(pendingOrRejected.passwordHash) &&
            (await argon2.verify(pendingOrRejected.passwordHash!, cleanPassword).catch(() => false));
          if (!pwValid) {
            throw new UnauthorizedException('Invalid mobile number or password.');
          }
          if (pendingOrRejected.status === PartnerApplicationStatus.PENDING) {
            throw new ForbiddenException({
              statusCode: 403,
              error: 'Forbidden',
              code: 'PARTNER_APPLICATION_PENDING',
              status: 'PENDING',
              applicationId: pendingOrRejected.id,
              requestedRole: pendingOrRejected.requestedRole,
              mobile: identifier,
              message:
                'Your Partner application is currently under Admin review. You can sign in once an Admin approves it.',
            });
          }
          this.partnerVerifiedMap.set(identifier, Date.now() + 30 * 60 * 1000);
          throw new ForbiddenException({
            statusCode: 403,
            error: 'Forbidden',
            code: 'PARTNER_APPLICATION_REJECTED',
            status: 'REJECTED',
            applicationId: pendingOrRejected.id,
            requestedRole: pendingOrRejected.requestedRole,
            rejectionReason: pendingOrRejected.rejectionReason || 'Profile or KYC documents need correction.',
            mobile: identifier,
            existingApplication: this.sanitizePartnerApplication(pendingOrRejected),
            message:
              'Your Partner application was rejected. Tap "Edit & Resubmit Application" to fix and re-apply.',
          });
        }
      }
      throw new UnauthorizedException('Invalid mobile number or password.');
    }

    if (user.isPermanentlyBlocked) {
      throw new UnauthorizedException(
        'Your account has been permanently blocked by Admin. You cannot sign in or sign up again. Please contact Admin Support.',
      );
    }

    // Check Partner portal application status even if existing Client account doesn't have Partner role yet
    const activeRoles = this.getActiveUserRoles(user);
    const hasPasswordPortalRole = activeRoles.some(
      (r) => PARTNER_PORTAL_ROLES.includes(r) || ADMIN_STAFF_ROLES.includes(r),
    );
    if (dto.portal === 'PARTNER' && !activeRoles.some((r) => PARTNER_PORTAL_ROLES.includes(r) || ADMIN_STAFF_ROLES.includes(r))) {
      await this.assertPortalAccessOrPartnerStatus(user.mobile.replace(/\D/g, '').slice(-10), user, 'PARTNER', false);
    }
    if (dto.portal === 'CLIENT' || !hasPasswordPortalRole) {
      throw new ForbiddenException(
        'Farmer, Gardener, Labour Worker, Supervisor, Trader, and Buyer accounts must sign in using Mobile OTP.',
      );
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

    const cleanUserMobile = (user.mobile || '').replace(/\D/g, '').slice(-10);
    if (dto.portal && cleanUserMobile) {
      await this.assertPortalAccessOrPartnerStatus(cleanUserMobile, user, dto.portal, false);
    } else {
      this.assertPortalAllowed(user, dto.portal);
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

    this.userSessionService.clearAllSessions(stored.userId);
    this.otpStore.delete(mobile);

    return {
      success: true,
      message: 'Your password has been updated successfully! Please log in with your new password.',
    };
  }

  async firebaseForgotPasswordReset(idToken: string, newPassword: string) {
    if (!newPassword || newPassword.trim().length < 8) {
      throw new BadRequestException('New password must be at least 8 characters.');
    }
    
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(idToken);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired Firebase ID token.');
    }

    const phone = decodedToken.phone_number;
    if (!phone) {
      throw new BadRequestException('Firebase token does not contain a valid phone number.');
    }

    const cleanMobile = phone.replace(/\D/g, '').slice(-10);

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { mobile: cleanMobile },
          { mobile: `+91${cleanMobile}` },
          { mobile: { endsWith: cleanMobile } },
        ],
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('No active account found with this verified mobile number.');
    }

    const passwordHash = await argon2.hash(newPassword.trim());
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        isPermanentlyBlocked: false,
      },
    });

    this.userSessionService.clearAllSessions(user.id);

    return {
      success: true,
      message: 'Your password has been updated successfully! Please log in with your new password.',
    };
  }

  async logout(userId: string, sessionId?: string) {
    if (sessionId) {
      this.userSessionService.logoutSession(userId, sessionId);
    }
    return {
      success: true,
      message: 'Signed out successfully.',
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

  async verifyPassword(userId: string, password: string) {
    const cleanPassword = (password ?? '').trim();
    if (!cleanPassword) {
      return {
        success: false,
        message: 'Please enter your account password.',
      };
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
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
        message: 'Invalid password. Please enter your correct password.',
      };
    }

    return {
      success: true,
      message: 'Password verified successfully.',
    };
  }

  // ─── OTP-based Login & Passwordless Onboarding ─────────────────────────
  private findActiveUserByMobile(cleanMobile: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { mobile: cleanMobile },
          { mobile: `+91${cleanMobile}` },
          { mobile: { endsWith: cleanMobile } },
        ],
        AND: [{ OR: [{ deletedAt: null }, { isPermanentlyBlocked: true }] }],
      },
    });
  }

  private async ensureLabourWorkerProvisioned(cleanMobile: string) {
    const worker = await this.prisma.labourWorker.findFirst({
      where: {
        OR: [
          { mobile: cleanMobile },
          { mobile: `+91${cleanMobile}` },
          { mobile: { endsWith: cleanMobile } },
        ],
        deletedAt: null,
      },
    });
    if (!worker) return null;

    const kingId = await generateUniqueKingId(this.prisma);
    const passwordHash = await argon2.hash(crypto.randomBytes(24).toString('hex'));
    const user = await this.prisma.user.create({
      data: {
        kingId,
        mobile: cleanMobile,
        passwordHash,
        name: worker.name || `User ${cleanMobile.slice(-4)}`,
        role: Role.CUSTOMER,
        roles: [Role.CUSTOMER],
        isPhoneVerified: true,
      },
    });

    try {
      await this.walletService.ensureWelcomeBonus(user.id);
    } catch (e) {
      console.warn('[Wallet] Worker auto-provision wallet notice:', e);
    }

    await this.prisma.labourWorker.updateMany({
      where: {
        OR: [
          { mobile: cleanMobile },
          { mobile: `+91${cleanMobile}` },
          { mobile: { endsWith: cleanMobile } },
        ],
        userId: null,
      },
      data: { userId: user.id },
    });

    return user;
  }

  /** Step 1: Send 6-digit OTP for login / passwordless registration */
  async sendLoginOtp(mobile: string, portal?: 'CLIENT' | 'PARTNER') {
    const rawDigits = mobile.replace(/\D/g, '');
    const cleanMobile = rawDigits.slice(-10);
    if (cleanMobile.length !== 10) {
      throw new BadRequestException('Please enter a valid 10-digit mobile number.');
    }

    const user = await this.findActiveUserByMobile(cleanMobile);

    // Check lockout/block if user already exists
    if (user?.isPermanentlyBlocked) {
      throw new UnauthorizedException('Your account has been permanently blocked. Please contact Admin Support.');
    }
    if (user?.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
      const msLeft = new Date(user.lockoutUntil).getTime() - Date.now();
      const minutesLeft = Math.ceil(msLeft / (1000 * 60));
      throw new UnauthorizedException(`Account is locked for ${minutesLeft} minutes. Please try later.`);
    }

    let existingWorker = false;
    if (!user) {
      const worker = await this.prisma.labourWorker.findFirst({
        where: {
          OR: [
            { mobile: cleanMobile },
            { mobile: `+91${cleanMobile}` },
            { mobile: { endsWith: cleanMobile } },
          ],
          deletedAt: null,
        },
        select: { id: true },
      });
      existingWorker = Boolean(worker);
    }

    if (portal === 'PARTNER') {
      const candidateUser = user ?? (existingWorker ? { role: Role.CUSTOMER, roles: [Role.CUSTOMER] } : null);
      const eligibility = evaluatePortalEligibility(candidateUser, 'PARTNER');
      if (!eligibility.allowed) {
        const candidateRoles = candidateUser ? getActiveRolesList(candidateUser) : [];
        const hasForbiddenStaffRole = candidateRoles.some(
          (r) => ADMIN_STAFF_ROLES.includes(r) || FARM_STAFF_ROLES.includes(r),
        );
        const existingApp = !hasForbiddenStaffRole
          ? await this.prisma.partnerApplication?.findFirst({
              where: {
                mobile: cleanMobile,
                status: { in: [PartnerApplicationStatus.PENDING, PartnerApplicationStatus.REJECTED] },
              },
              orderBy: { createdAt: 'desc' },
            })
          : null;
        if (!existingApp) {
          throw new ForbiddenException({
            statusCode: 403,
            error: 'Forbidden',
            code: 'PARTNER_ROLE_NOT_GRANTED',
            mobile: cleanMobile,
            existingKingId: user?.kingId || null,
            message: eligibility.reason,
          });
        }
      }
    } else {
      this.assertPortalAllowed(
        user ?? (existingWorker ? { role: Role.CUSTOMER, roles: [Role.CUSTOMER] } : null),
        portal,
      );
    }

    const isDev = process.env.NODE_ENV !== 'production';
    const otpCode = isDev ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    this.loginOtpStore.set(cleanMobile, {
      otp: otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    let waSent = false;
    if (!isDev) {
      try {
        const waResult = await this.whatsappBotService.sendOtpMessage(cleanMobile, otpCode);
        waSent = Boolean(waResult?.success);
      } catch {
        waSent = false;
      }
    }

    return {
      success: true,
      isNewUser: !user && !existingWorker,
      waSent,
      message: isDev
        ? 'Localhost test mode active. Use code: 123456'
        : waSent
        ? 'OTP sent via WhatsApp!'
        : 'Verification code generated. Please verify to continue.',
      devOtp: isDev ? '123456' : undefined,
      universalTestOtp: isDev ? '123456' : undefined,
    };
  }

  /** Step 2: Verify OTP and return auth session (or flag as isNewUser) */
  async verifyLoginOtp(
    mobile: string,
    otp: string,
    portal?: 'CLIENT' | 'PARTNER',
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const rawDigits = mobile.replace(/\D/g, '');
    const cleanMobile = rawDigits.slice(-10);

    const isDev = process.env.NODE_ENV !== 'production';
    const stored = this.loginOtpStore.get(cleanMobile);
    const isTestCode = isDev && otp.trim() === '123456';
    const isStoredMatch = Boolean(stored && stored.otp === otp.trim());
    const isBypassMatch = isTestCode || isStoredMatch;

    if (!stored && !isTestCode) {
      throw new BadRequestException('OTP expired or not requested. Please request a new OTP.');
    }

    if (stored && Date.now() > stored.expiresAt && !isTestCode) {
      this.loginOtpStore.delete(cleanMobile);
      throw new BadRequestException('OTP has expired. Please request a new OTP.');
    }

    if (!isBypassMatch) {
      throw new BadRequestException('Invalid OTP. Please check the 6-digit code.');
    }

    if (stored) {
      this.loginOtpStore.delete(cleanMobile);
    }

    let user = await this.findActiveUserByMobile(cleanMobile);

    // Auto-provision Labour Worker added by Farmer cleanly on verified OTP login
    if (!user && portal !== 'PARTNER') {
      user = await this.ensureLabourWorkerProvisioned(cleanMobile);
    }

    // If still new user, allow onboarding ONLY on Client portal and record short-lived OTP verification proof
    if (!user) {
      await this.assertPortalAccessOrPartnerStatus(cleanMobile, null, portal, true);
      this.verifiedOtpMobiles.set(cleanMobile, Date.now() + 15 * 60 * 1000);
      await this.recordVerifiedSignupLead({
        mobile: cleanMobile,
        sourceChannel: 'CLIENT_LOGIN_OTP',
        portal: portal || 'CLIENT',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      });
      return {
        isNewUser: true,
        mobile: cleanMobile,
        message: 'Mobile number verified. Please select your role to proceed.',
      };
    }

    if (user.isPermanentlyBlocked) {
      throw new UnauthorizedException('Your account has been permanently blocked. Please contact Admin Support.');
    }
    if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.lockoutUntil).getTime() - Date.now()) / (1000 * 60));
      throw new UnauthorizedException(`Account is locked for ${minutesLeft} minutes. Please try later.`);
    }

    await this.assertPortalAccessOrPartnerStatus(cleanMobile, user, portal, true);

    // Reset any failed login attempts on successful OTP login
    if (user.failedLoginAttempts > 0 || user.lockoutUntil !== null || !user.isPhoneVerified) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockoutUntil: null, isPhoneVerified: true },
      });
    }

    const { passwordHash: _ph, securityAnswerHash: _sah, ...safeUser } = user;
    return {
      isNewUser: false,
      ...this.buildAuthResponse(safeUser as any),
    };
  }

  /** Step 3: Complete registration for new OTP-verified users */
  async completeOtpRegistration(dto: {
    mobile: string;
    name?: string;
    role: 'CUSTOMER' | 'FARMER' | 'GARDENER';
    portal?: 'CLIENT' | 'PARTNER';
  }) {
    if (dto.portal === 'PARTNER') {
      throw new ForbiddenException(
        'New Partner registration (Seller, Crop Doctor, Garden Advisor, or Sales Manager) requires Admin approval. Please apply via Partner Signup or switch to User Login.',
      );
    }

    const rawDigits = dto.mobile.replace(/\D/g, '');
    const cleanMobile = rawDigits.slice(-10);
    if (cleanMobile.length !== 10) {
      throw new BadRequestException('Please enter a valid 10-digit mobile number.');
    }

    const verifiedUntil = this.verifiedOtpMobiles.get(cleanMobile);
    if (!verifiedUntil || Date.now() > verifiedUntil) {
      this.verifiedOtpMobiles.delete(cleanMobile);
      throw new UnauthorizedException('Please verify your mobile number with OTP before creating an account.');
    }

    const existing = await this.findActiveUserByMobile(cleanMobile);

    if (existing?.isPermanentlyBlocked) {
      this.verifiedOtpMobiles.delete(cleanMobile);
      throw new UnauthorizedException(
        'This mobile number has been permanently blocked by Admin. You cannot sign in or sign up again. Please contact Admin Support.',
      );
    }

    if (existing) {
      this.verifiedOtpMobiles.delete(cleanMobile);
      throw new ConflictException(
        'This mobile number is already registered with FarmsKing. Please sign in using Mobile OTP.',
      );
    }

    this.verifiedOtpMobiles.delete(cleanMobile);

    const chosenRole: Role =
      dto.role === 'FARMER' ? Role.FARMER :
      dto.role === 'GARDENER' ? Role.GARDENER :
      Role.CUSTOMER;

    // Customer role is ALWAYS included by default for all standard platform users
    const assignedRoles: Role[] =
      chosenRole === Role.CUSTOMER ? [Role.CUSTOMER] : [Role.CUSTOMER, chosenRole];

    const kingId = await generateUniqueKingId(this.prisma);
    const passwordHash = await argon2.hash(crypto.randomBytes(24).toString('hex'));

    const newUser = await this.prisma.user.create({
      data: {
        kingId,
        mobile: cleanMobile,
        name: dto.name?.trim() || `User ${cleanMobile.slice(-4)}`,
        role: chosenRole,
        roles: assignedRoles,
        passwordHash,
        isPhoneVerified: true,
      },
    });

    try {
      await this.walletService.ensureWelcomeBonus(newUser.id);
    } catch (e) {
      console.warn('[Wallet] Auto wallet provision notice:', e);
    }

    await this.markVerifiedLeadCompleted(cleanMobile, newUser, VerifiedLeadStatus.COMPLETED_SELF);

    // 1. Send Welcome In-App Notification
    try {
      await this.prisma.notification.create({
        data: {
          userId: newUser.id,
          type: 'SYSTEM',
          title: '🌱 Welcome to FarmsKing!',
          body: `Welcome ${newUser.name}! Your King ID is ${kingId}. Your account with ${chosenRole} profile is active.`,
        },
      });
    } catch (notifErr: any) {
      console.warn('[Notifications] Welcome notification notice:', notifErr?.message);
    }

    // 2. Send Welcome Direct WhatsApp message if WhatsApp bot is active
    try {
      const welcomeMsg = `🌱 Welcome to FarmsKing, ${newUser.name}!\n\nYour account is active.\nKing ID: ${kingId}\nRole: ${chosenRole}\n\nStart exploring certified agri inputs, live mandi rates, and AI diagnostics at https://farmsking.in.\n\n- FARMSKING TECHNOLOGIES PRIVATE LIMITED`;
      this.whatsappBotService.sendDirectTextMessage(cleanMobile, welcomeMsg).catch(() => {});
    } catch (waErr: any) {
      console.warn('[WhatsApp] Welcome WhatsApp message notice:', waErr?.message);
    }

    const { passwordHash: _ph, securityAnswerHash: _sah, ...safeUser } = newUser;
    return {
      isNewUser: false,
      ...this.buildAuthResponse(safeUser as any),
    };
  }

  async firebaseLogin(
    idToken: string,
    portal?: 'CLIENT' | 'PARTNER',
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    if (!idToken) throw new BadRequestException('Firebase ID Token is required.');
    let decodedToken: any;
    try {
      decodedToken = await getAuth().verifyIdToken(idToken);
    } catch (err: any) {
      throw new UnauthorizedException('Invalid Firebase ID Token: ' + (err?.message || 'Verification failed.'));
    }

    const phone = decodedToken.phone_number;
    if (!phone) throw new UnauthorizedException('No phone number attached to this Firebase credential.');

    const cleanMobile = phone.replace(/\D/g, '').slice(-10);

    let user = await this.findActiveUserByMobile(cleanMobile);

    if (!user && portal !== 'PARTNER') {
      user = await this.ensureLabourWorkerProvisioned(cleanMobile);
    }

    // If user does not exist yet, allow seamless onboarding / role selection ONLY on Client portal
    if (!user) {
      await this.assertPortalAccessOrPartnerStatus(cleanMobile, null, portal, true);
      this.verifiedOtpMobiles.set(cleanMobile, Date.now() + 15 * 60 * 1000);
      await this.recordVerifiedSignupLead({
        mobile: cleanMobile,
        sourceChannel: 'FIREBASE_PHONE_OTP',
        portal: portal || 'CLIENT',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      });
      return {
        isNewUser: true,
        mobile: cleanMobile,
        message: 'Mobile number verified via Firebase. Please select your role to proceed.',
      };
    }

    // Check account lockout / block BEFORE portal role checks
    if (user.isPermanentlyBlocked) {
      throw new UnauthorizedException(
        'Your account has been permanently blocked by Admin. You cannot sign in or sign up again. Please contact Admin Support.',
      );
    }

    await this.assertPortalAccessOrPartnerStatus(cleanMobile, user, portal, true);

    if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
      const msLeft = new Date(user.lockoutUntil).getTime() - Date.now();
      const minutesLeft = Math.ceil(msLeft / (1000 * 60));
      throw new UnauthorizedException(`Account is locked for ${minutesLeft} minutes. Please try later.`);
    }

    // Reset any failed login attempts on successful OTP login
    if (user.failedLoginAttempts > 0 || user.lockoutUntil !== null || !user.isPhoneVerified) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockoutUntil: null, isPhoneVerified: true },
      });
    }

    const { passwordHash: _ph, securityAnswerHash: _sah, ...safeUser } = user;
    return {
      isNewUser: false,
      ...this.buildAuthResponse(safeUser as any),
    };
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

  /**
   * Send a verification link to update / verify user's email address
   */
  async sendEmailVerificationLink(userId: string, targetEmail: string, origin?: string) {
    if (!targetEmail || !targetEmail.includes('@') || !targetEmail.includes('.')) {
      throw new BadRequestException('Please provide a valid email address.');
    }

    const cleanEmail = targetEmail.trim().toLowerCase();

    // Check if another active user is already using this email
    const existing = await this.prisma.user.findFirst({
      where: {
        email: cleanEmail,
        id: { not: userId },
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException('This email address is already registered to another account.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Generate secure token (24-hour expiration)
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        pendingEmail: cleanEmail,
        emailVerifyToken: token,
        emailVerifyExpires: expires,
      },
    });

    // Compute base URL
    let baseUrl = 'https://farmsking.in';
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      baseUrl = origin.replace(/\/$/, '');
    } else if (process.env.LIVE_SITE_URL) {
      baseUrl = process.env.LIVE_SITE_URL.replace(/\/$/, '');
    }
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

    const sent = await this.emailService.sendEmailVerificationLink(
      cleanEmail,
      user.name || 'FarmsKing Member',
      verifyUrl,
    );

    if (!sent) {
      throw new BadRequestException('Failed to deliver verification email. Please check SMTP settings.');
    }

    return {
      success: true,
      message: `Verification link sent to ${cleanEmail}. Please check your inbox and click the link to activate.`,
      pendingEmail: cleanEmail,
    };
  }

  /**
   * Verify token from email link, activate the email, and mark verified
   */
  async verifyEmailToken(token: string) {
    if (!token || typeof token !== 'string') {
      throw new BadRequestException('Verification token is missing.');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        emailVerifyToken: token.trim(),
        emailVerifyExpires: { gte: new Date() },
      },
    });

    if (!user || !user.pendingEmail) {
      return {
        success: false,
        message: 'This verification link is invalid, expired, or has already been used.',
      };
    }

    const newVerifiedEmail = user.pendingEmail;

    // Check conflict again
    const conflict = await this.prisma.user.findFirst({
      where: {
        email: newVerifiedEmail,
        id: { not: user.id },
        deletedAt: null,
      },
    });

    if (conflict) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          pendingEmail: null,
          emailVerifyToken: null,
          emailVerifyExpires: null,
        },
      });
      return {
        success: false,
        message: 'This email is already in use by another account.',
      };
    }

    // Activate email and set isEmailVerified: true
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email: newVerifiedEmail,
        isEmailVerified: true,
        pendingEmail: null,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
      select: SAFE_USER_SELECT,
    });

    return {
      success: true,
      message: 'Email address verified and activated successfully!',
      email: updated.email,
      user: updated,
    };
  }
}
