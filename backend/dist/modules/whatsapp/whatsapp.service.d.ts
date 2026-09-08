import { OnModuleInit } from '@nestjs/common';
export declare class WhatsappBotService implements OnModuleInit {
    private readonly logger;
    private socket;
    private qrCodeDataUrl;
    private isConnected;
    onModuleInit(): Promise<void>;
    private initWhatsAppSocket;
    getQrCodeStatus(): {
        isConnected: boolean;
        qrCodeDataUrl: string | null;
    };
    unlinkSession(): Promise<boolean>;
    sendOtpMessage(mobileNumber: string, otpCode: string): Promise<boolean>;
    formatJid(mobileNumber: string): string;
    sendDirectTextMessage(mobileNumber: string, text: string): Promise<boolean>;
    getGroupParticipants(groupJid: string): Promise<string[]>;
    getAllGroups(): Promise<{
        jid: string;
        name: string;
        memberCount: number;
    }[]>;
    addParticipantToGroup(groupJid: string, mobileNumber: string, farmerName?: string): Promise<{
        success: boolean;
        status?: string;
    }>;
    removeParticipantFromGroup(groupJid: string, mobileNumber: string, farmerName?: string): Promise<{
        success: boolean;
        status?: string;
    }>;
}
