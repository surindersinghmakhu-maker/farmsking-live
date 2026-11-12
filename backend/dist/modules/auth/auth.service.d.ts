import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
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
import { WhatsappBotService } from '../whatsapp/whatsapp.service';
import { WhatsAppGroupSyncService } from '../whatsapp/whatsapp-group-sync.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { WalletService } from '../wallet/wallet.service';
import { UserSessionService } from './user-session.service';
import { EmailService } from '../email/email.service';
import { UploadsService } from '../uploads/uploads.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly whatsappBotService;
    private readonly whatsappGroupSyncService;
    private readonly appSettingsService;
    private readonly walletService;
    private readonly userSessionService;
    private readonly emailService;
    private readonly uploadsService?;
    private readonly otpStore;
    private readonly mobileLinkOtpStore;
    private readonly loginOtpStore;
    private readonly verifiedOtpMobiles;
    private readonly registerOtpStore;
    private readonly partyOtpStore;
    private readonly partnerSignupOtpStore;
    private readonly partnerVerifiedMap;
    constructor(prisma: PrismaService, jwtService: JwtService, whatsappBotService: WhatsappBotService, whatsappGroupSyncService: WhatsAppGroupSyncService, appSettingsService: AppSettingsService, walletService: WalletService, userSessionService: UserSessionService, emailService: EmailService, uploadsService?: UploadsService | undefined);
    sendWhatsAppOtp(mobile: string, otpCode: string): Promise<{
        success: import("../whatsapp/whatsapp.service").WhatsAppMessageResult;
        message: string;
    }>;
    protected normalizeIndianMobile(raw: string): string;
    protected issueMobileOtpChallenge(store: Map<string, {
        otp: string;
        expiresAt: number;
        attempts: number;
    }>, key: string, rawMobile: string, ttlMs?: number, digits?: 4 | 6): Promise<{
        success: boolean;
        mobile: string;
        sentViaWhatsApp: boolean;
        message: string;
        devOtp: string | undefined;
        expiresInSeconds: number;
    }>;
    protected verifyMobileOtpChallenge(store: Map<string, {
        otp: string;
        expiresAt: number;
        attempts: number;
    }>, key: string, providedOtp: string, maxAttempts?: number): boolean;
    sendRegisterOtp(mobile: string): Promise<{
        success: boolean;
        mobile: string;
        sentViaWhatsApp: boolean;
        message: string;
        devOtp: string | undefined;
        expiresInSeconds: number;
    }>;
    private recordVerifiedSignupLead;
    private markVerifiedLeadCompleted;
    verifyRegisterOtp(mobile: string, otp: string, meta?: {
        ipAddress?: string;
        userAgent?: string;
    }): Promise<{
        success: boolean;
        verified: boolean;
        mobile: string;
        message: string;
    }>;
    sendPartyOtp(callerId: string, mobile: string): Promise<{
        success: boolean;
        mobile: string;
        sentViaWhatsApp: boolean;
        message: string;
        devOtp: string | undefined;
        expiresInSeconds: number;
    }>;
    verifyPartyOtp(callerId: string, mobile: string, otp: string): Promise<{
        success: boolean;
        verified: boolean;
        mobile: string;
        kingId: string | null;
        registeredName: string | null;
        message: string;
    }>;
    private sanitizePartnerApplication;
    private buildPartnerUserSummary;
    private assertPartnerEligibilityForExistingUser;
    sendPartnerSignupOtp(mobile: string): Promise<{
        success: boolean;
        mobile: string;
        sentViaWhatsApp: boolean;
        message: string;
        devOtp: string | undefined;
        expiresInSeconds: number;
    }>;
    verifyPartnerSignupOtp(mobile: string, otp: string, meta?: {
        ipAddress?: string;
        userAgent?: string;
    }): Promise<{
        success: boolean;
        verified: boolean;
        mobile: string;
        partnerUploadToken: string;
        existingUserSummary: {
            id: any;
            kingId: any;
            name: any;
            mobile: any;
            email: any;
            activeRoles: import(".prisma/client").$Enums.Role[];
            pincode: any;
            postOffice: any;
            village: any;
            district: any;
            state: any;
            photoUrl: any;
            qualification: any;
            specialization: any;
            yearsExperience: any;
            bio: any;
            panNumber: any;
            panDocUrl: any;
            aadhaarLast4: any;
            aadhaarDocUrl: any;
            aadhaarBackUrl: any;
            gstin: any;
            gstDocUrl: any;
            bankAccountHolderName: any;
            bankAccountNumber: any;
            bankIfsc: any;
            upiId: any;
            chequeDocUrl: any;
        } | null;
        existingApplication: any;
        activePartnerRoles: import(".prisma/client").$Enums.Role[];
        message: string;
    }>;
    private signPartnerUploadToken;
    uploadPartnerKycDocument(partnerUploadToken: string, file: {
        buffer?: Buffer;
        mimetype: string;
        originalname: string;
    }): Promise<{
        success: boolean;
        fileUrl: string;
        provider: string;
    }>;
    applyForPartnerRole(dto: PartnerApplyDto): Promise<{
        success: boolean;
        applicationId: string;
        status: import(".prisma/client").$Enums.PartnerApplicationStatus;
        requestedRole: import(".prisma/client").$Enums.Role;
        existingKingId: string | null;
        message: string;
    }>;
    sendEmailOtp(email: string, otpCode: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private getActiveUserRoles;
    private assertPortalAllowed;
    private assertPortalAccessOrPartnerStatus;
    googleLogin(dto: GoogleLoginDto): Promise<{
        requiresMobileVerification: boolean;
        isProfileIncomplete: boolean;
        missingFields: string[];
        accessToken: string;
        user: {
            id: string;
            mobile: string;
            role: Role;
        } & Record<string, unknown>;
        sessionMeta: {
            sessionId: string;
            totalActiveSessions: number;
            hasMultipleLogins: boolean;
            warningMessage: string | undefined;
            evictedOldest: boolean;
        };
    }>;
    linkGoogleAccount(currentUser: AuthUser, dto: LinkGoogleDto): Promise<{
        success: boolean;
        message: string;
        user: {
            roles: import(".prisma/client").$Enums.Role[];
            deactivatedRoles: import(".prisma/client").$Enums.Role[];
            id: string;
            kingId: string | null;
            mobile: string;
            role: import(".prisma/client").$Enums.Role;
            name: string;
            email: string | null;
            isEmailVerified: boolean;
            pendingEmail: string | null;
            googleId: string | null;
            village: string | null;
            district: string | null;
            state: string | null;
            pincode: string | null;
            postOffice: string | null;
            preferredLanguage: string;
            sprayTankSizeL: number | null;
            soilType: import(".prisma/client").$Enums.SoilType | null;
            waterType: import(".prisma/client").$Enums.WaterType | null;
            upiId: string | null;
            billPrintingAddress: string | null;
            farmName: string | null;
            farmAddress: string | null;
            referredById: string | null;
            isPhoneVerified: boolean;
            createdAt: Date;
        };
    }>;
    unlinkGoogleAccount(currentUser: AuthUser): Promise<{
        success: boolean;
        message: string;
        user: {
            roles: import(".prisma/client").$Enums.Role[];
            deactivatedRoles: import(".prisma/client").$Enums.Role[];
            id: string;
            kingId: string | null;
            mobile: string;
            role: import(".prisma/client").$Enums.Role;
            name: string;
            email: string | null;
            isEmailVerified: boolean;
            pendingEmail: string | null;
            googleId: string | null;
            village: string | null;
            district: string | null;
            state: string | null;
            pincode: string | null;
            postOffice: string | null;
            preferredLanguage: string;
            sprayTankSizeL: number | null;
            soilType: import(".prisma/client").$Enums.SoilType | null;
            waterType: import(".prisma/client").$Enums.WaterType | null;
            upiId: string | null;
            billPrintingAddress: string | null;
            farmName: string | null;
            farmAddress: string | null;
            referredById: string | null;
            isPhoneVerified: boolean;
            createdAt: Date;
        };
    }>;
    sendMobileLinkOtp(user: AuthUser, mobile: string): Promise<{
        success: boolean;
        message: string;
        devOtp: string | undefined;
    }>;
    verifyMobileLinkOtp(user: AuthUser, dto: {
        mobile: string;
        otp: string;
        password?: string;
    }): Promise<{
        success: boolean;
        message: string;
        isMerged: boolean;
        user: any;
        accessToken: string;
    }>;
    firebaseMobileLink(user: AuthUser, dto: {
        idToken: string;
        password?: string;
    }): Promise<{
        success: boolean;
        message: string;
        isMerged: boolean;
        user: any;
        accessToken: string;
    }>;
    private completeMobileLinkForUser;
    private reassignUserRecords;
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            mobile: string;
            role: Role;
        } & Record<string, unknown>;
        sessionMeta: {
            sessionId: string;
            totalActiveSessions: number;
            hasMultipleLogins: boolean;
            warningMessage: string | undefined;
            evictedOldest: boolean;
        };
    }>;
    registerTrader(dto: RegisterTraderDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            mobile: string;
            role: Role;
        } & Record<string, unknown>;
        sessionMeta: {
            sessionId: string;
            totalActiveSessions: number;
            hasMultipleLogins: boolean;
            warningMessage: string | undefined;
            evictedOldest: boolean;
        };
    }>;
    private applyAccountType;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            mobile: string;
            role: Role;
        } & Record<string, unknown>;
        sessionMeta: {
            sessionId: string;
            totalActiveSessions: number;
            hasMultipleLogins: boolean;
            warningMessage: string | undefined;
            evictedOldest: boolean;
        };
    }>;
    forgotPasswordStart(dto: ForgotPasswordStartDto): Promise<{
        success: boolean;
        mobile: string;
        message: string;
    }>;
    forgotPasswordVerify(dto: ForgotPasswordVerifyDto): Promise<{
        success: boolean;
        verified: boolean;
        message: string;
    }>;
    forgotPasswordReset(dto: ForgotPasswordResetDto): Promise<{
        success: boolean;
        message: string;
    }>;
    firebaseForgotPasswordReset(idToken: string, newPassword: string): Promise<{
        success: boolean;
        message: string;
    }>;
    logout(userId: string, sessionId?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    logoutOtherSessions(userId: string, currentSessionId?: string): Promise<{
        success: boolean;
        message: string;
        loggedOutCount: number;
    }>;
    verifyPassword(userId: string, password: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private findActiveUserByMobile;
    private ensureLabourWorkerProvisioned;
    sendLoginOtp(mobile: string, portal?: 'CLIENT' | 'PARTNER'): Promise<{
        success: boolean;
        isNewUser: boolean;
        waSent: boolean;
        message: string;
        devOtp: string | undefined;
        universalTestOtp: string | undefined;
    }>;
    verifyLoginOtp(mobile: string, otp: string, portal?: 'CLIENT' | 'PARTNER', meta?: {
        ipAddress?: string;
        userAgent?: string;
    }): Promise<{
        isNewUser: boolean;
        mobile: string;
        message: string;
    } | {
        accessToken: string;
        user: {
            id: string;
            mobile: string;
            role: Role;
        } & Record<string, unknown>;
        sessionMeta: {
            sessionId: string;
            totalActiveSessions: number;
            hasMultipleLogins: boolean;
            warningMessage: string | undefined;
            evictedOldest: boolean;
        };
        isNewUser: boolean;
        mobile?: undefined;
        message?: undefined;
    }>;
    completeOtpRegistration(dto: {
        mobile: string;
        name?: string;
        role: 'CUSTOMER' | 'FARMER' | 'GARDENER';
        portal?: 'CLIENT' | 'PARTNER';
    }): Promise<{
        accessToken: string;
        user: {
            id: string;
            mobile: string;
            role: Role;
        } & Record<string, unknown>;
        sessionMeta: {
            sessionId: string;
            totalActiveSessions: number;
            hasMultipleLogins: boolean;
            warningMessage: string | undefined;
            evictedOldest: boolean;
        };
        isNewUser: boolean;
    }>;
    firebaseLogin(idToken: string, portal?: 'CLIENT' | 'PARTNER', meta?: {
        ipAddress?: string;
        userAgent?: string;
    }): Promise<{
        isNewUser: boolean;
        mobile: any;
        message: string;
    } | {
        accessToken: string;
        user: {
            id: string;
            mobile: string;
            role: Role;
        } & Record<string, unknown>;
        sessionMeta: {
            sessionId: string;
            totalActiveSessions: number;
            hasMultipleLogins: boolean;
            warningMessage: string | undefined;
            evictedOldest: boolean;
        };
        isNewUser: boolean;
        mobile?: undefined;
        message?: undefined;
    }>;
    private buildAuthResponse;
    sendEmailVerificationLink(userId: string, targetEmail: string, origin?: string): Promise<{
        success: boolean;
        message: string;
        pendingEmail: string;
    }>;
    verifyEmailToken(token: string): Promise<{
        success: boolean;
        message: string;
        email?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        message: string;
        email: string | null;
        user: {
            roles: import(".prisma/client").$Enums.Role[];
            deactivatedRoles: import(".prisma/client").$Enums.Role[];
            id: string;
            kingId: string | null;
            mobile: string;
            role: import(".prisma/client").$Enums.Role;
            name: string;
            email: string | null;
            isEmailVerified: boolean;
            pendingEmail: string | null;
            googleId: string | null;
            village: string | null;
            district: string | null;
            state: string | null;
            pincode: string | null;
            postOffice: string | null;
            preferredLanguage: string;
            sprayTankSizeL: number | null;
            soilType: import(".prisma/client").$Enums.SoilType | null;
            waterType: import(".prisma/client").$Enums.WaterType | null;
            upiId: string | null;
            billPrintingAddress: string | null;
            farmName: string | null;
            farmAddress: string | null;
            referredById: string | null;
            isPhoneVerified: boolean;
            createdAt: Date;
        };
    }>;
}
