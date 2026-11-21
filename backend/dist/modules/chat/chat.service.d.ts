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
        senderId: string;
        id: string;
        createdAt: Date;
        isRead: boolean;
        readAt: Date | null;
        content: string;
        receiverId: string;
    }>;
    getMessages(user: AuthUser, otherUserId: string): Promise<{
        senderId: string;
        id: string;
        createdAt: Date;
        isRead: boolean;
        readAt: Date | null;
        content: string;
        receiverId: string;
    }[]>;
    listConversations(user: AuthUser): Promise<{
        partner: {
            name: string;
            mobile: string;
            id: string;
            kingId: string | null;
            photoUrl: string | null;
        };
        lastMessage: {
            senderId: string;
            id: string;
            createdAt: Date;
            isRead: boolean;
            readAt: Date | null;
            content: string;
            receiverId: string;
        } | null;
        unreadCount: number;
        isOnline: boolean;
    }[]>;
    getUnreadCount(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<number>;
    isUserOnline(userId: string): {
        isOnline: boolean;
    };
    getMessagesBetweenAsAdmin(userAId: string, userBId: string): import(".prisma/client").Prisma.PrismaPromise<{
        senderId: string;
        id: string;
        createdAt: Date;
        isRead: boolean;
        readAt: Date | null;
        content: string;
        receiverId: string;
    }[]>;
}
