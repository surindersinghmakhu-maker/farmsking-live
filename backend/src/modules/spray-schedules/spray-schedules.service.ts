import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CropStatus, NotificationType, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdvisorAssignmentService } from '../advisor-assignment/advisor-assignment.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateSprayScheduleDto } from './dto/create-spray-schedule.dto';
import { UpdateSprayScheduleDto } from './dto/update-spray-schedule.dto';

@Injectable()
export class SprayScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly advisorAssignmentService: AdvisorAssignmentService,
    private readonly notificationsService: NotificationsService,
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

  /** Best-effort: remembers new product names so future autocomplete searches surface them too. */
  private async rememberProductNames(names: (string | undefined)[]) {
    const unique = Array.from(new Set(names.filter((n): n is string => !!n?.trim()).map((n) => n.trim())));
    if (unique.length === 0) return;
    await Promise.all(
      unique.map((name) =>
        this.prisma.sprayProductCatalog
          .upsert({ where: { name }, update: {}, create: { name } })
          .catch(() => undefined),
      ),
    );
  }

  async create(user: AuthUser, dto: CreateSprayScheduleDto) {
    const cropCycle = await this.assertAdvisorAssignedToCropCycle(user.id, dto.cropCycleId);
    if (cropCycle.status === CropStatus.COMPLETED) {
      throw new ForbiddenException('This crop is completed and locked — no schedule changes allowed.');
    }

    const { scheduledDate, ...rest } = dto;
    const schedule = await this.prisma.spraySchedule.create({
      data: { ...rest, scheduledDate: new Date(scheduledDate), createdByAdvisorId: user.id },
    });

    await this.rememberProductNames([dto.recommendedProduct, dto.alternativeOption, dto.alternativeOption2]);

    await this.notificationsService.create(
      cropCycle.plot.farm.ownerId,
      NotificationType.SPRAY_REMINDER,
      'New spray schedule added',
      `Your advisor scheduled "${dto.recommendedProduct}" for ${cropCycle.cropName} on ${new Date(scheduledDate).toLocaleDateString('en-IN')}.`,
      { cropCycleId: cropCycle.id, sprayScheduleId: schedule.id },
    );

    return schedule;
  }

  /** Farmer (owner) or the assigned advisor can view a crop's spray schedule. */
  async listForCrop(user: AuthUser, cropCycleId: string) {
    const cropCycle = await this.prisma.cropCycle.findFirst({
      where: { id: cropCycleId, deletedAt: null },
      include: { plot: { include: { farm: true } } },
    });
    if (!cropCycle) {
      throw new NotFoundException('Crop cycle not found.');
    }

    if (user.role === Role.ADVISOR) {
      await this.advisorAssignmentService.assertAdvisorAssignedToFarmer(user.id, cropCycle.plot.farm.ownerId);
    } else if (cropCycle.plot.farm.ownerId !== user.id && user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN) {
      throw new NotFoundException('Crop cycle not found.');
    }

    return this.prisma.spraySchedule.findMany({
      where: { cropCycleId, deletedAt: null },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  async update(user: AuthUser, id: string, dto: UpdateSprayScheduleDto) {
    const existing = await this.prisma.spraySchedule.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw new NotFoundException('Spray schedule item not found.');
    }
    await this.assertAdvisorAssignedToCropCycle(user.id, existing.cropCycleId);

    const { ...rest } = dto;
    const data: Record<string, unknown> = { ...rest };
    if (dto.scheduledDate) data.scheduledDate = new Date(dto.scheduledDate);

    const updated = await this.prisma.spraySchedule.update({ where: { id }, data });
    await this.rememberProductNames([dto.recommendedProduct, dto.alternativeOption, dto.alternativeOption2]);
    return updated;
  }

  async remove(user: AuthUser, id: string) {
    const existing = await this.prisma.spraySchedule.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw new NotFoundException('Spray schedule item not found.');
    }
    await this.assertAdvisorAssignedToCropCycle(user.id, existing.cropCycleId);
    return this.prisma.spraySchedule.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  /** Autocomplete search over the shared product-name catalog. */
  async searchCatalog(query: string) {
    const q = (query ?? '').trim();
    return this.prisma.sprayProductCatalog.findMany({
      where: { deletedAt: null, ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}) },
      orderBy: { name: 'asc' },
      take: 20,
    });
  }
}
