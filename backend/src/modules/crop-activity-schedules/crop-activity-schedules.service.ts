import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityStatus, CropStatus, NotificationType, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CropsService } from '../crops/crops.service';
import { AdvisorAssignmentService } from '../advisor-assignment/advisor-assignment.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatService } from '../chat/chat.service';
import { ChatGateway, userRoom } from '../chat/chat.gateway';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateActivityScheduleDto } from './dto/create-activity-schedule.dto';
import { UpdateActivityScheduleDto } from './dto/update-activity-schedule.dto';
import { BulkCreateActivityScheduleDto } from './dto/bulk-create-activity-schedule.dto';
import { CompleteActivityDto } from './dto/complete-activity.dto';

@Injectable()
export class CropActivitySchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cropsService: CropsService,
    private readonly advisorAssignmentService: AdvisorAssignmentService,
    private readonly notificationsService: NotificationsService,
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  /** Once a crop cycle is COMPLETED, its schedule is frozen — no new/updated/removed activity items. */
  private assertCropCycleNotLocked(cropCycle: { status: CropStatus }) {
    if (cropCycle.status === CropStatus.COMPLETED) {
      throw new ForbiddenException('This crop is completed and locked — no schedule changes allowed.');
    }
  }

  /** Loads the crop cycle's owning farmer and confirms this advisor is actively assigned to them. */
  private async assertAdvisorAssignedToCropCycle(advisorId: string, cropCycleId: string) {
    const cropCycle = await this.prisma.cropCycle.findFirst({
      where: { id: cropCycleId, deletedAt: null },
      include: { plot: { include: { farm: true } } },
    });
    if (!cropCycle) {
      throw new NotFoundException('Crop cycle not found.');
    }
    await this.advisorAssignmentService.assertAdvisorAssignedToFarmer(advisorId, cropCycle.plot.farm.ownerId);
    return cropCycle;
  }

  async create(user: AuthUser, dto: CreateActivityScheduleDto) {
    const cropCycle = await this.assertAdvisorAssignedToCropCycle(user.id, dto.cropCycleId);
    this.assertCropCycleNotLocked(cropCycle);
    const { scheduledDate, ...rest } = dto;
    const activity = await this.prisma.cropActivitySchedule.create({
      data: { ...rest, scheduledDate: new Date(scheduledDate), createdByAdvisorId: user.id },
    });

    await this.notificationsService.create(
      cropCycle.plot.farm.ownerId,
      NotificationType.SPRAY_REMINDER,
      'New schedule added',
      `Your advisor scheduled "${dto.title}" for ${cropCycle.cropName} on ${new Date(scheduledDate).toLocaleDateString('en-IN')}.`,
      { cropCycleId: cropCycle.id, activityId: activity.id },
    );

    return activity;
  }

  async bulkCreate(user: AuthUser, dto: BulkCreateActivityScheduleDto) {
    const cropCycle = await this.assertAdvisorAssignedToCropCycle(user.id, dto.cropCycleId);
    this.assertCropCycleNotLocked(cropCycle);
    const created = await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.cropActivitySchedule.create({
          data: {
            cropCycleId: dto.cropCycleId,
            activityType: item.activityType,
            title: item.title,
            description: item.description,
            scheduledDate: new Date(item.scheduledDate),
            notes: item.notes,
            createdByAdvisorId: user.id,
          },
        }),
      ),
    );

    await this.notificationsService.create(
      cropCycle.plot.farm.ownerId,
      NotificationType.SPRAY_REMINDER,
      'New schedule added',
      `Your advisor added ${created.length} new schedule task(s) for ${cropCycle.cropName}.`,
      { cropCycleId: cropCycle.id },
    );

    return created;
  }

  async findAllForCropCycle(user: AuthUser, cropCycleId: string) {
    // Ownership check: farmer must own the crop cycle, or the requester is its assigned advisor / an admin.
    if (user.role === Role.FARMER) {
      await this.cropsService.findOneOrThrow(user, cropCycleId);
    } else if (user.role === Role.ADVISOR) {
      await this.assertAdvisorAssignedToCropCycle(user.id, cropCycleId);
    }

    return this.prisma.cropActivitySchedule.findMany({
      where: { cropCycleId, deletedAt: null },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  findTodayForFarmer(user: AuthUser) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.cropActivitySchedule.findMany({
      where: {
        deletedAt: null,
        scheduledDate: { gte: startOfDay, lte: endOfDay },
        cropCycle: { plot: { farm: { ownerId: user.id } } },
      },
      include: { cropCycle: { select: { id: true, cropName: true } } },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  private readonly ADVISOR_SCHEDULE_INCLUDE = {
    cropCycle: {
      select: {
        id: true,
        cropName: true,
        plot: {
          select: {
            id: true,
            name: true,
            farm: { select: { id: true, name: true, owner: { select: { id: true, name: true, mobile: true } } } },
          },
        },
      },
    },
  } as const;

  /** Base filter: any non-deleted schedule for a crop cycle whose farmer currently has this advisor ACTIVE and not plan-expired. */
  private advisorScopedWhere(advisorId: string) {
    return {
      deletedAt: null,
      cropCycle: {
        plot: {
          farm: {
            owner: {
              advisorAssignmentsAsFarmer: {
                some: {
                  advisorId,
                  status: 'ACTIVE' as const,
                  deletedAt: null,
                  OR: [{ subscriptionId: null }, { subscription: { endDate: null } }, { subscription: { endDate: { gt: new Date() } } }],
                },
              },
            },
          },
        },
      },
    };
  }

  findTodayForAdvisor(user: AuthUser) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.cropActivitySchedule.findMany({
      where: { ...this.advisorScopedWhere(user.id), scheduledDate: { gte: startOfDay, lte: endOfDay } },
      include: this.ADVISOR_SCHEDULE_INCLUDE,
      orderBy: { scheduledDate: 'asc' },
    });
  }

  findUpcomingForAdvisor(user: AuthUser) {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const sevenDaysOut = new Date();
    sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
    sevenDaysOut.setHours(23, 59, 59, 999);

    return this.prisma.cropActivitySchedule.findMany({
      where: { ...this.advisorScopedWhere(user.id), scheduledDate: { gt: endOfToday, lte: sevenDaysOut } },
      include: this.ADVISOR_SCHEDULE_INCLUDE,
      orderBy: { scheduledDate: 'asc' },
    });
  }

  findDelayedForAdvisor(user: AuthUser) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return this.prisma.cropActivitySchedule.findMany({
      where: {
        ...this.advisorScopedWhere(user.id),
        status: ActivityStatus.PENDING,
        scheduledDate: { lt: startOfToday },
      },
      include: this.ADVISOR_SCHEDULE_INCLUDE,
      orderBy: { scheduledDate: 'asc' },
    });
  }

  private async findOneOrThrow(id: string) {
    const activity = await this.prisma.cropActivitySchedule.findFirst({
      where: { id, deletedAt: null },
      include: { cropCycle: { include: { plot: { include: { farm: true } } } } },
    });
    if (!activity) {
      throw new NotFoundException('Scheduled activity not found.');
    }
    return activity;
  }

  /**
   * Advisor nudges the farmer about a specific scheduled task — creates a SPRAY_REMINDER notification
   * (shown as a blocking alert the next time the farmer opens the app) and also sends it as a chat
   * message so it shows up in their conversation with the advisor.
   */
  async remind(user: AuthUser, id: string) {
    const activity = await this.findOneOrThrow(id);
    await this.advisorAssignmentService.assertAdvisorAssignedToFarmer(user.id, activity.cropCycle.plot.farm.ownerId);
    const farmerId = activity.cropCycle.plot.farm.ownerId;

    const dueDate = new Date(activity.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const reminderText = `Reminder: "${activity.title}" for ${activity.cropCycle.cropName} was scheduled for ${dueDate}. Please complete it soon.`;

    await this.notificationsService.create(
      farmerId,
      NotificationType.SPRAY_REMINDER,
      `Reminder from your advisor`,
      reminderText,
      { cropCycleId: activity.cropCycleId, activityId: id, isReminder: true },
    );

    const message = await this.chatService.sendMessage(user, farmerId, reminderText);
    this.chatGateway.server.to(userRoom(user.id)).to(userRoom(farmerId)).emit('new_message', message);

    return { success: true };
  }

  async update(user: AuthUser, id: string, dto: UpdateActivityScheduleDto) {
    const activity = await this.findOneOrThrow(id);
    await this.advisorAssignmentService.assertAdvisorAssignedToFarmer(user.id, activity.cropCycle.plot.farm.ownerId);
    this.assertCropCycleNotLocked(activity.cropCycle);

    const { scheduledDate, ...rest } = dto;
    const updated = await this.prisma.cropActivitySchedule.update({
      where: { id },
      data: { ...rest, ...(scheduledDate ? { scheduledDate: new Date(scheduledDate) } : {}) },
    });

    await this.notificationsService.create(
      activity.cropCycle.plot.farm.ownerId,
      NotificationType.SPRAY_REMINDER,
      'Schedule updated',
      `Your advisor updated the schedule "${updated.title}" for ${activity.cropCycle.cropName}.`,
      { cropCycleId: activity.cropCycleId, activityId: id },
    );

    return updated;
  }

  async complete(user: AuthUser, id: string, dto: CompleteActivityDto) {
    const activity = await this.findOneOrThrow(id);
    if (activity.cropCycle.plot.farm.ownerId !== user.id) {
      throw new NotFoundException('Scheduled activity not found.');
    }
    this.assertCropCycleNotLocked(activity.cropCycle);

    return this.prisma.cropActivitySchedule.update({
      where: { id },
      data: {
        status: ActivityStatus.COMPLETED,
        completedAt: new Date(),
        completedById: user.id,
        ...(dto.notes ? { notes: dto.notes } : {}),
      },
    });
  }

  async remove(user: AuthUser, id: string) {
    const activity = await this.findOneOrThrow(id);
    await this.advisorAssignmentService.assertAdvisorAssignedToFarmer(user.id, activity.cropCycle.plot.farm.ownerId);
    this.assertCropCycleNotLocked(activity.cropCycle);
    return this.prisma.cropActivitySchedule.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
