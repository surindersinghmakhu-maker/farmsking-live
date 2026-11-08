import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
export declare class NotificationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(userId: string, type: NotificationType, title: string, body: string, data?: Prisma.InputJsonValue): Promise<{
        id: string;
        createdAt: Date;
        data: Prisma.JsonValue | null;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        userId: string;
        body: string;
        isRead: boolean;
        readAt: Date | null;
    } | null>;
    listMine(user: AuthUser): Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        data: Prisma.JsonValue | null;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        userId: string;
        body: string;
        isRead: boolean;
        readAt: Date | null;
    }[]>;
    getUnreadCount(user: AuthUser): Promise<{
        count: number;
    }>;
    markRead(user: AuthUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        data: Prisma.JsonValue | null;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        userId: string;
        body: string;
        isRead: boolean;
        readAt: Date | null;
    }>;
    markAllRead(user: AuthUser): Promise<{
        success: boolean;
    }>;
    broadcastNotification(user: AuthUser, dto: {
        targetGroup: 'ALL_FARMERS' | 'ALL_SELLERS' | 'ALL_USERS';
        title: string;
        body: string;
        category?: string;
        schemeUrl?: string;
    }): Promise<{
        success: boolean;
        count: number;
        message: string;
        targetGroup?: undefined;
    } | {
        success: boolean;
        count: number;
        targetGroup: "ALL_FARMERS" | "ALL_SELLERS" | "ALL_USERS";
        message: string;
    }>;
}
