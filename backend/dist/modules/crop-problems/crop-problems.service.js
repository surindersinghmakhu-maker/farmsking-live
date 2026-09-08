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
exports.CropProblemsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const crops_service_1 = require("../crops/crops.service");
const notifications_service_1 = require("../notifications/notifications.service");
const chat_service_1 = require("../chat/chat.service");
const chat_gateway_1 = require("../chat/chat.gateway");
const DETAIL_INCLUDE = {
    photos: true,
    reportedBy: { select: { id: true, name: true, mobile: true, sprayTankSizeL: true } },
    assignedAdvisor: { select: { id: true, name: true, mobile: true } },
    cropCycle: { select: { id: true, cropName: true, plot: { select: { id: true, name: true, farmId: true } } } },
};
let CropProblemsService = class CropProblemsService {
    prisma;
    cropsService;
    notificationsService;
    chatService;
    chatGateway;
    constructor(prisma, cropsService, notificationsService, chatService, chatGateway) {
        this.prisma = prisma;
        this.cropsService = cropsService;
        this.notificationsService = notificationsService;
        this.chatService = chatService;
        this.chatGateway = chatGateway;
    }
    async create(user, dto) {
        const cropCycle = await this.cropsService.findOneOrThrow(user, dto.cropCycleId);
        const activeAssignment = await this.prisma.advisorAssignment.findFirst({
            where: { farmerId: user.id, status: { in: ['ACTIVE', 'PENDING'] }, deletedAt: null },
            orderBy: { startDate: 'desc' },
        });
        const { photoUrls, ...rest } = dto;
        const problem = await this.prisma.cropProblem.create({
            data: {
                ...rest,
                reportedById: user.id,
                assignedAdvisorId: activeAssignment?.advisorId,
                photos: photoUrls?.length ? { create: photoUrls.map((photoUrl) => ({ photoUrl })) } : undefined,
            },
            include: DETAIL_INCLUDE,
        });
        if (activeAssignment?.advisorId) {
            await this.notificationsService.create(activeAssignment.advisorId, client_1.NotificationType.CROP_PROBLEM_UPDATE, 'New problem reported', `${user.name} reported a problem on ${cropCycle.cropName}: "${dto.title}".`, { cropProblemId: problem.id, cropCycleId: dto.cropCycleId });
        }
        return problem;
    }
    findAllForFarmer(user) {
        return this.prisma.cropProblem.findMany({
            where: { reportedById: user.id, deletedAt: null },
            include: DETAIL_INCLUDE,
            orderBy: { createdAt: 'desc' },
        });
    }
    findAllForAdvisor(user) {
        return this.prisma.cropProblem.findMany({
            where: {
                assignedAdvisorId: user.id,
                deletedAt: null,
            },
            include: DETAIL_INCLUDE,
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOneOrThrow(user, id) {
        const problem = await this.prisma.cropProblem.findFirst({
            where: { id, deletedAt: null },
            include: DETAIL_INCLUDE,
        });
        if (!problem ||
            (user.role !== client_1.Role.ADMIN &&
                user.role !== client_1.Role.SUPER_ADMIN &&
                problem.reportedById !== user.id &&
                problem.assignedAdvisorId !== user.id)) {
            throw new common_1.NotFoundException('Crop problem not found.');
        }
        return problem;
    }
    async pickSprayInsertDate(cropCycleId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        const conflict = await this.prisma.spraySchedule.findFirst({
            where: {
                cropCycleId,
                deletedAt: null,
                scheduledDate: { gte: today, lt: dayAfterTomorrow },
            },
        });
        if (conflict) {
            const pushedDate = new Date(today);
            pushedDate.setDate(pushedDate.getDate() + 3);
            return pushedDate;
        }
        return tomorrow;
    }
    async respond(user, id, dto) {
        const problem = await this.findOneOrThrow(user, id);
        if (problem.assignedAdvisorId !== user.id) {
            throw new common_1.NotFoundException('Crop problem not found.');
        }
        const { followUpDate, status, ...rest } = dto;
        const nextStatus = status ?? client_1.CropProblemStatus.ADVISOR_RESPONDED;
        const updated = await this.prisma.cropProblem.update({
            where: { id },
            data: {
                ...rest,
                status: nextStatus,
                followUpDate: followUpDate ? new Date(followUpDate) : undefined,
                resolvedAt: nextStatus === client_1.CropProblemStatus.RESOLVED ? new Date() : undefined,
            },
            include: DETAIL_INCLUDE,
        });
        let insertedScheduleDate = null;
        if (dto.recommendedProduct?.trim()) {
            insertedScheduleDate = await this.pickSprayInsertDate(problem.cropCycleId);
            await this.prisma.spraySchedule.create({
                data: {
                    cropCycleId: problem.cropCycleId,
                    scheduledDate: insertedScheduleDate,
                    recommendedProduct: dto.recommendedProduct.trim(),
                    dosageInstructions: dto.advisorResponse,
                    createdByAdvisorId: user.id,
                    notes: `Advisor solution for reported problem: "${problem.title}"`,
                },
            });
        }
        const dateLabel = insertedScheduleDate
            ? insertedScheduleDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : null;
        await this.notificationsService.create(problem.reportedById, client_1.NotificationType.CROP_PROBLEM_UPDATE, 'Advisor responded to your problem report', `Your advisor responded to "${problem.title}": ${dto.advisorResponse ?? 'See details in the app.'}`, { cropProblemId: id });
        const chatText = dateLabel
            ? `${dto.advisorResponse}\n\nSolution also added in your schedule (${dateLabel}).`
            : dto.advisorResponse;
        const message = await this.chatService.sendMessage(user, problem.reportedById, chatText);
        this.chatGateway.server.to((0, chat_gateway_1.userRoom)(user.id)).to((0, chat_gateway_1.userRoom)(problem.reportedById)).emit('new_message', message);
        return { ...updated, insertedScheduleDate };
    }
    async updateStatus(user, id, dto) {
        const problem = await this.findOneOrThrow(user, id);
        const updated = await this.prisma.cropProblem.update({
            where: { id },
            data: {
                status: dto.status,
                resolvedAt: dto.status === client_1.CropProblemStatus.RESOLVED ? new Date() : undefined,
            },
            include: DETAIL_INCLUDE,
        });
        const isResolved = dto.status === client_1.CropProblemStatus.RESOLVED;
        const titleText = isResolved ? '✅ Problem Solved' : `Problem Status: ${dto.status}`;
        const bodyText = isResolved
            ? `Your reported crop problem "${problem.title}" has been marked as RESOLVED by ${user.name || 'Admin'}.`
            : `Your reported crop problem "${problem.title}" status is now ${dto.status}.`;
        await this.notificationsService.create(problem.reportedById, client_1.NotificationType.CROP_PROBLEM_UPDATE, titleText, bodyText, { cropProblemId: id, status: dto.status });
        const chatText = isResolved
            ? `✓ Problem Solved: Your crop problem "${problem.title}" has been resolved.`
            : `Problem Status Update: "${problem.title}" is now ${dto.status}.`;
        try {
            const message = await this.chatService.sendMessage(user, problem.reportedById, chatText);
            this.chatGateway.server.to((0, chat_gateway_1.userRoom)(user.id)).to((0, chat_gateway_1.userRoom)(problem.reportedById)).emit('new_message', message);
        }
        catch { }
        try {
            const adminMsg = await this.prisma.adminChatMessage.create({
                data: {
                    farmerId: problem.reportedById,
                    adminId: user.id,
                    senderRole: user.role === client_1.Role.ADMIN || user.role === client_1.Role.SUPER_ADMIN ? user.role : client_1.Role.ADMIN,
                    message: chatText,
                    isReadByFarmer: false,
                    isReadByAdmin: true,
                },
            });
            this.chatGateway.server.to((0, chat_gateway_1.userRoom)(problem.reportedById)).emit('admin_chat_message', adminMsg);
            this.chatGateway.server.emit('admin_chat_message', adminMsg);
        }
        catch { }
        this.chatGateway.server.to((0, chat_gateway_1.userRoom)(problem.reportedById)).emit('crop_problem_updated', { farmerId: problem.reportedById, cropProblemId: id, status: dto.status });
        this.chatGateway.server.emit('crop_problem_updated', { farmerId: problem.reportedById, cropProblemId: id, status: dto.status });
        return updated;
    }
    async rate(user, id, dto) {
        const problem = await this.findOneOrThrow(user, id);
        if (problem.reportedById !== user.id) {
            throw new common_1.NotFoundException('Crop problem not found.');
        }
        const updated = await this.prisma.cropProblem.update({
            where: { id },
            data: {
                farmerRating: dto.rating,
                farmerFeedback: dto.feedback?.trim() || null,
                status: client_1.CropProblemStatus.RESOLVED,
                resolvedAt: new Date(),
            },
            include: DETAIL_INCLUDE,
        });
        if (problem.assignedAdvisorId) {
            await this.notificationsService.create(problem.assignedAdvisorId, client_1.NotificationType.CROP_PROBLEM_UPDATE, '⭐ Farmer Feedback & Rating Received', `${user.name} rated your solution ${dto.rating}/5 stars${dto.feedback ? `: "${dto.feedback}"` : ''}.`, { cropProblemId: id, rating: dto.rating });
        }
        return updated;
    }
};
exports.CropProblemsService = CropProblemsService;
exports.CropProblemsService = CropProblemsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        crops_service_1.CropsService,
        notifications_service_1.NotificationsService,
        chat_service_1.ChatService,
        chat_gateway_1.ChatGateway])
], CropProblemsService);
//# sourceMappingURL=crop-problems.service.js.map