import { Injectable, NotFoundException } from '@nestjs/common';
import { CropProblemStatus, NotificationType, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CropsService } from '../crops/crops.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatService } from '../chat/chat.service';
import { ChatGateway, userRoom } from '../chat/chat.gateway';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateCropProblemDto } from './dto/create-crop-problem.dto';
import { RespondCropProblemDto } from './dto/respond-crop-problem.dto';
import { UpdateCropProblemStatusDto } from './dto/update-crop-problem-status.dto';

const DETAIL_INCLUDE = {
  photos: true,
  reportedBy: { select: { id: true, name: true, mobile: true, sprayTankSizeL: true } },
  assignedAdvisor: { select: { id: true, name: true, mobile: true } },
  cropCycle: { select: { id: true, cropName: true, plot: { select: { id: true, name: true, farmId: true } } } },
} as const;

@Injectable()
export class CropProblemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cropsService: CropsService,
    private readonly notificationsService: NotificationsService,
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async create(user: AuthUser, dto: CreateCropProblemDto) {
    const cropCycle = await this.cropsService.findOneOrThrow(user, dto.cropCycleId);

    const activeAssignment = await this.prisma.advisorAssignment.findFirst({
      where: { farmerId: user.id, status: 'ACTIVE', deletedAt: null },
    });

    const { photoUrls, ...rest } = dto;
    const problem = await this.prisma.cropProblem.create({
      data: {
        ...rest,
        reportedById: user.id,
        assignedAdvisorId: activeAssignment?.advisorId,
        photos: photoUrls?.length ? { create: photoUrls.map((photoUrl) => ({ photoUrl })) } : undefined,
      },
      include: DETAIL_INCLUDE,
    });

    if (activeAssignment?.advisorId) {
      await this.notificationsService.create(
        activeAssignment.advisorId,
        NotificationType.CROP_PROBLEM_UPDATE,
        'New problem reported',
        `${user.name} reported a problem on ${cropCycle.cropName}: "${dto.title}".`,
        { cropProblemId: problem.id, cropCycleId: dto.cropCycleId },
      );
    }

    return problem;
  }

  findAllForFarmer(user: AuthUser) {
    return this.prisma.cropProblem.findMany({
      where: { reportedById: user.id, deletedAt: null },
      include: DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllForAdvisor(user: AuthUser) {
    return this.prisma.cropProblem.findMany({
      where: {
        assignedAdvisorId: user.id,
        deletedAt: null,
        reportedBy: {
          advisorAssignmentsAsFarmer: {
            some: {
              advisorId: user.id,
              status: 'ACTIVE',
              deletedAt: null,
              OR: [{ subscriptionId: null }, { subscription: { endDate: null } }, { subscription: { endDate: { gt: new Date() } } }],
            },
          },
        },
      },
      include: DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOrThrow(user: AuthUser, id: string) {
    const problem = await this.prisma.cropProblem.findFirst({
      where: { id, deletedAt: null },
      include: DETAIL_INCLUDE,
    });

    if (
      !problem ||
      (user.role !== Role.ADMIN &&
        user.role !== Role.SUPER_ADMIN &&
        problem.reportedById !== user.id &&
        problem.assignedAdvisorId !== user.id)
    ) {
      throw new NotFoundException('Crop problem not found.');
    }

    return problem;
  }

  /**
   * Picks the date a solution spray gets inserted on: prefers tomorrow (today + 1 day), but if either
   * today or tomorrow already has a spray scheduled for this crop, it skips ahead to today + 3 days
   * instead — never double-books a day the farmer already has a task on.
   */
  private async pickSprayInsertDate(cropCycleId: string): Promise<Date> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const conflict = await this.prisma.spraySchedule.findFirst({
      where: {
        cropCycleId,
        deletedAt: null,
        scheduledDate: { gte: today, lt: dayAfterTomorrow },
      },
    });

    if (conflict) {
      const pushedDate = new Date(today);
      pushedDate.setDate(pushedDate.getDate() + 3);
      return pushedDate;
    }
    return tomorrow;
  }

  async respond(user: AuthUser, id: string, dto: RespondCropProblemDto) {
    const problem = await this.findOneOrThrow(user, id);
    if (problem.assignedAdvisorId !== user.id) {
      throw new NotFoundException('Crop problem not found.');
    }

    const { followUpDate, status, ...rest } = dto;
    const nextStatus = status ?? CropProblemStatus.ADVISOR_RESPONDED;

    const updated = await this.prisma.cropProblem.update({
      where: { id },
      data: {
        ...rest,
        status: nextStatus,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        resolvedAt: nextStatus === CropProblemStatus.RESOLVED ? new Date() : undefined,
      },
      include: DETAIL_INCLUDE,
    });

    // Auto-insert the recommended product into the farmer's spray schedule, so responding to a problem
    // doesn't just leave advice in a chat thread — it shows up as an actionable task on their calendar.
    let insertedScheduleDate: Date | null = null;
    if (dto.recommendedProduct?.trim()) {
      insertedScheduleDate = await this.pickSprayInsertDate(problem.cropCycleId);
      await this.prisma.spraySchedule.create({
        data: {
          cropCycleId: problem.cropCycleId,
          scheduledDate: insertedScheduleDate,
          recommendedProduct: dto.recommendedProduct.trim(),
          dosageInstructions: dto.advisorResponse,
          createdByAdvisorId: user.id,
          notes: `Advisor solution for reported problem: "${problem.title}"`,
        },
      });
    }

    const dateLabel = insertedScheduleDate
      ? insertedScheduleDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : null;

    await this.notificationsService.create(
      problem.reportedById,
      NotificationType.CROP_PROBLEM_UPDATE,
      'Advisor responded to your problem report',
      `Your advisor responded to "${problem.title}": ${dto.advisorResponse ?? 'See details in the app.'}`,
      { cropProblemId: id },
    );

    const chatText = dateLabel
      ? `${dto.advisorResponse}\n\nSolution also added in your schedule (${dateLabel}).`
      : dto.advisorResponse;
    const message = await this.chatService.sendMessage(user, problem.reportedById, chatText);
    this.chatGateway.server.to(userRoom(user.id)).to(userRoom(problem.reportedById)).emit('new_message', message);

    return { ...updated, insertedScheduleDate };
  }

  async updateStatus(user: AuthUser, id: string, dto: UpdateCropProblemStatusDto) {
    await this.findOneOrThrow(user, id);
    return this.prisma.cropProblem.update({
      where: { id },
      data: {
        status: dto.status,
        resolvedAt: dto.status === CropProblemStatus.RESOLVED ? new Date() : undefined,
      },
      include: DETAIL_INCLUDE,
    });
  }
}
