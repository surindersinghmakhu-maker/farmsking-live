import { PrismaService } from '../prisma/prisma.service';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { Role } from '@prisma/client';
import { ChatGateway } from '../chat/chat.gateway';
import { NotificationsService } from '../notifications/notifications.service';
export declare class AdminChatService {
    private readonly prisma;
    private readonly chatGateway;
    private readonly notificationsService;
    constructor(prisma: PrismaService, chatGateway: ChatGateway, notificationsService: NotificationsService);
    sendMessage(userId: string, userRole: Role, dto: SendChatMessageDto): Promise<{
        message: string;
        data: any;
    }>;
    getFarmerMessages(farmerId: string): Promise<{
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
    resolveFarmerThread(adminId: string, farmerId: string, notes?: string): Promise<{
        message: string;
        data: any;
    }>;
}
