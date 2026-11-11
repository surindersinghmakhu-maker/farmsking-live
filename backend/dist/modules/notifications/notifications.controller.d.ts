import type { AuthUser } from '../../common/types/auth-user.type';
import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    listMine(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
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
        data: import("@prisma/client/runtime/library").JsonValue | null;
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
