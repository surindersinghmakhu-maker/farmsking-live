import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { AdvisorAssignmentStatus, CallRequestStatus, NotificationType, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { ResolveCallRequestDto } from './dto/resolve-call-request.dto';
import { CreateCallRequestDto } from './dto/create-call-request.dto';
import { ChatGateway, userRoom } from '../chat/chat.gateway';

const SELECT = {
  farmer: { select: { id: true, name: true, mobile: true, kingId: true, photoUrl: true } },
  advisor: { select: { id: true, name: true, mobile: true } },
};

@Injectable()
export class CallRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  /** Farmer taps "Request Call" or books a single appointment — runs in parallel with regular advisors & crop selection. */
  async create(farmer: AuthUser, dto?: CreateCallRequestDto) {
    let advisorId = dto?.advisorId?.trim();
    let cropId = dto?.cropId?.trim();
    let cropName: string | null = null;
    let cropVariety: string | null = null;

    if (cropId) {
      const crop = await this.prisma.cropCycle.findFirst({
        where: { id: cropId, deletedAt: null, plot: { farm: { ownerId: farmer.id, deletedAt: null } } },
      });
      if (crop) {
        cropName = crop.cropName;
        cropVariety = crop.variety || null;
      }
    }

    if (!advisorId) {
      const assignment = await this.prisma.advisorAssignment.findFirst({
        where: { farmerId: farmer.id, status: AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
      });
      if (!assignment) {
        throw new BadRequestException('Please select an advisor to request a consultation.');
      }
      advisorId = assignment.advisorId;
    }

    const advisor = await this.prisma.user.findFirst({
      where: {
        id: advisorId,
        deletedAt: null,
        OR: [{ role: Role.ADVISOR }, { roles: { has: Role.ADVISOR } }],
      },
    });
    if (!advisor) {
      throw new NotFoundException('Selected advisor not found or not active.');
    }

    const openRequest = await this.prisma.callRequest.findFirst({
      where: { farmerId: farmer.id, advisorId, status: CallRequestStatus.PENDING },
    });
    if (openRequest) {
      throw new ConflictException(`You already have a pending call request with Dr. ${advisor.name}.`);
    }

    const request = await this.prisma.callRequest.create({
      data: {
        farmerId: farmer.id,
        advisorId,
      },
      include: SELECT,
    });

    const cropText = cropName ? ` for crop: ${cropName}${cropVariety ? ` (${cropVariety})` : ''}` : '';
    await this.notificationsService.create(
      advisorId,
      NotificationType.SYSTEM,
      cropName ? `Call Requested: ${cropName}` : 'Advisory Call Requested',
      `${farmer.name} has requested an advisory consultation${cropText}.`,
      { callRequestId: request.id, cropId: cropId || undefined },
    );

    return {
      ...request,
      selectedCrop: cropName ? { id: cropId, name: cropName, variety: cropVariety } : null,
      notes: dto?.notes || null,
    };
  }

  /** Farmer: their own currently-open (pending) call request, if any — drives the "Call Request" button's live state. */
  getMyPending(farmer: AuthUser) {
    return this.prisma.callRequest.findFirst({
      where: { farmerId: farmer.id, status: CallRequestStatus.PENDING },
      include: SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Advisor: their call requests, newest first — pending and resolved both included, filter on the frontend. */
  listMine(advisor: AuthUser) {
    return this.prisma.callRequest.findMany({
      where: { advisorId: advisor.id },
      include: SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Advisor resolves a pending call request with a comment — moves it out of the pending alert into history. */
  async resolve(advisor: AuthUser, id: string, dto: ResolveCallRequestDto) {
    const request = await this.prisma.callRequest.findFirst({ where: { id, advisorId: advisor.id } });
    if (!request) {
      throw new NotFoundException('Call request not found.');
    }
    if (request.status !== CallRequestStatus.PENDING) {
      throw new ConflictException('This call request has already been resolved.');
    }

    const updated = await this.prisma.callRequest.update({
      where: { id },
      data: { status: CallRequestStatus.RESOLVED, resolvedComment: dto.comment.trim(), resolvedAt: new Date() },
      include: SELECT,
    });

    const commentText = dto.comment.trim();
    const resolutionText = `✓ Call Request Resolved: ${commentText}`;

    // 1. Send Notification to farmer
    await this.notificationsService.create(
      request.farmerId,
      NotificationType.SYSTEM,
      '📞 Call Request Resolved',
      `Your advisor resolved your call request: "${commentText}".`,
      { callRequestId: id },
    );

    // 2. Direct message in Message table
    try {
      const msg = await this.prisma.message.create({
        data: {
          senderId: advisor.id,
          receiverId: request.farmerId,
          content: resolutionText,
        },
      });
      if (this.chatGateway?.server) {
        this.chatGateway.server.to(userRoom(advisor.id)).to(userRoom(request.farmerId)).emit('new_message', msg);
      }
    } catch {}

    // 3. AdminChatMessage fallback
    try {
      const adminMsg = await (this.prisma as any).adminChatMessage.create({
        data: {
          farmerId: request.farmerId,
          adminId: advisor.id,
          senderRole: Role.ADMIN,
          message: resolutionText,
          isReadByFarmer: false,
          isReadByAdmin: true,
        },
      });
      if (this.chatGateway?.server) {
        this.chatGateway.server.to(userRoom(request.farmerId)).emit('admin_chat_message', adminMsg);
        this.chatGateway.server.emit('admin_chat_message', adminMsg);
      }
    } catch {}

    return updated;
  }
}

