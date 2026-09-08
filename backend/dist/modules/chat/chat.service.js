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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const chat_gateway_1 = require("./chat.gateway");
let ChatService = class ChatService {
    prisma;
    notificationsService;
    chatGateway;
    constructor(prisma, notificationsService, chatGateway) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.chatGateway = chatGateway;
    }
    async assertCanChat(userId, userRole, otherUserId) {
        if (userRole === client_1.Role.ADMIN || userRole === client_1.Role.SUPER_ADMIN)
            return;
        const other = await this.prisma.user.findUnique({ where: { id: otherUserId }, select: { role: true } });
        if (other?.role === client_1.Role.ADMIN || other?.role === client_1.Role.SUPER_ADMIN)
            return;
        const assignment = await this.prisma.advisorAssignment.findFirst({
            where: {
                status: client_1.AdvisorAssignmentStatus.ACTIVE,
                deletedAt: null,
                OR: [
                    { advisorId: userId, farmerId: otherUserId },
                    { advisorId: otherUserId, farmerId: userId },
                ],
            },
        });
        if (!assignment) {
            throw new common_1.ForbiddenException('You can only message your currently assigned advisor or farmer.');
        }
    }
    async sendMessage(sender, receiverId, content) {
        await this.assertCanChat(sender.id, sender.role, receiverId);
        const message = await this.prisma.message.create({
            data: { senderId: sender.id, receiverId, content },
        });
        await this.notificationsService.create(receiverId, client_1.NotificationType.ADVISOR_MESSAGE, `New message from ${sender.name}`, content.length > 80 ? `${content.slice(0, 80)}...` : content, { senderId: sender.id, messageId: message.id });
        return message;
    }
    async getMessages(user, otherUserId) {
        await this.assertCanChat(user.id, user.role, otherUserId);
        const messages = await this.prisma.message.findMany({
            where: {
                OR: [
                    { senderId: user.id, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: user.id },
                ],
            },
            orderBy: { createdAt: 'asc' },
        });
        await this.prisma.message.updateMany({
            where: { senderId: otherUserId, receiverId: user.id, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
        return messages;
    }
    async listConversations(user) {
        const assignments = await this.prisma.advisorAssignment.findMany({
            where: {
                status: client_1.AdvisorAssignmentStatus.ACTIVE,
                deletedAt: null,
                ...(user.role === client_1.Role.ADVISOR ? { advisorId: user.id } : { farmerId: user.id }),
            },
            include: {
                advisor: { select: { id: true, kingId: true, name: true, mobile: true, photoUrl: true } },
                farmer: { select: { id: true, kingId: true, name: true, mobile: true, photoUrl: true } },
            },
        });
        const partnerById = new Map();
        assignments.forEach((assignment) => {
            const partner = user.role === client_1.Role.ADVISOR ? assignment.farmer : assignment.advisor;
            if (!partnerById.has(partner.id))
                partnerById.set(partner.id, partner);
        });
        const otherSenderIds = await this.prisma.message.findMany({
            where: { receiverId: user.id, senderId: { notIn: Array.from(partnerById.keys()) } },
            select: { senderId: true },
            distinct: ['senderId'],
        });
        if (otherSenderIds.length > 0) {
            const extraPartners = await this.prisma.user.findMany({
                where: { id: { in: otherSenderIds.map((m) => m.senderId) } },
                select: { id: true, kingId: true, name: true, mobile: true, photoUrl: true },
            });
            extraPartners.forEach((partner) => {
                if (!partnerById.has(partner.id))
                    partnerById.set(partner.id, partner);
            });
        }
        const conversations = await Promise.all(Array.from(partnerById.values()).map(async (partner) => {
            const [lastMessage, unreadCount] = await Promise.all([
                this.prisma.message.findFirst({
                    where: {
                        OR: [
                            { senderId: user.id, receiverId: partner.id },
                            { senderId: partner.id, receiverId: user.id },
                        ],
                    },
                    orderBy: { createdAt: 'desc' },
                }),
                this.prisma.message.count({ where: { senderId: partner.id, receiverId: user.id, isRead: false } }),
            ]);
            return { partner, lastMessage, unreadCount, isOnline: this.chatGateway.isUserOnline(partner.id) };
        }));
        return conversations.sort((a, b) => {
            const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
            const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
            return bTime - aTime;
        });
    }
    getUnreadCount(user) {
        return this.prisma.message.count({ where: { receiverId: user.id, isRead: false } });
    }
    isUserOnline(userId) {
        return { isOnline: this.chatGateway.isUserOnline(userId) };
    }
    getMessagesBetweenAsAdmin(userAId, userBId) {
        return this.prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userAId, receiverId: userBId },
                    { senderId: userBId, receiverId: userAId },
                ],
            },
            orderBy: { createdAt: 'asc' },
        });
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => chat_gateway_1.ChatGateway))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        chat_gateway_1.ChatGateway])
], ChatService);
//# sourceMappingURL=chat.service.js.map