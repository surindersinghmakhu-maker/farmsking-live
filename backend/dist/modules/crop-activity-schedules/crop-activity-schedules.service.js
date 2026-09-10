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
exports.CropActivitySchedulesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const crops_service_1 = require("../crops/crops.service");
const advisor_assignment_service_1 = require("../advisor-assignment/advisor-assignment.service");
const notifications_service_1 = require("../notifications/notifications.service");
const chat_service_1 = require("../chat/chat.service");
const chat_gateway_1 = require("../chat/chat.gateway");
let CropActivitySchedulesService = class CropActivitySchedulesService {
    prisma;
    cropsService;
    advisorAssignmentService;
    notificationsService;
    chatService;
    chatGateway;
    constructor(prisma, cropsService, advisorAssignmentService, notificationsService, chatService, chatGateway) {
        this.prisma = prisma;
        this.cropsService = cropsService;
        this.advisorAssignmentService = advisorAssignmentService;
        this.notificationsService = notificationsService;
        this.chatService = chatService;
        this.chatGateway = chatGateway;
    }
    assertCropCycleNotLocked(cropCycle) {
        if (cropCycle.status === client_1.CropStatus.COMPLETED) {
            throw new common_1.ForbiddenException('This crop is completed and locked — no schedule changes allowed.');
        }
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
    async create(user, dto) {
        const cropCycle = await this.assertAdvisorAssignedToCropCycle(user.id, dto.cropCycleId);
        this.assertCropCycleNotLocked(cropCycle);
        const { scheduledDate, ...rest } = dto;
        const activity = await this.prisma.cropActivitySchedule.create({
            data: { ...rest, scheduledDate: new Date(scheduledDate), createdByAdvisorId: user.id },
        });
        await this.notificationsService.create(cropCycle.plot.farm.ownerId, client_1.NotificationType.SPRAY_REMINDER, 'New schedule added', `Your advisor scheduled "${dto.title}" for ${cropCycle.cropName} on ${new Date(scheduledDate).toLocaleDateString('en-IN')}.`, { cropCycleId: cropCycle.id, activityId: activity.id });
        return activity;
    }
    async bulkCreate(user, dto) {
        const cropCycle = await this.assertAdvisorAssignedToCropCycle(user.id, dto.cropCycleId);
        this.assertCropCycleNotLocked(cropCycle);
        const created = await this.prisma.$transaction(dto.items.map((item) => this.prisma.cropActivitySchedule.create({
            data: {
                cropCycleId: dto.cropCycleId,
                activityType: item.activityType,
                title: item.title,
                description: item.description,
                scheduledDate: new Date(item.scheduledDate),
                notes: item.notes,
                createdByAdvisorId: user.id,
            },
        })));
        await this.notificationsService.create(cropCycle.plot.farm.ownerId, client_1.NotificationType.SPRAY_REMINDER, 'New schedule added', `Your advisor added ${created.length} new schedule task(s) for ${cropCycle.cropName}.`, { cropCycleId: cropCycle.id });
        return created;
    }
    async findAllForCropCycle(user, cropCycleId) {
        if (user.role === client_1.Role.FARMER) {
            await this.cropsService.findOneOrThrow(user, cropCycleId);
        }
        else if (user.role === client_1.Role.ADVISOR) {
            await this.assertAdvisorAssignedToCropCycle(user.id, cropCycleId);
        }
        return this.prisma.cropActivitySchedule.findMany({
            where: { cropCycleId, deletedAt: null },
            orderBy: { scheduledDate: 'asc' },
        });
    }
    findTodayForFarmer(user) {
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
    ADVISOR_SCHEDULE_INCLUDE = {
        cropCycle: {
            select: {
                id: true,
                cropName: true,
                plot: {
                    select: {
                        id: true,
                        name: true,
                        farm: { select: { id: true, name: true, owner: { select: { id: true, name: true, mobile: true } } } },
                    },
                },
            },
        },
    };
    advisorScopedWhere(advisorId) {
        return {
            deletedAt: null,
            cropCycle: {
                plot: {
                    farm: {
                        owner: {
                            advisorAssignmentsAsFarmer: {
                                some: {
                                    advisorId,
                                    status: 'ACTIVE',
                                    deletedAt: null,
                                    OR: [{ subscriptionId: null }, { subscription: { endDate: null } }, { subscription: { endDate: { gt: new Date() } } }],
                                },
                            },
                        },
                    },
                },
            },
        };
    }
    findTodayForAdvisor(user) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        return this.prisma.cropActivitySchedule.findMany({
            where: { ...this.advisorScopedWhere(user.id), scheduledDate: { gte: startOfDay, lte: endOfDay } },
            include: this.ADVISOR_SCHEDULE_INCLUDE,
            orderBy: { scheduledDate: 'asc' },
        });
    }
    findUpcomingForAdvisor(user) {
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        const sevenDaysOut = new Date();
        sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
        sevenDaysOut.setHours(23, 59, 59, 999);
        return this.prisma.cropActivitySchedule.findMany({
            where: { ...this.advisorScopedWhere(user.id), scheduledDate: { gt: endOfToday, lte: sevenDaysOut } },
            include: this.ADVISOR_SCHEDULE_INCLUDE,
            orderBy: { scheduledDate: 'asc' },
        });
    }
    findDelayedForAdvisor(user) {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return this.prisma.cropActivitySchedule.findMany({
            where: {
                ...this.advisorScopedWhere(user.id),
                status: client_1.ActivityStatus.PENDING,
                scheduledDate: { lt: startOfToday },
            },
            include: this.ADVISOR_SCHEDULE_INCLUDE,
            orderBy: { scheduledDate: 'asc' },
        });
    }
    async findOneOrThrow(id) {
        const activity = await this.prisma.cropActivitySchedule.findFirst({
            where: { id, deletedAt: null },
            include: { cropCycle: { include: { plot: { include: { farm: true } } } } },
        });
        if (!activity) {
            throw new common_1.NotFoundException('Scheduled activity not found.');
        }
        return activity;
    }
    async remind(user, id) {
        const activity = await this.findOneOrThrow(id);
        await this.advisorAssignmentService.assertAdvisorAssignedToFarmer(user.id, activity.cropCycle.plot.farm.ownerId);
        const farmerId = activity.cropCycle.plot.farm.ownerId;
        const dueDate = new Date(activity.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        const reminderText = `Reminder: "${activity.title}" for ${activity.cropCycle.cropName} was scheduled for ${dueDate}. Please complete it soon.`;
        await this.notificationsService.create(farmerId, client_1.NotificationType.SPRAY_REMINDER, `Reminder from your advisor`, reminderText, { cropCycleId: activity.cropCycleId, activityId: id, isReminder: true });
        const message = await this.chatService.sendMessage(user, farmerId, reminderText);
        this.chatGateway.server.to((0, chat_gateway_1.userRoom)(user.id)).to((0, chat_gateway_1.userRoom)(farmerId)).emit('new_message', message);
        return { success: true };
    }
    async update(user, id, dto) {
        const activity = await this.findOneOrThrow(id);
        await this.advisorAssignmentService.assertAdvisorAssignedToFarmer(user.id, activity.cropCycle.plot.farm.ownerId);
        this.assertCropCycleNotLocked(activity.cropCycle);
        const { scheduledDate, ...rest } = dto;
        const updated = await this.prisma.cropActivitySchedule.update({
            where: { id },
            data: { ...rest, ...(scheduledDate ? { scheduledDate: new Date(scheduledDate) } : {}) },
        });
        await this.notificationsService.create(activity.cropCycle.plot.farm.ownerId, client_1.NotificationType.SPRAY_REMINDER, 'Schedule updated', `Your advisor updated the schedule "${updated.title}" for ${activity.cropCycle.cropName}.`, { cropCycleId: activity.cropCycleId, activityId: id });
        return updated;
    }
    async complete(user, id, dto) {
        const activity = await this.findOneOrThrow(id);
        if (activity.cropCycle.plot.farm.ownerId !== user.id) {
            throw new common_1.NotFoundException('Scheduled activity not found.');
        }
        this.assertCropCycleNotLocked(activity.cropCycle);
        return this.prisma.cropActivitySchedule.update({
            where: { id },
            data: {
                status: client_1.ActivityStatus.COMPLETED,
                completedAt: new Date(),
                completedById: user.id,
                ...(dto.notes ? { notes: dto.notes } : {}),
            },
        });
    }
    async remove(user, id) {
        const activity = await this.findOneOrThrow(id);
        await this.advisorAssignmentService.assertAdvisorAssignedToFarmer(user.id, activity.cropCycle.plot.farm.ownerId);
        this.assertCropCycleNotLocked(activity.cropCycle);
        return this.prisma.cropActivitySchedule.update({ where: { id }, data: { deletedAt: new Date() } });
    }
};
exports.CropActivitySchedulesService = CropActivitySchedulesService;
exports.CropActivitySchedulesService = CropActivitySchedulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        crops_service_1.CropsService,
        advisor_assignment_service_1.AdvisorAssignmentService,
        notifications_service_1.NotificationsService,
        chat_service_1.ChatService,
        chat_gateway_1.ChatGateway])
], CropActivitySchedulesService);
//# sourceMappingURL=crop-activity-schedules.service.js.map