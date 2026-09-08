import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordStartDto } from './dto/forgot-password-start.dto';
import { ForgotPasswordVerifyDto } from './dto/forgot-password-verify.dto';
import { ForgotPasswordResetDto } from './dto/forgot-password-reset.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    sendWhatsAppOtp(body: {
        mobile: string;
        otp: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            mobile: string;
            role: import(".prisma/client").Role;
        } & Record<string, unknown>;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            mobile: string;
            role: import(".prisma/client").Role;
        } & Record<string, unknown>;
    }>;
    forgotPasswordStart(dto: ForgotPasswordStartDto): Promise<{
        success: boolean;
        mobile: string;
        message: string;
        devOtp: string | undefined;
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
}
