import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterTraderDto } from './dto/register-trader.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { FirebaseLoginDto } from './dto/firebase-login.dto';
import { LinkGoogleDto } from './dto/link-google.dto';
import { SendLoginOtpDto, VerifyLoginOtpDto, SendWhatsAppOtpDto, SendEmailOtpDto, SendMobileLinkOtpDto } from './dto/otp.dto';
import { ForgotPasswordStartDto } from './dto/forgot-password-start.dto';
import { ForgotPasswordVerifyDto } from './dto/forgot-password-verify.dto';
import { ForgotPasswordResetDto } from './dto/forgot-password-reset.dto';
import type { AuthUser } from '../../common/types/auth-user.type';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    sendWhatsAppOtp(body: SendWhatsAppOtpDto): Promise<{
        success: import("../whatsapp/whatsapp.service").WhatsAppMessageResult;
        message: string;
    }>;
    sendLoginOtp(body: SendLoginOtpDto): Promise<{
        success: boolean;
        message: string;
        devOtp: string | undefined;
    }>;
    verifyLoginOtp(body: VerifyLoginOtpDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            mobile: string;
            role: import(".prisma/client").Role;
        } & Record<string, unknown>;
        sessionMeta: {
            sessionId: string;
            totalActiveSessions: number;
            hasMultipleLogins: boolean;
            warningMessage: string | undefined;
            evictedOldest: boolean;
        };
    }>;
    sendEmailOtp(body: SendEmailOtpDto): Promise<{
        success: boolean;
        message: string;
    }>;
    googleLogin(dto: GoogleLoginDto): Promise<{
        isProfileIncomplete: boolean;
        missingFields: string[];
        accessToken: string;
        user: {
            id: string;
            mobile: string;
            role: import(".prisma/client").Role;
        } & Record<string, unknown>;
        sessionMeta: {
            sessionId: string;
            totalActiveSessions: number;
            hasMultipleLogins: boolean;
            warningMessage: string | undefined;
            evictedOldest: boolean;
        };
    }>;
    firebaseLogin(body: FirebaseLoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            mobile: string;
            role: import(".prisma/client").Role;
        } & Record<string, unknown>;
        sessionMeta: {
            sessionId: string;
            totalActiveSessions: number;
            hasMultipleLogins: boolean;
            warningMessage: string | undefined;
            evictedOldest: boolean;
        };
    }>;
    linkGoogleAccount(user: AuthUser, dto: LinkGoogleDto): Promise<{
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
    unlinkGoogleAccount(user: AuthUser): Promise<{
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
    sendMobileLinkOtp(user: AuthUser, body: SendMobileLinkOtpDto): Promise<{
        success: boolean;
        message: string;
        devOtp: string | undefined;
    }>;
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            mobile: string;
            role: import(".prisma/client").Role;
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
            role: import(".prisma/client").Role;
        } & Record<string, unknown>;
        sessionMeta: {
            sessionId: string;
            totalActiveSessions: number;
            hasMultipleLogins: boolean;
            warningMessage: string | undefined;
            evictedOldest: boolean;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            mobile: string;
            role: import(".prisma/client").Role;
        } & Record<string, unknown>;
        sessionMeta: {
            sessionId: string;
            totalActiveSessions: number;
            hasMultipleLogins: boolean;
            warningMessage: string | undefined;
            evictedOldest: boolean;
        };
    }>;
    logoutOtherSessions(user: AuthUser & {
        sessionId?: string;
    }): Promise<{
        success: boolean;
        message: string;
        loggedOutCount: number;
    }>;
    verifyPassword(user: AuthUser | null, body: {
        password?: string;
        mobile?: string;
    }): Promise<{
        success: boolean;
        message: string;
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
    firebaseForgotPasswordReset(body: {
        idToken: string;
        newPassword: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
