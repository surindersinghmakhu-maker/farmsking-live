import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
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
}
