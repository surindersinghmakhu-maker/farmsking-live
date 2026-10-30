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
exports.GardensService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const gardener_plans_service_1 = require("../gardener-plans/gardener-plans.service");
let GardensService = class GardensService {
    constructor(prisma, gardenerPlansService) {
        this.prisma = prisma;
        this.gardenerPlansService = gardenerPlansService;
    }
    create(user, dto) {
        return this.prisma.garden.create({ data: { ...dto, gardenerId: user.id } });
    }
    findAll(user) {
        return this.prisma.garden.findMany({
            where: { ...(user.role === client_1.Role.ADMIN || user.role === client_1.Role.SUPER_ADMIN ? {} : { gardenerId: user.id }) },
            include: { plants: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOneOrThrow(user, id) {
        const garden = await this.prisma.garden.findFirst({ where: { id }, include: { plants: true } });
        if (!garden || (user.role !== client_1.Role.ADMIN && user.role !== client_1.Role.SUPER_ADMIN && garden.gardenerId !== user.id)) {
            throw new common_1.NotFoundException('Garden not found.');
        }
        return garden;
    }
    async addPlant(user, gardenId, dto) {
        const garden = await this.findOneOrThrow(user, gardenId);
        if (user.role === client_1.Role.GARDENER) {
            const { plan } = await this.gardenerPlansService.getEffectivePlan(user.id);
            if (plan === client_1.GardenerSubscriptionPlan.FREE) {
                const totalPlants = await this.prisma.plant.count({
                    where: { deletedAt: null, garden: { gardenerId: user.id } },
                });
                if (totalPlants >= gardener_plans_service_1.FREE_PLAN_MAX_PLANTS) {
                    throw new common_1.ForbiddenException(`Free plan mein sirf ${gardener_plans_service_1.FREE_PLAN_MAX_PLANTS} plants add ho sakte hain. Adhik plants ke liye PREMIUM plan len.`);
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
    listPlants(user, gardenId) {
        return this.findOneOrThrow(user, gardenId).then(() => this.prisma.plant.findMany({ where: { gardenId, deletedAt: null }, orderBy: { createdAt: 'desc' } }));
    }
    addExpense(user, dto) {
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
    listExpenses(user) {
        return this.prisma.gardenExpense.findMany({
            where: { recordedById: user.id },
            include: {
                garden: { select: { id: true, name: true } },
                plant: { select: { id: true, name: true } },
            },
            orderBy: { expenseDate: 'desc' },
        });
    }
    async deleteExpense(user, id) {
        const expense = await this.prisma.gardenExpense.findUnique({ where: { id } });
        if (!expense || expense.recordedById !== user.id) {
            throw new common_1.NotFoundException('Expense not found.');
        }
        return this.prisma.gardenExpense.delete({ where: { id } });
    }
};
exports.GardensService = GardensService;
exports.GardensService = GardensService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        gardener_plans_service_1.GardenerPlansService])
], GardensService);
//# sourceMappingURL=gardens.service.js.map