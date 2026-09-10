"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpensesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const farms_service_1 = require("../farms/farms.service");
const plots_service_1 = require("../plots/plots.service");
const crops_service_1 = require("../crops/crops.service");
const parties_service_1 = require("../parties/parties.service");
let ExpensesService = class ExpensesService {
    prisma;
    farmsService;
    plotsService;
    cropsService;
    partiesService;
    constructor(prisma, farmsService, plotsService, cropsService, partiesService) {
        this.prisma = prisma;
        this.farmsService = farmsService;
        this.plotsService = plotsService;
        this.cropsService = cropsService;
        this.partiesService = partiesService;
    }
    async assertRelationsBelongToFarm(user, farmId, plotId, cropCycleId) {
        if (plotId) {
            const plot = await this.plotsService.findOneOrThrow(user, plotId);
            if (plot.farmId !== farmId) {
                throw new common_1.BadRequestException('The selected plot does not belong to the selected farm.');
            }
        }
        if (cropCycleId) {
            const cropCycle = await this.cropsService.findOneOrThrow(user, cropCycleId);
            if (plotId && cropCycle.plotId !== plotId) {
                throw new common_1.BadRequestException('The selected crop does not belong to the selected plot.');
            }
            if (cropCycle.plot.farmId !== farmId) {
                throw new common_1.BadRequestException('The selected crop does not belong to the selected farm.');
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
    async createCategory(dto) {
        const existing = await this.prisma.expenseCategory.findUnique({ where: { key: dto.key } });
        if (existing) {
            throw new common_1.BadRequestException('Expense category key already exists.');
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
    async updateCategory(id, dto) {
        const existing = await this.prisma.expenseCategory.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Expense category not found.');
        return this.prisma.expenseCategory.update({
            where: { id },
            data: dto,
        });
    }
    async deleteCategory(id) {
        const existing = await this.prisma.expenseCategory.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Expense category not found.');
        return this.prisma.expenseCategory.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async resolveCategoryId(categoryId) {
        if (!categoryId) {
            const first = await this.prisma.expenseCategory.findFirst({ where: { isActive: true } });
            return first ? first.id : categoryId;
        }
        const byId = await this.prisma.expenseCategory.findUnique({ where: { id: categoryId } });
        if (byId)
            return byId.id;
        const cleanKey = categoryId.replace(/^cat_/, '').toLowerCase();
        const byKey = await this.prisma.expenseCategory.findFirst({
            where: {
                OR: [
                    { key: categoryId },
                    { key: cleanKey },
                ],
            },
        });
        if (byKey)
            return byKey.id;
        const fallback = await this.prisma.expenseCategory.findFirst({ where: { isActive: true } });
        return fallback ? fallback.id : categoryId;
    }
    async create(user, dto) {
        await this.farmsService.findOneOrThrow(user, dto.farmId);
        const validCategoryId = await this.resolveCategoryId(dto.categoryId);
        let validPartyId = undefined;
        if (dto.partyId) {
            const cleanPartyId = dto.partyId.replace(/^labour_/, '');
            const partyExists = await this.prisma.party.findFirst({ where: { id: cleanPartyId, deletedAt: null } });
            if (partyExists)
                validPartyId = partyExists.id;
        }
        let validCropCycleId = undefined;
        if (dto.cropCycleId) {
            const cropExists = await this.prisma.cropCycle.findFirst({ where: { id: dto.cropCycleId, deletedAt: null } });
            if (cropExists)
                validCropCycleId = cropExists.id;
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
        if (dto.paymentMode === client_1.PaymentMode.CREDIT && validPartyId) {
            await this.partiesService.recordExpenseCredit(validPartyId, expense.id, Number(expense.amount), dto.notes?.trim() || dto.vendorName?.trim() || expense.category.labelEn);
        }
        return expense;
    }
    findAllForFarm(user, farmId) {
        return this.farmsService.findOneOrThrow(user, farmId).then(() => this.prisma.expense.findMany({
            where: { farmId, deletedAt: null },
            include: { category: true, cropCycle: { select: { id: true, cropName: true } } },
            orderBy: { expenseDate: 'desc' },
        }));
    }
    async findOneOrThrow(user, id) {
        const expense = await this.prisma.expense.findFirst({
            where: { id, deletedAt: null },
            include: { category: true, farm: true, cropCycle: { select: { id: true, cropName: true } } },
        });
        if (!expense || (user.role !== client_1.Role.ADMIN && user.role !== client_1.Role.SUPER_ADMIN && expense.farm.ownerId !== user.id)) {
            throw new common_1.NotFoundException('Expense not found.');
        }
        return expense;
    }
    async update(user, id, dto) {
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
            }
            else {
                validPartyId = undefined;
            }
        }
        let validCropCycleId = existing.cropCycleId ?? undefined;
        if (dto.cropCycleId !== undefined) {
            if (dto.cropCycleId) {
                const cropExists = await this.prisma.cropCycle.findFirst({ where: { id: dto.cropCycleId, deletedAt: null } });
                validCropCycleId = cropExists ? cropExists.id : undefined;
            }
            else {
                validCropCycleId = undefined;
            }
        }
        await this.assertRelationsBelongToFarm(user, existing.farmId, dto.plotId ?? existing.plotId ?? undefined, validCropCycleId);
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
    async remove(user, id) {
        const expense = await this.findOneOrThrow(user, id);
        await this.prisma.partyLedgerEntry.deleteMany({
            where: { expenseId: expense.id },
        });
        return this.prisma.expense.update({ where: { id: expense.id }, data: { deletedAt: new Date() } });
    }
};
exports.ExpensesService = ExpensesService;
exports.ExpensesService = ExpensesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        farms_service_1.FarmsService,
        plots_service_1.PlotsService,
        crops_service_1.CropsService,
        parties_service_1.PartiesService])
], ExpensesService);
//# sourceMappingURL=expenses.service.js.map