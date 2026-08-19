import { ForbiddenException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { AdvisorAssignmentStatus, NotificationType, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  /** A farmer and advisor may only chat while an ACTIVE AdvisorAssignment links them (admins bypass,
   * in either direction — a farmer/advisor can always reply to a message an Admin/Super Admin sent them). */
  async assertCanChat(userId: string, userRole: Role, otherUserId: string) {
    if (userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN) return;

    const other = await this.prisma.user.findUnique({ where: { id: otherUserId }, select: { role: true } });
    if (other?.role === Role.ADMIN || other?.role === Role.SUPER_ADMIN) return;

    const assignment = await this.prisma.advisorAssignment.findFirst({
      where: {
        status: AdvisorAssignmentStatus.ACTIVE,
        deletedAt: null,
        OR: [
          { advisorId: userId, farmerId: otherUserId },
          { advisorId: otherUserId, farmerId: userId },
        ],
      },
    });

    if (!assignment) {
      throw new ForbiddenException('You can only message your currently assigned advisor or farmer.');
    }
  }

  async sendMessage(sender: AuthUser, receiverId: string, content: string) {
    await this.assertCanChat(sender.id, sender.role, receiverId);

    const message = await this.prisma.message.create({
      data: { senderId: sender.id, receiverId, content },
    });

    await this.notificationsService.create(
      receiverId,
      NotificationType.ADVISOR_MESSAGE,
      `New message from ${sender.name}`,
      content.length > 80 ? `${content.slice(0, 80)}...` : content,
      { senderId: sender.id, messageId: message.id },
    );

    return message;
  }

  async getMessages(user: AuthUser, otherUserId: string) {
    await this.assertCanChat(user.id, user.role, otherUserId);

    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: user.id },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    await this.prisma.message.updateMany({
      where: { senderId: otherUserId, receiverId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return messages;
  }

  /** One row per person this user can currently chat with, plus their last message, unread count, and
   * online status — sorted so the most recently active conversation (by last message, or just-connected
   * with no messages yet) surfaces at the top of the list. */
  async listConversations(user: AuthUser) {
    const assignments = await this.prisma.advisorAssignment.findMany({
      where: {
        status: AdvisorAssignmentStatus.ACTIVE,
        deletedAt: null,
        ...(user.role === Role.ADVISOR ? { advisorId: user.id } : { farmerId: user.id }),
      },
      include: {
        advisor: { select: { id: true, kingId: true, name: true, mobile: true, photoUrl: true } },
        farmer: { select: { id: true, kingId: true, name: true, mobile: true, photoUrl: true } },
      },
    });

    // A farmer/advisor pair can have more than one ACTIVE assignment row (e.g. re-assigned across
    // crops or plan renewals) — collapse those down to one conversation per unique partner.
    const partnerById = new Map<string, (typeof assignments)[number]['advisor']>();
    assignments.forEach((assignment) => {
      const partner = user.role === Role.ADVISOR ? assignment.farmer : assignment.advisor;
      if (!partnerById.has(partner.id)) partnerById.set(partner.id, partner);
    });

    // Admin/Super Admin can message anyone regardless of assignment (see assertCanChat's bypass) — surface
    // any such sender as a conversation too, so the list and the unread badge never disagree.
    const otherSenderIds = await this.prisma.message.findMany({
      where: { receiverId: user.id, senderId: { notIn: Array.from(partnerById.keys()) } },
      select: { senderId: true },
      distinct: ['senderId'],
    });
    if (otherSenderIds.length > 0) {
      const extraPartners = await this.prisma.user.findMany({
        where: { id: { in: otherSenderIds.map((m) => m.senderId) } },
        select: { id: true, kingId: true, name: true, mobile: true, photoUrl: true },
      });
      extraPartners.forEach((partner) => {
        if (!partnerById.has(partner.id)) partnerById.set(partner.id, partner);
      });
    }

    const conversations = await Promise.all(
      Array.from(partnerById.values()).map(async (partner) => {
        const [lastMessage, unreadCount] = await Promise.all([
          this.prisma.message.findFirst({
            where: {
              OR: [
                { senderId: user.id, receiverId: partner.id },
                { senderId: partner.id, receiverId: user.id },
              ],
            },
            orderBy: { createdAt: 'desc' },
          }),
          this.prisma.message.count({ where: { senderId: partner.id, receiverId: user.id, isRead: false } }),
        ]);

        return { partner, lastMessage, unreadCount, isOnline: this.chatGateway.isUserOnline(partner.id) };
      }),
    );

    return conversations.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  getUnreadCount(user: AuthUser) {
    return this.prisma.message.count({ where: { receiverId: user.id, isRead: false } });
  }

  isUserOnline(userId: string) {
    return { isOnline: this.chatGateway.isUserOnline(userId) };
  }

  /** Admin/Super Admin: read-only view of the chat log between any two users (bypasses the assignment check). */
  getMessagesBetweenAsAdmin(userAId: string, userBId: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userAId, receiverId: userBId },
          { senderId: userBId, receiverId: userAId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
