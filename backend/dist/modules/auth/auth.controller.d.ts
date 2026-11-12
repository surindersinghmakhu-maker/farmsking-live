import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterTraderDto } from './dto/register-trader.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { FirebaseLoginDto } from './dto/firebase-login.dto';
import { LinkGoogleDto } from './dto/link-google.dto';
import { SendLoginOtpDto, VerifyLoginOtpDto, SendWhatsAppOtpDto, SendEmailOtpDto, SendMobileLinkOtpDto, VerifyMobileLinkOtpDto, FirebaseMobileLinkDto, CompleteOtpRegistrationDto, SendMobileOtpDto, VerifyMobileOtpDto } from './dto/otp.dto';
import { PartnerApplyDto } from './dto/partner-apply.dto';
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
    sendRegisterOtp(body: SendMobileOtpDto): Promise<{
        success: boolean;
        mobile: string;
        sentViaWhatsApp: boolean;
        message: string;
        devOtp: string | undefined;
        expiresInSeconds: number;
    }>;
    private extractClientMeta;
    verifyRegisterOtp(body: VerifyMobileOtpDto, req: any): Promise<{
        success: boolean;
        verified: boolean;
        mobile: string;
        message: string;
    }>;
    sendPartyOtp(user: AuthUser, body: SendMobileOtpDto): Promise<{
        success: boolean;
        mobile: string;
        sentViaWhatsApp: boolean;
        message: string;
        devOtp: string | undefined;
        expiresInSeconds: number;
    }>;
    verifyPartyOtp(user: AuthUser, body: VerifyMobileOtpDto): Promise<{
        success: boolean;
        verified: boolean;
        mobile: string;
        kingId: string | null;
        registeredName: string | null;
        message: string;
    }>;
    sendPartnerSignupOtp(body: SendMobileOtpDto): Promise<{
        success: boolean;
        mobile: string;
        sentViaWhatsApp: boolean;
        message: string;
        devOtp: string | undefined;
        expiresInSeconds: number;
    }>;
    verifyPartnerSignupOtp(body: VerifyMobileOtpDto, req: any): Promise<{
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
    applyForPartnerRole(dto: PartnerApplyDto): Promise<{
        success: boolean;
        applicationId: string;
        status: import(".prisma/client").$Enums.PartnerApplicationStatus;
        requestedRole: import(".prisma/client").$Enums.Role;
        existingKingId: string | null;
        message: string;
    }>;
    uploadPartnerKycDocument(partnerUploadToken: string, file: any): Promise<{
        success: boolean;
        fileUrl: string;
        provider: string;
    }>;
    sendLoginOtp(body: SendLoginOtpDto): Promise<{
        success: boolean;
        isNewUser: boolean;
        waSent: boolean;
        message: string;
        devOtp: string | undefined;
        universalTestOtp: string | undefined;
    }>;
    verifyLoginOtp(body: VerifyLoginOtpDto, req: any): Promise<{
        isNewUser: boolean;
        mobile: string;
        message: string;
    } | {
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
        isNewUser: boolean;
        mobile?: undefined;
        message?: undefined;
    }>;
    completeOtpRegistration(body: CompleteOtpRegistrationDto): Promise<{
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
        isNewUser: boolean;
    }>;
    sendEmailOtp(body: SendEmailOtpDto): Promise<{
        success: boolean;
        message: string;
    }>;
    googleLogin(dto: GoogleLoginDto): Promise<{
        requiresMobileVerification: boolean;
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
    firebaseLogin(body: FirebaseLoginDto, req: any): Promise<{
        isNewUser: boolean;
        mobile: any;
        message: string;
    } | {
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
        isNewUser: boolean;
        mobile?: undefined;
        message?: undefined;
    }>;
    linkGoogleAccount(user: AuthUser, dto: LinkGoogleDto): Promise<{
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
    unlinkGoogleAccount(user: AuthUser): Promise<{
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
    sendEmailVerification(user: AuthUser, body: {
        email: string;
        origin?: string;
    }, headerOrigin?: string): Promise<{
        success: boolean;
        message: string;
        pendingEmail: string;
    }>;
    verifyEmail(body: {
        token: string;
    }): Promise<{
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
    verifyEmailGet(token: string): Promise<{
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
    sendMobileLinkOtp(user: AuthUser, body: SendMobileLinkOtpDto): Promise<{
        success: boolean;
        message: string;
        devOtp: string | undefined;
    }>;
    verifyMobileLinkOtp(user: AuthUser, dto: VerifyMobileLinkOtpDto): Promise<{
        success: boolean;
        message: string;
        isMerged: boolean;
        user: any;
        accessToken: string;
    }>;
    firebaseMobileLink(user: AuthUser, dto: FirebaseMobileLinkDto): Promise<{
        success: boolean;
        message: string;
        isMerged: boolean;
        user: any;
        accessToken: string;
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
    logout(user: AuthUser & {
        sessionId?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    logoutOtherSessions(user: AuthUser & {
        sessionId?: string;
    }): Promise<{
        success: boolean;
        message: string;
        loggedOutCount: number;
    }>;
    verifyPassword(user: AuthUser, body: {
        password?: string;
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
