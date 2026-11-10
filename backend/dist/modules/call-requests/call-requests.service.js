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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallRequestsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const chat_gateway_1 = require("../chat/chat.gateway");
const SELECT = {
    farmer: { select: { id: true, name: true, mobile: true, kingId: true, photoUrl: true } },
    advisor: { select: { id: true, name: true, mobile: true } },
};
let CallRequestsService = class CallRequestsService {
    constructor(prisma, notificationsService, chatGateway) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.chatGateway = chatGateway;
    }
    async create(farmer, dto) {
        let advisorId = dto?.advisorId?.trim();
        let cropId = dto?.cropId?.trim();
        let cropName = null;
        let cropVariety = null;
        if (cropId) {
            const crop = await this.prisma.cropCycle.findFirst({
                where: { id: cropId, deletedAt: null, plot: { farm: { ownerId: farmer.id, deletedAt: null } } },
            });
            if (crop) {
                cropName = crop.cropName;
                cropVariety = crop.variety || null;
            }
        }
        if (!advisorId) {
            const assignment = await this.prisma.advisorAssignment.findFirst({
                where: { farmerId: farmer.id, status: client_1.AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
            });
            if (!assignment) {
                throw new common_1.BadRequestException('Please select an advisor to request a consultation.');
            }
            advisorId = assignment.advisorId;
        }
        const advisor = await this.prisma.user.findFirst({
            where: {
                id: advisorId,
                deletedAt: null,
                OR: [{ role: client_1.Role.ADVISOR }, { roles: { has: client_1.Role.ADVISOR } }],
            },
        });
        if (!advisor) {
            throw new common_1.NotFoundException('Selected advisor not found or not active.');
        }
        const openRequest = await this.prisma.callRequest.findFirst({
            where: { farmerId: farmer.id, advisorId, status: client_1.CallRequestStatus.PENDING },
        });
        if (openRequest) {
            throw new common_1.ConflictException(`You already have a pending call request with Dr. ${advisor.name}.`);
        }
        const request = await this.prisma.callRequest.create({
            data: {
                farmerId: farmer.id,
                advisorId,
            },
            include: SELECT,
        });
        const cropText = cropName ? ` for crop: ${cropName}${cropVariety ? ` (${cropVariety})` : ''}` : '';
        await this.notificationsService.create(advisorId, client_1.NotificationType.SYSTEM, cropName ? `Call Requested: ${cropName}` : 'Advisory Call Requested', `${farmer.name} has requested an advisory consultation${cropText}.`, { callRequestId: request.id, cropId: cropId || undefined });
        return {
            ...request,
            selectedCrop: cropName ? { id: cropId, name: cropName, variety: cropVariety } : null,
            notes: dto?.notes || null,
        };
    }
    getMyPending(farmer) {
        return this.prisma.callRequest.findFirst({
            where: { farmerId: farmer.id, status: client_1.CallRequestStatus.PENDING },
            include: SELECT,
            orderBy: { createdAt: 'desc' },
        });
    }
    listMine(advisor) {
        return this.prisma.callRequest.findMany({
            where: { advisorId: advisor.id },
            include: SELECT,
            orderBy: { createdAt: 'desc' },
        });
    }
    async resolve(advisor, id, dto) {
        const request = await this.prisma.callRequest.findFirst({ where: { id, advisorId: advisor.id } });
        if (!request) {
            throw new common_1.NotFoundException('Call request not found.');
        }
        if (request.status !== client_1.CallRequestStatus.PENDING) {
            throw new common_1.ConflictException('This call request has already been resolved.');
        }
        const updated = await this.prisma.callRequest.update({
            where: { id },
            data: { status: client_1.CallRequestStatus.RESOLVED, resolvedComment: dto.comment.trim(), resolvedAt: new Date() },
            include: SELECT,
        });
        const commentText = dto.comment.trim();
        const resolutionText = `✓ Call Request Resolved: ${commentText}`;
        await this.notificationsService.create(request.farmerId, client_1.NotificationType.SYSTEM, '📞 Call Request Resolved', `Your advisor resolved your call request: "${commentText}".`, { callRequestId: id });
        try {
            const msg = await this.prisma.message.create({
                data: {
                    senderId: advisor.id,
                    receiverId: request.farmerId,
                    content: resolutionText,
                },
            });
            if (this.chatGateway?.server) {
                this.chatGateway.server.to((0, chat_gateway_1.userRoom)(advisor.id)).to((0, chat_gateway_1.userRoom)(request.farmerId)).emit('new_message', msg);
            }
        }
        catch { }
        try {
            const adminMsg = await this.prisma.adminChatMessage.create({
                data: {
                    farmerId: request.farmerId,
                    adminId: advisor.id,
                    senderRole: client_1.Role.ADMIN,
                    message: resolutionText,
                    isReadByFarmer: false,
                    isReadByAdmin: true,
                },
            });
            if (this.chatGateway?.server) {
                this.chatGateway.server.to((0, chat_gateway_1.userRoom)(request.farmerId)).emit('admin_chat_message', adminMsg);
                this.chatGateway.server.emit('admin_chat_message', adminMsg);
            }
        }
        catch { }
        return updated;
    }
};
exports.CallRequestsService = CallRequestsService;
exports.CallRequestsService = CallRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => chat_gateway_1.ChatGateway))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        chat_gateway_1.ChatGateway])
], CallRequestsService);
//# sourceMappingURL=call-requests.service.js.map