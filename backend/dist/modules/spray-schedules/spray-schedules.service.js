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
exports.SprayScheduleService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const advisor_assignment_service_1 = require("../advisor-assignment/advisor-assignment.service");
const notifications_service_1 = require("../notifications/notifications.service");
let SprayScheduleService = class SprayScheduleService {
    prisma;
    advisorAssignmentService;
    notificationsService;
    constructor(prisma, advisorAssignmentService, notificationsService) {
        this.prisma = prisma;
        this.advisorAssignmentService = advisorAssignmentService;
        this.notificationsService = notificationsService;
    }
    async assertAdvisorAssignedToCropCycle(advisorId, cropCycleId) {
        const cropCycle = await this.prisma.cropCycle.findFirst({
            where: { id: cropCycleId, deletedAt: null },
            include: { plot: { include: { farm: true } } },
        });
        if (!cropCycle) {
            throw new common_1.NotFoundException('Crop cycle not found.');
        }
        await this.advisorAssignmentService.assertAdvisorAssignedToFarmer(advisorId, cropCycle.plot.farm.ownerId);
        return cropCycle;
    }
    async rememberProductNames(names) {
        const unique = Array.from(new Set(names.filter((n) => !!n?.trim()).map((n) => n.trim())));
        if (unique.length === 0)
            return;
        await Promise.all(unique.map((name) => this.prisma.sprayProductCatalog
            .upsert({ where: { name }, update: {}, create: { name } })
            .catch(() => undefined)));
    }
    async create(user, dto) {
        const cropCycle = await this.assertAdvisorAssignedToCropCycle(user.id, dto.cropCycleId);
        if (cropCycle.status === client_1.CropStatus.COMPLETED) {
            throw new common_1.ForbiddenException('This crop is completed and locked — no schedule changes allowed.');
        }
        const { scheduledDate, ...rest } = dto;
        const schedule = await this.prisma.spraySchedule.create({
            data: { ...rest, scheduledDate: new Date(scheduledDate), createdByAdvisorId: user.id },
        });
        await this.rememberProductNames([dto.recommendedProduct, dto.alternativeOption, dto.alternativeOption2]);
        await this.notificationsService.create(cropCycle.plot.farm.ownerId, client_1.NotificationType.SPRAY_REMINDER, 'New spray schedule added', `Your advisor scheduled "${dto.recommendedProduct}" for ${cropCycle.cropName} on ${new Date(scheduledDate).toLocaleDateString('en-IN')}.`, { cropCycleId: cropCycle.id, sprayScheduleId: schedule.id });
        return schedule;
    }
    async listForCrop(user, cropCycleId) {
        const cropCycle = await this.prisma.cropCycle.findFirst({
            where: { id: cropCycleId, deletedAt: null },
            include: { plot: { include: { farm: true } } },
        });
        if (!cropCycle) {
            throw new common_1.NotFoundException('Crop cycle not found.');
        }
        if (user.role === client_1.Role.ADVISOR) {
            await this.advisorAssignmentService.assertAdvisorAssignedToFarmer(user.id, cropCycle.plot.farm.ownerId);
        }
        else if (cropCycle.plot.farm.ownerId !== user.id && user.role !== client_1.Role.ADMIN && user.role !== client_1.Role.SUPER_ADMIN) {
            throw new common_1.NotFoundException('Crop cycle not found.');
        }
        return this.prisma.spraySchedule.findMany({
            where: { cropCycleId, deletedAt: null },
            orderBy: { scheduledDate: 'asc' },
        });
    }
    async update(user, id, dto) {
        const existing = await this.prisma.spraySchedule.findFirst({ where: { id, deletedAt: null } });
        if (!existing) {
            throw new common_1.NotFoundException('Spray schedule item not found.');
        }
        await this.assertAdvisorAssignedToCropCycle(user.id, existing.cropCycleId);
        const { ...rest } = dto;
        const data = { ...rest };
        if (dto.scheduledDate)
            data.scheduledDate = new Date(dto.scheduledDate);
        const updated = await this.prisma.spraySchedule.update({ where: { id }, data });
        await this.rememberProductNames([dto.recommendedProduct, dto.alternativeOption, dto.alternativeOption2]);
        return updated;
    }
    async remove(user, id) {
        const existing = await this.prisma.spraySchedule.findFirst({ where: { id, deletedAt: null } });
        if (!existing) {
            throw new common_1.NotFoundException('Spray schedule item not found.');
        }
        await this.assertAdvisorAssignedToCropCycle(user.id, existing.cropCycleId);
        return this.prisma.spraySchedule.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    async searchCatalog(query) {
        const q = (query ?? '').trim();
        return this.prisma.sprayProductCatalog.findMany({
            where: { deletedAt: null, ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}) },
            orderBy: { name: 'asc' },
            take: 20,
        });
    }
};
exports.SprayScheduleService = SprayScheduleService;
exports.SprayScheduleService = SprayScheduleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        advisor_assignment_service_1.AdvisorAssignmentService,
        notifications_service_1.NotificationsService])
], SprayScheduleService);
//# sourceMappingURL=spray-schedules.service.js.map