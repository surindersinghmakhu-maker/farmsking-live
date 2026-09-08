import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { ChatGateway } from './chat.gateway';
export declare class ChatService {
    private readonly prisma;
    private readonly notificationsService;
    private readonly chatGateway;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, chatGateway: ChatGateway);
    assertCanChat(userId: string, userRole: Role, otherUserId: string): Promise<void>;
    sendMessage(sender: AuthUser, receiverId: string, content: string): Promise<{
        id: string;
        createdAt: Date;
        isRead: boolean;
        readAt: Date | null;
        senderId: string;
        receiverId: string;
        content: string;
    }>;
    getMessages(user: AuthUser, otherUserId: string): Promise<{
        id: string;
        createdAt: Date;
        isRead: boolean;
        readAt: Date | null;
        senderId: string;
        receiverId: string;
        content: string;
    }[]>;
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
    getUnreadCount(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<number>;
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
}
