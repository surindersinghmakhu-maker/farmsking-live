import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { Role, NotificationType, CropProblemStatus } from '@prisma/client';
import { ChatGateway } from '../chat/chat.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminChatService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
    private readonly notificationsService: NotificationsService,
  ) { }

  /** Farmer or Admin sends a chat message */
  async sendMessage(userId: string, userRole: Role, dto: SendChatMessageDto) {
    let farmerId: string;
    let senderRole: Role = userRole;

    if (userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN) {
      if (!dto.farmerId) {
        throw new ForbiddenException('Admin must specify farmerId when sending a chat message.');
      }
      farmerId = dto.farmerId;
    } else {
      farmerId = userId;
      senderRole = Role.FARMER;
    }

    // Verify farmer exists
    const farmer = await this.prisma.user.findUnique({
      where: { id: farmerId },
      select: { id: true, name: true, mobile: true },
    });
    if (!farmer) {
      throw new NotFoundException('Farmer account not found.');
    }

    const chatMsg = await (this.prisma as any).adminChatMessage.create({
      data: {
        farmerId,
        adminId: userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN ? userId : undefined,
        senderRole,
        message: dto.message.trim(),
        imageUrl: dto.imageUrl || undefined,
        isReadByFarmer: senderRole === Role.FARMER,
        isReadByAdmin: senderRole !== Role.FARMER,
      },
    });

    // If Admin sends a message, alert the user with a notification
    if (userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN) {
      await this.notificationsService.create(
        farmerId,
        NotificationType.ADVISOR_MESSAGE,
        '🛡️ Support Reply from Admin',
        dto.message.trim(),
        { farmerId, type: 'ADMIN_CHAT' },
      );
    }

    if (this.chatGateway?.server) {
      this.chatGateway.server.emit('admin_chat_message', chatMsg);
    }

    return {
      message: 'Chat message sent successfully',
      data: chatMsg,
    };
  }

  /** Farmer fetches their chat messages with Admin */
  async getFarmerMessages(farmerId: string) {
    // Mark admin messages as read by farmer
    await (this.prisma as any).adminChatMessage.updateMany({
      where: {
        farmerId,
        senderRole: { in: [Role.ADMIN, Role.SUPER_ADMIN] },
        isReadByFarmer: false,
      },
      data: { isReadByFarmer: true },
    });

    const messages = await (this.prisma as any).adminChatMessage.findMany({
      where: { farmerId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    const unreadCount = await (this.prisma as any).adminChatMessage.count({
      where: {
        farmerId,
        senderRole: { in: [Role.ADMIN, Role.SUPER_ADMIN] },
        isReadByFarmer: false,
      },
    });

    return {
      messages,
      unreadCount,
    };
  }

  /** Admin lists all active farmer conversation threads */
  async getAdminConversations() {
    const messages = await (this.prisma as any).adminChatMessage.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        farmer: {
          select: { id: true, name: true, mobile: true, kingId: true, village: true, district: true, photoUrl: true },
        },
      },
      take: 200,
    });

    // Group by farmerId to return unique conversation threads
    const conversationsMap = new Map<string, any>();
    for (const msg of messages) {
      if (!conversationsMap.has(msg.farmerId)) {
        conversationsMap.set(msg.farmerId, {
          farmerId: msg.farmerId,
          farmerName: msg.farmer?.name || 'User',
          farmerMobile: msg.farmer?.mobile || 'N/A',
          kingId: msg.farmer?.kingId || undefined,
          photoUrl: msg.farmer?.photoUrl || undefined,
          farmer: msg.farmer,
          lastMessage: msg.message,
          lastMessageDate: msg.createdAt,
          lastSenderRole: msg.senderRole,
          unreadCount: msg.isReadByAdmin ? 0 : 1,
        });
      } else if (!msg.isReadByAdmin) {
        const existing = conversationsMap.get(msg.farmerId);
        existing.unreadCount += 1;
      }
    }

    return Array.from(conversationsMap.values());
  }

  /** Admin views messages for a specific farmer */
  async getAdminFarmerThread(farmerId: string) {
    // Mark farmer messages as read by admin
    await (this.prisma as any).adminChatMessage.updateMany({
      where: {
        farmerId,
        senderRole: Role.FARMER,
        isReadByAdmin: false,
      },
      data: { isReadByAdmin: true },
    });

    const farmer = await this.prisma.user.findUnique({
      where: { id: farmerId },
      select: { id: true, name: true, mobile: true, village: true, district: true },
    });

    const messages = await (this.prisma as any).adminChatMessage.findMany({
      where: { farmerId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    return {
      farmer,
      messages,
    };
  }

  /** Admin marks a farmer's request / problem / thread as RESOLVED */
  async resolveFarmerThread(adminId: string, farmerId: string, notes?: string) {
    const farmer = await this.prisma.user.findUnique({
      where: { id: farmerId },
      select: { id: true, name: true },
    });
    if (!farmer) {
      throw new NotFoundException('Farmer account not found.');
    }

    // 1. Update any open crop problems reported by this farmer to RESOLVED
    await this.prisma.cropProblem.updateMany({
      where: {
        reportedById: farmerId,
        status: { in: [CropProblemStatus.REPORTED, CropProblemStatus.UNDER_REVIEW, CropProblemStatus.ADVISOR_RESPONDED] },
        deletedAt: null,
      },
      data: {
        status: CropProblemStatus.RESOLVED,
        resolvedAt: new Date(),
      },
    });

    // 2. Post a Resolution Chat Message in AdminChatMessage
    const resolutionText = notes
      ? `✓ Request Solved: ${notes.trim()}`
      : '✓ Problem Solved: Your support request has been marked as resolved by Admin.';

    const chatMsg = await (this.prisma as any).adminChatMessage.create({
      data: {
        farmerId,
        adminId,
        senderRole: Role.ADMIN,
        message: resolutionText,
        isReadByFarmer: false,
        isReadByAdmin: true,
      },
    });

    // 3. Post a direct chat message in Message table (so it shows in main Chat screen too!)
    try {
      const directMsg = await this.prisma.message.create({
        data: {
          senderId: adminId,
          receiverId: farmerId,
          content: resolutionText,
        },
      });
      if (this.chatGateway?.server) {
        this.chatGateway.server.to(`user:${farmerId}`).to(`user:${adminId}`).emit('new_message', directMsg);
      }
    } catch {}

    // 4. Send Notification to User
    await this.notificationsService.create(
      farmerId,
      NotificationType.CROP_PROBLEM_UPDATE,
      '✅ Request / Problem Solved',
      notes?.trim() || 'Your support request has been marked as resolved by Admin.',
      { farmerId, type: 'PROBLEM_SOLVED' },
    );

    // 5. Broadcast via Socket
    if (this.chatGateway?.server) {
      this.chatGateway.server.to(`user:${farmerId}`).emit('admin_chat_message', chatMsg);
      this.chatGateway.server.emit('admin_chat_message', chatMsg);
      this.chatGateway.server.to(`user:${farmerId}`).emit('crop_problem_updated', { farmerId, status: 'RESOLVED' });
      this.chatGateway.server.emit('crop_problem_updated', { farmerId, status: 'RESOLVED' });
    }

    return {
      message: 'Farmer support request marked as solved successfully.',
      data: chatMsg,
    };
  }

}

