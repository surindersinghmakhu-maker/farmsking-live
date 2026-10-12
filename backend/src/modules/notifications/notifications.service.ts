import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Fire-and-forget style creator used by other services when an action should alert a user. Skips silently if the user has notifications turned off. */
  async create(userId: string, type: NotificationType, title: string, body: string, data?: Prisma.InputJsonValue) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { notificationsEnabled: true } });
    if (user && !user.notificationsEnabled) {
      return null;
    }
    return this.prisma.notification.create({ data: { userId, type, title, body, data } });
  }

  listMine(user: AuthUser) {
    return this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getUnreadCount(user: AuthUser) {
    const count = await this.prisma.notification.count({ where: { userId: user.id, isRead: false } });
    return { count };
  }

  async markRead(user: AuthUser, id: string) {
    const notification = await this.prisma.notification.findFirst({ where: { id, userId: user.id } });
    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(user: AuthUser) {
    await this.prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  /** Admin: Broadcast notification to All Farmers, All Sellers, or All Users */
  async broadcastNotification(
    user: AuthUser,
    dto: {
      targetGroup: 'ALL_FARMERS' | 'ALL_SELLERS' | 'ALL_USERS';
      title: string;
      body: string;
      category?: string;
      schemeUrl?: string;
    },
  ) {
    let whereClause: Prisma.UserWhereInput = { deletedAt: null };

    if (dto.targetGroup === 'ALL_FARMERS') {
      whereClause = {
        deletedAt: null,
        OR: [
          { role: Role.FARMER },
          { roles: { has: Role.FARMER } },
        ],
      };
    } else if (dto.targetGroup === 'ALL_SELLERS') {
      whereClause = {
        deletedAt: null,
        OR: [
          { role: Role.TRADER },
          { roles: { has: Role.TRADER } },
          { sellerStore: { isNot: null } },
        ],
      };
    }

    const recipients = await this.prisma.user.findMany({
      where: whereClause,
      select: { id: true, mobile: true, name: true },
    });

    if (recipients.length === 0) {
      return { success: true, count: 0, message: 'No recipients matched the target group.' };
    }

    const data = recipients.map((r) => ({
      userId: r.id,
      type: NotificationType.SYSTEM,
      title: dto.title,
      body: dto.body,
      data: {
        category: dto.category || 'BROADCAST',
        schemeUrl: dto.schemeUrl || null,
        targetGroup: dto.targetGroup,
        sentByAdminId: user.id,
      },
    }));

    await this.prisma.notification.createMany({
      data,
    });

    return {
      success: true,
      count: recipients.length,
      targetGroup: dto.targetGroup,
      message: `Successfully broadcast message to ${recipients.length} recipients!`,
    };
  }
}
