import type { AuthUser } from '../../common/types/auth-user.type';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    listConversations(user: AuthUser): Promise<{
        partner: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
            photoUrl: string | null;
        };
        lastMessage: {
            id: string;
            createdAt: Date;
            isRead: boolean;
            readAt: Date | null;
            senderId: string;
            receiverId: string;
            content: string;
        } | null;
        unreadCount: number;
        isOnline: boolean;
    }[]>;
    getUnreadCount(user: AuthUser): Promise<{
        count: number;
    }>;
    getMessages(user: AuthUser, userId: string): Promise<{
        id: string;
        createdAt: Date;
        isRead: boolean;
        readAt: Date | null;
        senderId: string;
        receiverId: string;
        content: string;
    }[]>;
    isUserOnline(userId: string): {
        isOnline: boolean;
    };
    getMessagesBetweenAsAdmin(userAId: string, userBId: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        isRead: boolean;
        readAt: Date | null;
        senderId: string;
        receiverId: string;
        content: string;
    }[]>;
    sendMessage(user: AuthUser, dto: SendMessageDto): Promise<{
        id: string;
        createdAt: Date;
        isRead: boolean;
        readAt: Date | null;
        senderId: string;
        receiverId: string;
        content: string;
    }>;
}
