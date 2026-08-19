import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMode, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FarmsService } from '../farms/farms.service';
import { PlotsService } from '../plots/plots.service';
import { CropsService } from '../crops/crops.service';
import { PartiesService } from '../parties/parties.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly farmsService: FarmsService,
    private readonly plotsService: PlotsService,
    private readonly cropsService: CropsService,
    private readonly partiesService: PartiesService,
  ) {}

  private async assertRelationsBelongToFarm(user: AuthUser, farmId: string, plotId?: string, cropCycleId?: string) {
    if (plotId) {
      const plot = await this.plotsService.findOneOrThrow(user, plotId);
      if (plot.farmId !== farmId) {
        throw new BadRequestException('The selected plot does not belong to the selected farm.');
      }
    }

    if (cropCycleId) {
      const cropCycle = await this.cropsService.findOneOrThrow(user, cropCycleId);
      if (plotId && cropCycle.plotId !== plotId) {
        throw new BadRequestException('The selected crop does not belong to the selected plot.');
      }
      if (cropCycle.plot.farmId !== farmId) {
        throw new BadRequestException('The selected crop does not belong to the selected farm.');
      }
    }
  }

  listCategories() {
    return this.prisma.expenseCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(user: AuthUser, dto: CreateExpenseDto) {
    await this.farmsService.findOneOrThrow(user, dto.farmId);
    await this.assertRelationsBelongToFarm(user, dto.farmId, dto.plotId, dto.cropCycleId);

    const { expenseDate, ...rest } = dto;
    const expense = await this.prisma.expense.create({
      data: { ...rest, expenseDate: new Date(expenseDate), recordedById: user.id },
      include: { category: true, cropCycle: { select: { id: true, cropName: true } } },
    });

    if (dto.paymentMode === PaymentMode.CREDIT && dto.partyId) {
      await this.partiesService.recordExpenseCredit(
        dto.partyId,
        expense.id,
        Number(expense.amount),
        dto.notes?.trim() || dto.vendorName?.trim() || expense.category.labelEn,
      );
    }

    return expense;
  }

  findAllForFarm(user: AuthUser, farmId: string) {
    return this.farmsService.findOneOrThrow(user, farmId).then(() =>
      this.prisma.expense.findMany({
        where: { farmId, deletedAt: null },
        include: { category: true, cropCycle: { select: { id: true, cropName: true } } },
        orderBy: { expenseDate: 'desc' },
      }),
    );
  }

  async findOneOrThrow(user: AuthUser, id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, deletedAt: null },
      include: { category: true, farm: true, cropCycle: { select: { id: true, cropName: true } } },
    });

    if (!expense || (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN && expense.farm.ownerId !== user.id)) {
      throw new NotFoundException('Expense not found.');
    }

    return expense;
  }

  async update(user: AuthUser, id: string, dto: UpdateExpenseDto) {
    const existing = await this.findOneOrThrow(user, id);
    await this.assertRelationsBelongToFarm(
      user,
      existing.farmId,
      dto.plotId ?? existing.plotId ?? undefined,
      dto.cropCycleId ?? existing.cropCycleId ?? undefined,
    );

    const { expenseDate, ...rest } = dto;
    return this.prisma.expense.update({
      where: { id },
      data: { ...rest, ...(expenseDate ? { expenseDate: new Date(expenseDate) } : {}) },
      include: { category: true, cropCycle: { select: { id: true, cropName: true } } },
    });
  }

  async remove(user: AuthUser, id: string) {
    await this.findOneOrThrow(user, id);
    return this.prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
