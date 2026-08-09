import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CropsService } from '../crops/crops.service';
import { AdvisorAssignmentService } from '../advisor-assignment/advisor-assignment.service';
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
  ) {}

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
    await this.assertAdvisorAssignedToCropCycle(user.id, dto.cropCycleId);
    const { scheduledDate, ...rest } = dto;
    return this.prisma.cropActivitySchedule.create({
      data: { ...rest, scheduledDate: new Date(scheduledDate), createdByAdvisorId: user.id },
    });
  }

  async bulkCreate(user: AuthUser, dto: BulkCreateActivityScheduleDto) {
    await this.assertAdvisorAssignedToCropCycle(user.id, dto.cropCycleId);
    return this.prisma.$transaction(
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

  async update(user: AuthUser, id: string, dto: UpdateActivityScheduleDto) {
    const activity = await this.findOneOrThrow(id);
    await this.advisorAssignmentService.assertAdvisorAssignedToFarmer(user.id, activity.cropCycle.plot.farm.ownerId);

    const { scheduledDate, ...rest } = dto;
    return this.prisma.cropActivitySchedule.update({
      where: { id },
      data: { ...rest, ...(scheduledDate ? { scheduledDate: new Date(scheduledDate) } : {}) },
    });
  }

  async complete(user: AuthUser, id: string, dto: CompleteActivityDto) {
    const activity = await this.findOneOrThrow(id);
    if (activity.cropCycle.plot.farm.ownerId !== user.id) {
      throw new NotFoundException('Scheduled activity not found.');
    }

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
    return this.prisma.cropActivitySchedule.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
