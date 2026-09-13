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
        body: string;
        isRead: boolean;
        readAt: Date | null;
        userId: string;
    } | null>;
    listMine(user: AuthUser): Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        data: Prisma.JsonValue | null;
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
        data: Prisma.JsonValue | null;
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
