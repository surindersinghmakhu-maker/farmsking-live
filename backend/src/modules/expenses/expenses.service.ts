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

  listAllCategoriesForAdmin() {
    return this.prisma.expenseCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCategory(dto: { key: string; labelEn: string; labelHi?: string; sortOrder?: number }) {
    const existing = await this.prisma.expenseCategory.findUnique({ where: { key: dto.key } });
    if (existing) {
      throw new BadRequestException('Expense category key already exists.');
    }
    return this.prisma.expenseCategory.create({
      data: {
        key: dto.key,
        labelEn: dto.labelEn,
        labelHi: dto.labelHi || dto.labelEn,
        sortOrder: dto.sortOrder ?? 10,
        isSystem: false,
        isActive: true,
      },
    });
  }

  async updateCategory(id: string, dto: { labelEn?: string; labelHi?: string; sortOrder?: number; isActive?: boolean }) {
    const existing = await this.prisma.expenseCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Expense category not found.');
    return this.prisma.expenseCategory.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCategory(id: string) {
    const existing = await this.prisma.expenseCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Expense category not found.');
    return this.prisma.expenseCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async resolveCategoryId(categoryId?: string): Promise<string> {
    if (!categoryId) {
      const first = await this.prisma.expenseCategory.findFirst({ where: { isActive: true } });
      return first ? first.id : categoryId as string;
    }

    const byId = await this.prisma.expenseCategory.findUnique({ where: { id: categoryId } });
    if (byId) return byId.id;

    const cleanKey = categoryId.replace(/^cat_/, '').toLowerCase();
    const byKey = await this.prisma.expenseCategory.findFirst({
      where: {
        OR: [
          { key: categoryId },
          { key: cleanKey },
        ],
      },
    });
    if (byKey) return byKey.id;

    const fallback = await this.prisma.expenseCategory.findFirst({ where: { isActive: true } });
    return fallback ? fallback.id : categoryId;
  }

  async create(user: AuthUser, dto: CreateExpenseDto) {
    await this.farmsService.findOneOrThrow(user, dto.farmId);
    
    const validCategoryId = await this.resolveCategoryId(dto.categoryId);

    let validPartyId: string | undefined = undefined;
    if (dto.partyId) {
      const cleanPartyId = dto.partyId.replace(/^labour_/, '');
      const partyExists = await this.prisma.party.findFirst({ where: { id: cleanPartyId, deletedAt: null } });
      if (partyExists) validPartyId = partyExists.id;
    }

    let validCropCycleId: string | undefined = undefined;
    if (dto.cropCycleId) {
      const cropExists = await this.prisma.cropCycle.findFirst({ where: { id: dto.cropCycleId, deletedAt: null } });
      if (cropExists) validCropCycleId = cropExists.id;
    }

    await this.assertRelationsBelongToFarm(user, dto.farmId, dto.plotId, validCropCycleId);

    const { expenseDate, categoryId, partyId, cropCycleId, ...rest } = dto;
    const expense = await this.prisma.expense.create({
      data: {
        ...rest,
        categoryId: validCategoryId,
        partyId: validPartyId,
        cropCycleId: validCropCycleId,
        expenseDate: new Date(expenseDate),
        recordedById: user.id,
      },
      include: { category: true, cropCycle: { select: { id: true, cropName: true } } },
    });

    if (dto.paymentMode === PaymentMode.CREDIT && validPartyId) {
      await this.partiesService.recordExpenseCredit(
        validPartyId,
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

    let validCategoryId = existing.categoryId;
    if (dto.categoryId) {
      validCategoryId = await this.resolveCategoryId(dto.categoryId);
    }

    let validPartyId = existing.partyId ?? undefined;
    if (dto.partyId !== undefined) {
      if (dto.partyId) {
        const cleanPartyId = dto.partyId.replace(/^labour_/, '');
        const partyExists = await this.prisma.party.findFirst({ where: { id: cleanPartyId, deletedAt: null } });
        validPartyId = partyExists ? partyExists.id : undefined;
      } else {
        validPartyId = undefined;
      }
    }

    let validCropCycleId = existing.cropCycleId ?? undefined;
    if (dto.cropCycleId !== undefined) {
      if (dto.cropCycleId) {
        const cropExists = await this.prisma.cropCycle.findFirst({ where: { id: dto.cropCycleId, deletedAt: null } });
        validCropCycleId = cropExists ? cropExists.id : undefined;
      } else {
        validCropCycleId = undefined;
      }
    }

    await this.assertRelationsBelongToFarm(
      user,
      existing.farmId,
      dto.plotId ?? existing.plotId ?? undefined,
      validCropCycleId,
    );

    const { expenseDate, categoryId, partyId, cropCycleId, ...rest } = dto;
    return this.prisma.expense.update({
      where: { id },
      data: {
        ...rest,
        categoryId: validCategoryId,
        partyId: validPartyId,
        cropCycleId: validCropCycleId,
        ...(expenseDate ? { expenseDate: new Date(expenseDate) } : {}),
      },
      include: { category: true, cropCycle: { select: { id: true, cropName: true } } },
    });
  }

  async remove(user: AuthUser, id: string) {
    await this.findOneOrThrow(user, id);
    return this.prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
