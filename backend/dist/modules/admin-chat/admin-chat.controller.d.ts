import { AdminChatService } from './admin-chat.service';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
export declare class AdminChatController {
    private readonly adminChatService;
    constructor(adminChatService: AdminChatService);
    sendMessage(req: any, dto: SendChatMessageDto): Promise<{
        message: string;
        data: any;
    }>;
    getFarmerMessages(req: any): Promise<{
        messages: any;
        unreadCount: any;
    }>;
    getAdminConversations(): Promise<any[]>;
    getAdminFarmerThread(farmerId: string): Promise<{
        farmer: {
            id: string;
            mobile: string;
            name: string;
            village: string | null;
            district: string | null;
        } | null;
        messages: any;
    }>;
    resolveFarmerThread(req: any, farmerId: string, notes?: string): Promise<{
        message: string;
        data: any;
    }>;
}
