import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AdvisorAssignmentStatus, CallRequestStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { ResolveCallRequestDto } from './dto/resolve-call-request.dto';

const SELECT = {
  farmer: { select: { id: true, name: true, mobile: true, kingId: true, photoUrl: true } },
  advisor: { select: { id: true, name: true, mobile: true } },
};

@Injectable()
export class CallRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Farmer taps "Request Call" on their advisor's profile — one open (pending) request at a time per advisor. */
  async create(farmer: AuthUser) {
    const assignment = await this.prisma.advisorAssignment.findFirst({
      where: { farmerId: farmer.id, status: AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
    });
    if (!assignment) {
      throw new BadRequestException('You have no active advisor to call.');
    }

    const openRequest = await this.prisma.callRequest.findFirst({
      where: { farmerId: farmer.id, advisorId: assignment.advisorId, status: CallRequestStatus.PENDING },
    });
    if (openRequest) {
      throw new ConflictException('You already have a pending call request with your advisor.');
    }

    const request = await this.prisma.callRequest.create({
      data: { farmerId: farmer.id, advisorId: assignment.advisorId },
      include: SELECT,
    });

    await this.notificationsService.create(
      assignment.advisorId,
      NotificationType.SYSTEM,
      'Call requested',
      `${farmer.name} has requested a call with you.`,
    );

    return request;
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

    return this.prisma.callRequest.update({
      where: { id },
      data: { status: CallRequestStatus.RESOLVED, resolvedComment: dto.comment.trim(), resolvedAt: new Date() },
      include: SELECT,
    });
  }
}
