import { WhatsappBotService } from './whatsapp.service';
import { WhatsAppGroupSyncService } from './whatsapp-group-sync.service';
import type { Response } from 'express';
export declare class WhatsappBotController {
    private readonly whatsappService;
    private readonly groupSyncService;
    constructor(whatsappService: WhatsappBotService, groupSyncService: WhatsAppGroupSyncService);
    getQrStatus(): {
        isConnected: boolean;
        qrCodeDataUrl: string | null;
    };
    getAllGroups(): Promise<{
        groups: {
            jid: string;
            name: string;
            memberCount: number;
        }[];
        total: number;
    }>;
    getQrWebPage(res: Response): Response<any, Record<string, any>>;
    sendTestOtp(body: {
        mobile: string;
        otp: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    unlinkWhatsAppSession(): Promise<{
        success: boolean;
        message: string;
    }>;
    syncGroupMembers(): Promise<{
        success: boolean;
        message: string;
        result: import("./whatsapp-group-sync.service").GroupSyncResult;
    }>;
    getGroupStatus(): Promise<{
        groupJid: string;
        isWhatsAppConnected: boolean;
        whatsappGroupSyncEnabled: boolean;
        info: string;
    }>;
}
