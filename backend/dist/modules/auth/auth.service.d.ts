import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordStartDto } from './dto/forgot-password-start.dto';
import { ForgotPasswordVerifyDto } from './dto/forgot-password-verify.dto';
import { ForgotPasswordResetDto } from './dto/forgot-password-reset.dto';
import type { AuthUser } from '../../common/types/auth-user.type';
import { WhatsappBotService } from '../whatsapp/whatsapp.service';
import { WhatsAppGroupSyncService } from '../whatsapp/whatsapp-group-sync.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { WalletService } from '../wallet/wallet.service';
import { UserSessionService } from './user-session.service';
import { EmailService } from '../email/email.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly whatsappBotService;
    private readonly whatsappGroupSyncService;
    private readonly appSettingsService;
    private readonly walletService;
    private readonly userSessionService;
    private readonly emailService;
    private readonly otpStore;
    private readonly mobileLinkOtpStore;
    private readonly loginOtpStore;
    constructor(prisma: PrismaService, jwtService: JwtService, whatsappBotService: WhatsappBotService, whatsappGroupSyncService: WhatsAppGroupSyncService, appSettingsService: AppSettingsService, walletService: WalletService, userSessionService: UserSessionService, emailService: EmailService);
    sendWhatsAppOtp(mobile: string, otpCode: string): Promise<{
        success: boolean;
        message: string;
    }>;
    sendEmailOtp(email: string, otpCode: string): Promise<{
        success: boolean;
        message: string;
    }>;
    googleLogin(dto: {
        email?: string;
        name?: string;
        photoUrl?: string;
        googleId?: string;
        accessToken?: string;
    }): Promise<{
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
    linkGoogleAccount(currentUser: AuthUser, dto: {
        email: string;
        name?: string;
        photoUrl?: string;
        googleId?: string;
    }): Promise<{
        success: boolean;
        message: string;
        user: {
            id: string;
            kingId: string | null;
            mobile: string;
            role: import(".prisma/client").$Enums.Role;
            roles: import(".prisma/client").$Enums.Role[];
            deactivatedRoles: import(".prisma/client").$Enums.Role[];
            name: string;
            email: string | null;
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
            createdAt: Date;
        };
    }>;
    unlinkGoogleAccount(currentUser: AuthUser): Promise<{
        success: boolean;
        message: string;
        user: {
            id: string;
            kingId: string | null;
            mobile: string;
            role: import(".prisma/client").$Enums.Role;
            roles: import(".prisma/client").$Enums.Role[];
            deactivatedRoles: import(".prisma/client").$Enums.Role[];
            name: string;
            email: string | null;
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
    logoutOtherSessions(userId: string, currentSessionId?: string): Promise<{
        success: boolean;
        message: string;
        loggedOutCount: number;
    }>;
    verifyPassword(identifier: string, password: string): Promise<{
        success: boolean;
        message: string;
    }>;
    sendLoginOtp(mobile: string): Promise<{
        success: boolean;
        message: string;
        devOtp: string | undefined;
    }>;
    verifyLoginOtp(mobile: string, otp: string): Promise<{
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
    firebaseLogin(idToken: string): Promise<{
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
    private buildAuthResponse;
}
