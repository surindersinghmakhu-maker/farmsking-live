import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { GardenerSubscriptionPlan, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GardenerPlansService, FREE_PLAN_MAX_PLANTS } from '../gardener-plans/gardener-plans.service';
import { AuthUser } from '../../common/types/auth-user.type';
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
    return this.prisma.garden.findMany({
      where: { ...(user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN ? {} : { gardenerId: user.id }) },
      include: { plants: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOrThrow(user: AuthUser, id: string) {
    const garden = await this.prisma.garden.findFirst({ where: { id }, include: { plants: true } });
    if (!garden || (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN && garden.gardenerId !== user.id)) {
      throw new NotFoundException('Garden not found.');
    }
    return garden;
  }

  async addPlant(user: AuthUser, gardenId: string, dto: CreatePlantDto) {
    const garden = await this.findOneOrThrow(user, gardenId);

    if (user.role === Role.GARDENER) {
      const { plan } = await this.gardenerPlansService.getEffectivePlan(user.id);
      if (plan === GardenerSubscriptionPlan.FREE) {
        const totalPlants = await this.prisma.plant.count({
          where: { deletedAt: null, garden: { gardenerId: user.id } },
        });
        if (totalPlants >= FREE_PLAN_MAX_PLANTS) {
          throw new ForbiddenException(
            `Free plan mein sirf ${FREE_PLAN_MAX_PLANTS} plants add ho sakte hain. Adhik plants ke liye PREMIUM plan len.`,
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

  addExpense(user: AuthUser, dto: any) {
    return this.prisma.gardenExpense.create({
      data: {
        gardenId: dto.gardenId,
        plantId: dto.plantId,
        categoryName: dto.category || dto.title || 'General',
        amount: dto.amount,
        expenseDate: dto.date ? new Date(dto.date) : new Date(),
        description: dto.note || dto.description,
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
    if (!expense || expense.recordedById !== user.id) {
      throw new NotFoundException('Expense not found.');
    }
    return this.prisma.gardenExpense.delete({ where: { id } });
  }
}
