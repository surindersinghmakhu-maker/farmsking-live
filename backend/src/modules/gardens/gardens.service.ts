import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { GardenerSubscriptionPlan, GardenType, PlantCareType, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GardenerPlansService, FREE_PLAN_MAX_PLANTS } from '../gardener-plans/gardener-plans.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { hasActiveRole } from '../../common/utils/auth-user.util';
import { CreateGardenDto } from './dto/create-garden.dto';
import { CreatePlantDto } from './dto/create-plant.dto';
import { CreateGardenExpenseDto } from './dto/create-garden-expense.dto';
import { CreatePlantCareScheduleDto } from './dto/create-plant-care-schedule.dto';
import { LogPlantHealthDto } from './dto/log-plant-health.dto';
import { DiagnosePlantDto } from './dto/diagnose-plant.dto';

const FREE_GARDENER_MONTHLY_AI_SCANS = 5;
const PREMIUM_GARDENER_MONTHLY_AI_SCANS = 100;

@Injectable()
export class GardensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gardenerPlansService: GardenerPlansService,
  ) {}

  create(user: AuthUser, dto: CreateGardenDto) {
    return this.prisma.garden.create({
      data: {
        name: dto.name,
        gardenType: dto.gardenType || GardenType.BALCONY,
        location: dto.location,
        area: dto.area,
        sunlightExposure: dto.sunlightExposure,
        wateringSource: dto.wateringSource,
        gardenerId: user.id,
      },
    });
  }

  findAll(user: AuthUser) {
    const isAdmin = hasActiveRole(user, Role.ADMIN) || hasActiveRole(user, Role.SUPER_ADMIN);
    return this.prisma.garden.findMany({
      where: { ...(isAdmin ? {} : { gardenerId: user.id }) },
      include: {
        plants: { where: { deletedAt: null } },
        schedules: { orderBy: { nextDueDate: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOrThrow(user: AuthUser, id: string) {
    const garden = await this.prisma.garden.findFirst({
      where: { id },
      include: {
        plants: { where: { deletedAt: null } },
        schedules: { orderBy: { nextDueDate: 'asc' } },
      },
    });
    const isAdmin = hasActiveRole(user, Role.ADMIN) || hasActiveRole(user, Role.SUPER_ADMIN);
    if (!garden || (!isAdmin && garden.gardenerId !== user.id)) {
      throw new NotFoundException('Garden not found.');
    }
    return garden;
  }

  async addPlant(user: AuthUser, gardenIdOrNull: string | undefined | null, dto: CreatePlantDto) {
    const effectiveGardenId = gardenIdOrNull || dto.gardenId || null;
    let garden = null;

    if (effectiveGardenId) {
      garden = await this.findOneOrThrow(user, effectiveGardenId);
    }

    if (hasActiveRole(user, Role.GARDENER) && !hasActiveRole(user, Role.ADMIN) && !hasActiveRole(user, Role.SUPER_ADMIN)) {
      const { plan } = await this.gardenerPlansService.getEffectivePlan(user.id);
      if (plan === GardenerSubscriptionPlan.FREE) {
        const totalPlants = await this.prisma.plant.count({
          where: {
            deletedAt: null,
            OR: [
              { gardenerId: user.id },
              { garden: { gardenerId: user.id } },
            ],
          },
        });
        if (totalPlants >= FREE_PLAN_MAX_PLANTS) {
          throw new ForbiddenException(
            `Free plan allows up to ${FREE_PLAN_MAX_PLANTS} plants. Upgrade to the Premium plan to add more plants.`,
          );
        }
      }
    }

    const { plantedDate, ...rest } = dto;
    return this.prisma.plant.create({
      data: {
        ...rest,
        gardenId: garden ? garden.id : null,
        gardenerId: user.id,
        plantedDate: plantedDate ? new Date(plantedDate) : undefined,
      },
    });
  }

  listPlants(user: AuthUser, gardenId: string) {
    return this.findOneOrThrow(user, gardenId).then(() =>
      this.prisma.plant.findMany({
        where: { gardenId, deletedAt: null },
        include: { schedules: true, healthLogs: { orderBy: { loggedAt: 'desc' }, take: 5 } },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  listAllPlants(user: AuthUser) {
    const isAdmin = hasActiveRole(user, Role.ADMIN) || hasActiveRole(user, Role.SUPER_ADMIN);
    return this.prisma.plant.findMany({
      where: {
        deletedAt: null,
        ...(isAdmin
          ? {}
          : {
              OR: [
                { gardenerId: user.id },
                { garden: { gardenerId: user.id } },
              ],
            }),
      },
      include: {
        garden: { select: { id: true, name: true, gardenType: true } },
        schedules: { orderBy: { nextDueDate: 'asc' } },
        healthLogs: { orderBy: { loggedAt: 'desc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPlantOrThrow(user: AuthUser, plantId: string) {
    const plant = await this.prisma.plant.findUnique({
      where: { id: plantId },
      include: {
        garden: true,
        schedules: { orderBy: { nextDueDate: 'asc' } },
        healthLogs: { orderBy: { loggedAt: 'desc' } },
        diagnoses: { orderBy: { createdAt: 'desc' } },
      },
    });
    const isAdmin = hasActiveRole(user, Role.ADMIN) || hasActiveRole(user, Role.SUPER_ADMIN);
    const ownerId = plant?.gardenerId || plant?.garden?.gardenerId;
    if (!plant || plant.deletedAt || (!isAdmin && ownerId !== user.id)) {
      throw new NotFoundException('Plant not found.');
    }
    return plant;
  }

  async addCareSchedule(user: AuthUser, dto: CreatePlantCareScheduleDto) {
    const plant = await this.getPlantOrThrow(user, dto.plantId);
    return this.prisma.plantCareSchedule.create({
      data: {
        plantId: plant.id,
        gardenId: plant.gardenId,
        gardenerId: user.id,
        careType: dto.careType,
        title: dto.title,
        instructions: dto.instructions,
        intervalDays: dto.intervalDays || 1,
        nextDueDate: new Date(dto.nextDueDate),
      },
    });
  }

  async completeCareTask(user: AuthUser, scheduleId: string) {
    const schedule = await this.prisma.plantCareSchedule.findUnique({
      where: { id: scheduleId },
    });
    const isAdmin = hasActiveRole(user, Role.ADMIN) || hasActiveRole(user, Role.SUPER_ADMIN);
    if (!schedule || (!isAdmin && schedule.gardenerId !== user.id)) {
      throw new NotFoundException('Care task not found.');
    }

    const now = new Date();
    const nextDate = new Date(now.getTime() + schedule.intervalDays * 24 * 60 * 60 * 1000);

    return this.prisma.plantCareSchedule.update({
      where: { id: scheduleId },
      data: {
        lastCompletedDate: now,
        nextDueDate: nextDate,
      },
    });
  }

  listCareTasks(user: AuthUser, query?: { dueToday?: boolean }) {
    const isAdmin = hasActiveRole(user, Role.ADMIN) || hasActiveRole(user, Role.SUPER_ADMIN);
    const filter: any = {
      ...(isAdmin ? {} : { gardenerId: user.id }),
    };

    if (query?.dueToday) {
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      filter.nextDueDate = { lte: endOfDay };
    }

    return this.prisma.plantCareSchedule.findMany({
      where: filter,
      include: {
        plant: { select: { id: true, name: true, photoUrl: true } },
        garden: { select: { id: true, name: true } },
      },
      orderBy: { nextDueDate: 'asc' },
    });
  }

  async logPlantHealth(user: AuthUser, dto: LogPlantHealthDto) {
    const plant = await this.getPlantOrThrow(user, dto.plantId);
    const [healthLog] = await this.prisma.$transaction([
      this.prisma.plantHealthLog.create({
        data: {
          plantId: plant.id,
          photoUrl: dto.photoUrl,
          conditionStatus: dto.conditionStatus,
          notes: dto.notes,
        },
      }),
      this.prisma.plant.update({
        where: { id: plant.id },
        data: {
          photoUrl: dto.photoUrl,
          healthStatus: dto.conditionStatus,
        },
      }),
    ]);
    return healthLog;
  }

  async getAiCreditStatus(user: AuthUser) {
    let ledger = await this.prisma.aiCreditLedger.findUnique({
      where: { userId: user.id },
    });

    const { plan } = await this.gardenerPlansService.getEffectivePlan(user.id);
    const quota = plan === GardenerSubscriptionPlan.PREMIUM ? PREMIUM_GARDENER_MONTHLY_AI_SCANS : FREE_GARDENER_MONTHLY_AI_SCANS;

    if (!ledger) {
      ledger = await this.prisma.aiCreditLedger.create({
        data: {
          userId: user.id,
          monthlyQuota: quota,
          usedThisMonth: 0,
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    } else {
      // Check if 30 days elapsed for monthly reset
      if (new Date() > new Date(ledger.resetDate)) {
        ledger = await this.prisma.aiCreditLedger.update({
          where: { userId: user.id },
          data: {
            usedThisMonth: 0,
            monthlyQuota: quota,
            resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    const remaining = Math.max(0, (ledger.monthlyQuota + ledger.bonusCredits) - ledger.usedThisMonth);
    return {
      monthlyQuota: ledger.monthlyQuota,
      usedThisMonth: ledger.usedThisMonth,
      bonusCredits: ledger.bonusCredits,
      remainingCredits: remaining,
      resetDate: ledger.resetDate,
      isUnlimited: plan === GardenerSubscriptionPlan.PREMIUM,
    };
  }

  async recordPlantDiagnosis(user: AuthUser, dto: DiagnosePlantDto, aiResult: any) {
    const creditStatus = await this.getAiCreditStatus(user);
    if (creditStatus.remainingCredits <= 0 && !creditStatus.isUnlimited) {
      throw new ForbiddenException(
        'You have exhausted your monthly free AI plant doctor scans. Upgrade to Premium Garden Pass for unlimited diagnoses.',
      );
    }

    const diagnosis = await this.prisma.plantDiagnosis.create({
      data: {
        gardenerId: user.id,
        plantId: dto.plantId || null,
        leafPhotoUrl: dto.leafPhotoUrl,
        detectedIssue: aiResult.diseaseName || 'Healthy Leaf',
        category: aiResult.category || 'ORGANIC_WELLNESS',
        confidence: `${aiResult.confidenceScore || 95}%`,
        organicRemedy: aiResult.organicRemedy || 'Ensure balanced watering and adequate indirect sunlight.',
        chemicalRemedy: aiResult.firstAidSpray || null,
        preventiveCare: aiResult.dosageInstructions || null,
      },
    });

    await this.prisma.aiCreditLedger.update({
      where: { userId: user.id },
      data: { usedThisMonth: { increment: 1 } },
    });

    return diagnosis;
  }

  async addExpense(user: AuthUser, dto: CreateGardenExpenseDto) {
    if (!dto.gardenId) {
      throw new BadRequestException('Garden ID is required.');
    }
    await this.findOneOrThrow(user, dto.gardenId);
    return this.prisma.gardenExpense.create({
      data: {
        gardenId: dto.gardenId,
        plantId: dto.plantId,
        categoryName: (dto as any).category || (dto as any).title || 'General',
        amount: dto.amount,
        expenseDate: (dto as any).date ? new Date((dto as any).date) : new Date(),
        description: (dto as any).note || (dto as any).description,
        recordedById: user.id,
      },
    });
  }

  listExpenses(user: AuthUser) {
    return this.prisma.gardenExpense.findMany({
      where: { recordedById: user.id },
      include: {
        garden: { select: { id: true, name: true } },
        plant: { select: { id: true, name: true } },
      },
      orderBy: { expenseDate: 'desc' },
    });
  }

  async deleteExpense(user: AuthUser, id: string) {
    const expense = await this.prisma.gardenExpense.findUnique({ where: { id } });
    const isAdmin = hasActiveRole(user, Role.ADMIN) || hasActiveRole(user, Role.SUPER_ADMIN);
    if (!expense || (!isAdmin && expense.recordedById !== user.id)) {
      throw new NotFoundException('Expense not found.');
    }
    return this.prisma.gardenExpense.delete({ where: { id } });
  }
}
