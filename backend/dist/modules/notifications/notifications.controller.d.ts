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
        body: string;
        isRead: boolean;
        readAt: Date | null;
        userId: string;
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
        body: string;
        isRead: boolean;
        readAt: Date | null;
        userId: string;
    }>;
    markAllRead(user: AuthUser): Promise<{
        success: boolean;
    }>;
}
