import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { GardenerSubscriptionPlan, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GardenerPlansService, FREE_PLAN_MAX_PLANTS } from '../gardener-plans/gardener-plans.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { hasActiveRole } from '../../common/utils/auth-user.util';
import { CreateGardenDto } from './dto/create-garden.dto';
import { CreatePlantDto } from './dto/create-plant.dto';
import { CreateGardenExpenseDto } from './dto/create-garden-expense.dto';

@Injectable()
export class GardensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gardenerPlansService: GardenerPlansService,
  ) {}

  create(user: AuthUser, dto: CreateGardenDto) {
    return this.prisma.garden.create({ data: { ...dto, gardenerId: user.id } });
  }

  findAll(user: AuthUser) {
    const isAdmin = hasActiveRole(user, Role.ADMIN) || hasActiveRole(user, Role.SUPER_ADMIN);
    return this.prisma.garden.findMany({
      where: { ...(isAdmin ? {} : { gardenerId: user.id }) },
      include: { plants: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOrThrow(user: AuthUser, id: string) {
    const garden = await this.prisma.garden.findFirst({ where: { id }, include: { plants: true } });
    const isAdmin = hasActiveRole(user, Role.ADMIN) || hasActiveRole(user, Role.SUPER_ADMIN);
    if (!garden || (!isAdmin && garden.gardenerId !== user.id)) {
      throw new NotFoundException('Garden not found.');
    }
    return garden;
  }

  async addPlant(user: AuthUser, gardenId: string, dto: CreatePlantDto) {
    const garden = await this.findOneOrThrow(user, gardenId);

    if (hasActiveRole(user, Role.GARDENER) && !hasActiveRole(user, Role.ADMIN) && !hasActiveRole(user, Role.SUPER_ADMIN)) {
      const { plan } = await this.gardenerPlansService.getEffectivePlan(garden.gardenerId);
      if (plan === GardenerSubscriptionPlan.FREE) {
        const totalPlants = await this.prisma.plant.count({
          where: { deletedAt: null, garden: { gardenerId: garden.gardenerId } },
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
        gardenId: garden.id,
        plantedDate: plantedDate ? new Date(plantedDate) : undefined,
      },
    });
  }

  listPlants(user: AuthUser, gardenId: string) {
    return this.findOneOrThrow(user, gardenId).then(() =>
      this.prisma.plant.findMany({ where: { gardenId, deletedAt: null }, orderBy: { createdAt: 'desc' } }),
    );
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
