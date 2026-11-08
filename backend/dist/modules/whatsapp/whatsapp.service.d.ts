import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
export interface WhatsAppMessageResult {
    success: boolean;
    messageId?: string;
    error?: string;
    provider?: string;
}
export declare class WhatsappBotService implements OnModuleInit {
    private readonly configService;
    private readonly prisma;
    private readonly appSettingsService;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService, appSettingsService: AppSettingsService);
    onModuleInit(): Promise<void>;
    formatIndianMobile(mobile: string): string;
    getQrCodeStatus(): Promise<{
        isConnected: boolean;
        activeProvider: string;
        verifiedSender: string;
        message: string;
    }>;
    logout(): {
        success: boolean;
        message: string;
    };
    sendDirectTextMessage(mobile: string, text: string): Promise<WhatsAppMessageResult>;
    sendOtpMessage(mobile: string, otp: string): Promise<WhatsAppMessageResult>;
    sendOrderInvoice(mobile: string, orderNumber: string, amount: number, trackingUrl?: string): Promise<WhatsAppMessageResult>;
    sendMandiRatesBroadcast(groupJid: string, ratesSummary: string): Promise<WhatsAppMessageResult>;
    formatJid(mobile: string): string;
    getGroupParticipants(groupJid: string): Promise<string[]>;
    addParticipantToGroup(groupJid: string, mobile: string, name?: string): Promise<{
        success: boolean;
    }>;
    removeParticipantFromGroup(groupJid: string, mobile: string, name?: string): Promise<{
        success: boolean;
    }>;
    getGroupInfoFromInviteCode(code: string): Promise<{
        id: string;
    }>;
}
