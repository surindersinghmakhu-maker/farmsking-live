import { WhatsappBotService } from './whatsapp.service';
import { WhatsAppGroupSyncService } from './whatsapp-group-sync.service';
export declare class WhatsappBotController {
    private readonly whatsappService;
    private readonly groupSyncService;
    constructor(whatsappService: WhatsappBotService, groupSyncService: WhatsAppGroupSyncService);
    getAllGroups(): Promise<never[]>;
    resetQr(): Promise<{
        success: boolean;
    }>;
    getStatus(): Promise<{
        isConnected: boolean;
        message: string;
    }>;
    sendOtp(body: any): Promise<{
        success: boolean;
    }>;
    logout(): Promise<{
        success: boolean;
    }>;
    syncAdvisorGroup(): Promise<{
        success: boolean;
    }>;
    getSyncStatus(): Promise<{
        enabled: boolean;
        groupId: null;
    }>;
}
