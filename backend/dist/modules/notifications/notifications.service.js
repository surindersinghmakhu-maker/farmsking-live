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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let NotificationsService = class NotificationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, type, title, body, data) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { notificationsEnabled: true } });
        if (user && !user.notificationsEnabled) {
            return null;
        }
        return this.prisma.notification.create({ data: { userId, type, title, body, data } });
    }
    listMine(user) {
        return this.prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
    async getUnreadCount(user) {
        const count = await this.prisma.notification.count({ where: { userId: user.id, isRead: false } });
        return { count };
    }
    async markRead(user, id) {
        const notification = await this.prisma.notification.findFirst({ where: { id, userId: user.id } });
        if (!notification) {
            throw new common_1.NotFoundException('Notification not found.');
        }
        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async markAllRead(user) {
        await this.prisma.notification.updateMany({
            where: { userId: user.id, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
        return { success: true };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map