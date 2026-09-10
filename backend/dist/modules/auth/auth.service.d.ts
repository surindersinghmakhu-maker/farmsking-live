import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordStartDto } from './dto/forgot-password-start.dto';
import { ForgotPasswordVerifyDto } from './dto/forgot-password-verify.dto';
import { ForgotPasswordResetDto } from './dto/forgot-password-reset.dto';
import { WhatsappBotService } from '../whatsapp/whatsapp.service';
import { WhatsAppGroupSyncService } from '../whatsapp/whatsapp-group-sync.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly whatsappBotService;
    private readonly whatsappGroupSyncService;
    private readonly otpStore;
    constructor(prisma: PrismaService, jwtService: JwtService, whatsappBotService: WhatsappBotService, whatsappGroupSyncService: WhatsAppGroupSyncService);
    sendWhatsAppOtp(mobile: string, otpCode: string): Promise<{
        success: boolean;
        message: string;
    }>;
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            mobile: string;
            role: Role;
        } & Record<string, unknown>;
    }>;
    private applyAccountType;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            mobile: string;
            role: Role;
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
    private buildAuthResponse;
}
