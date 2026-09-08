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
exports.AdminChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const chat_gateway_1 = require("../chat/chat.gateway");
const notifications_service_1 = require("../notifications/notifications.service");
let AdminChatService = class AdminChatService {
    prisma;
    chatGateway;
    notificationsService;
    constructor(prisma, chatGateway, notificationsService) {
        this.prisma = prisma;
        this.chatGateway = chatGateway;
        this.notificationsService = notificationsService;
    }
    async sendMessage(userId, userRole, dto) {
        let farmerId;
        let senderRole = userRole;
        if (userRole === client_1.Role.ADMIN || userRole === client_1.Role.SUPER_ADMIN) {
            if (!dto.farmerId) {
                throw new common_1.ForbiddenException('Admin must specify farmerId when sending a chat message.');
            }
            farmerId = dto.farmerId;
        }
        else {
            farmerId = userId;
            senderRole = client_1.Role.FARMER;
        }
        const farmer = await this.prisma.user.findUnique({
            where: { id: farmerId },
            select: { id: true, name: true, mobile: true },
        });
        if (!farmer) {
            throw new common_1.NotFoundException('Farmer account not found.');
        }
        const chatMsg = await this.prisma.adminChatMessage.create({
            data: {
                farmerId,
                adminId: userRole === client_1.Role.ADMIN || userRole === client_1.Role.SUPER_ADMIN ? userId : undefined,
                senderRole,
                message: dto.message.trim(),
                imageUrl: dto.imageUrl || undefined,
                isReadByFarmer: senderRole === client_1.Role.FARMER,
                isReadByAdmin: senderRole !== client_1.Role.FARMER,
            },
        });
        if (userRole === client_1.Role.ADMIN || userRole === client_1.Role.SUPER_ADMIN) {
            await this.notificationsService.create(farmerId, client_1.NotificationType.ADVISOR_MESSAGE, '🛡️ Support Reply from Admin', dto.message.trim(), { farmerId, type: 'ADMIN_CHAT' });
        }
        if (this.chatGateway?.server) {
            this.chatGateway.server.emit('admin_chat_message', chatMsg);
        }
        return {
            message: 'Chat message sent successfully',
            data: chatMsg,
        };
    }
    async getFarmerMessages(farmerId) {
        await this.prisma.adminChatMessage.updateMany({
            where: {
                farmerId,
                senderRole: { in: [client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN] },
                isReadByFarmer: false,
            },
            data: { isReadByFarmer: true },
        });
        const messages = await this.prisma.adminChatMessage.findMany({
            where: { farmerId },
            orderBy: { createdAt: 'asc' },
            take: 100,
        });
        const unreadCount = await this.prisma.adminChatMessage.count({
            where: {
                farmerId,
                senderRole: { in: [client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN] },
                isReadByFarmer: false,
            },
        });
        return {
            messages,
            unreadCount,
        };
    }
    async getAdminConversations() {
        const messages = await this.prisma.adminChatMessage.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                farmer: {
                    select: { id: true, name: true, mobile: true, kingId: true, village: true, district: true, photoUrl: true },
                },
            },
            take: 200,
        });
        const conversationsMap = new Map();
        for (const msg of messages) {
            if (!conversationsMap.has(msg.farmerId)) {
                conversationsMap.set(msg.farmerId, {
                    farmerId: msg.farmerId,
                    farmerName: msg.farmer?.name || 'User',
                    farmerMobile: msg.farmer?.mobile || 'N/A',
                    kingId: msg.farmer?.kingId || undefined,
                    photoUrl: msg.farmer?.photoUrl || undefined,
                    farmer: msg.farmer,
                    lastMessage: msg.message,
                    lastMessageDate: msg.createdAt,
                    lastSenderRole: msg.senderRole,
                    unreadCount: msg.isReadByAdmin ? 0 : 1,
                });
            }
            else if (!msg.isReadByAdmin) {
                const existing = conversationsMap.get(msg.farmerId);
                existing.unreadCount += 1;
            }
        }
        return Array.from(conversationsMap.values());
    }
    async getAdminFarmerThread(farmerId) {
        await this.prisma.adminChatMessage.updateMany({
            where: {
                farmerId,
                senderRole: client_1.Role.FARMER,
                isReadByAdmin: false,
            },
            data: { isReadByAdmin: true },
        });
        const farmer = await this.prisma.user.findUnique({
            where: { id: farmerId },
            select: { id: true, name: true, mobile: true, village: true, district: true },
        });
        const messages = await this.prisma.adminChatMessage.findMany({
            where: { farmerId },
            orderBy: { createdAt: 'asc' },
            take: 100,
        });
        return {
            farmer,
            messages,
        };
    }
    async resolveFarmerThread(adminId, farmerId, notes) {
        const farmer = await this.prisma.user.findUnique({
            where: { id: farmerId },
            select: { id: true, name: true },
        });
        if (!farmer) {
            throw new common_1.NotFoundException('Farmer account not found.');
        }
        await this.prisma.cropProblem.updateMany({
            where: {
                reportedById: farmerId,
                status: { in: [client_1.CropProblemStatus.REPORTED, client_1.CropProblemStatus.UNDER_REVIEW, client_1.CropProblemStatus.ADVISOR_RESPONDED] },
                deletedAt: null,
            },
            data: {
                status: client_1.CropProblemStatus.RESOLVED,
                resolvedAt: new Date(),
            },
        });
        const resolutionText = notes
            ? `✓ Request Solved: ${notes.trim()}`
            : '✓ Problem Solved: Your support request has been marked as resolved by Admin.';
        const chatMsg = await this.prisma.adminChatMessage.create({
            data: {
                farmerId,
                adminId,
                senderRole: client_1.Role.ADMIN,
                message: resolutionText,
                isReadByFarmer: false,
                isReadByAdmin: true,
            },
        });
        try {
            const directMsg = await this.prisma.message.create({
                data: {
                    senderId: adminId,
                    receiverId: farmerId,
                    content: resolutionText,
                },
            });
            if (this.chatGateway?.server) {
                this.chatGateway.server.to(`user:${farmerId}`).to(`user:${adminId}`).emit('new_message', directMsg);
            }
        }
        catch { }
        await this.notificationsService.create(farmerId, client_1.NotificationType.CROP_PROBLEM_UPDATE, '✅ Request / Problem Solved', notes?.trim() || 'Your support request has been marked as resolved by Admin.', { farmerId, type: 'PROBLEM_SOLVED' });
        if (this.chatGateway?.server) {
            this.chatGateway.server.to(`user:${farmerId}`).emit('admin_chat_message', chatMsg);
            this.chatGateway.server.emit('admin_chat_message', chatMsg);
            this.chatGateway.server.to(`user:${farmerId}`).emit('crop_problem_updated', { farmerId, status: 'RESOLVED' });
            this.chatGateway.server.emit('crop_problem_updated', { farmerId, status: 'RESOLVED' });
        }
        return {
            message: 'Farmer support request marked as solved successfully.',
            data: chatMsg,
        };
    }
};
exports.AdminChatService = AdminChatService;
exports.AdminChatService = AdminChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => chat_gateway_1.ChatGateway))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        chat_gateway_1.ChatGateway,
        notifications_service_1.NotificationsService])
], AdminChatService);
//# sourceMappingURL=admin-chat.service.js.map