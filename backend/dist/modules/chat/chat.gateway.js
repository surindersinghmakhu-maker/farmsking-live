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
var ChatGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = exports.userRoom = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const prisma_service_1 = require("../prisma/prisma.service");
const chat_service_1 = require("./chat.service");
const userRoom = (userId) => `user:${userId}`;
exports.userRoom = userRoom;
let ChatGateway = ChatGateway_1 = class ChatGateway {
    jwtService;
    prisma;
    chatService;
    server;
    logger = new common_1.Logger(ChatGateway_1.name);
    onlineSocketCounts = new Map();
    constructor(jwtService, prisma, chatService) {
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.chatService = chatService;
    }
    isUserOnline(userId) {
        return (this.onlineSocketCounts.get(userId) ?? 0) > 0;
    }
    setOnline(userId) {
        const wasOnline = this.isUserOnline(userId);
        this.onlineSocketCounts.set(userId, (this.onlineSocketCounts.get(userId) ?? 0) + 1);
        if (!wasOnline) {
            this.server.emit('presence_update', { userId, isOnline: true });
        }
    }
    setOffline(userId) {
        const current = this.onlineSocketCounts.get(userId) ?? 0;
        if (current <= 1) {
            this.onlineSocketCounts.delete(userId);
            this.server.emit('presence_update', { userId, isOnline: false });
        }
        else {
            this.onlineSocketCounts.set(userId, current - 1);
        }
    }
    async handleConnection(client) {
        const token = client.handshake.auth?.token || client.handshake.query?.token;
        if (!token || typeof token !== 'string') {
            client.disconnect();
            return;
        }
        try {
            const payload = this.jwtService.verify(token);
            const user = await this.prisma.user.findFirst({
                where: { id: payload.sub, deletedAt: null },
                select: { id: true, mobile: true, role: true, roles: true, deactivatedRoles: true, name: true },
            });
            if (!user) {
                client.disconnect();
                return;
            }
            client.data.user = user;
            client.join((0, exports.userRoom)(user.id));
            this.setOnline(user.id);
        }
        catch {
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const user = client.data.user;
        if (user)
            this.setOffline(user.id);
    }
    async handleSendMessage(client, body) {
        const user = client.data.user;
        if (!user)
            return;
        try {
            const message = await this.chatService.sendMessage(user, body.receiverId, body.content);
            this.server.to((0, exports.userRoom)(user.id)).to((0, exports.userRoom)(body.receiverId)).emit('new_message', message);
            return { status: 'ok', message };
        }
        catch (error) {
            this.logger.warn(`send_message rejected for ${user.id} -> ${body.receiverId}: ${error.message}`);
            client.emit('chat_error', { message: error.message ?? 'Could not send message.' });
            return { status: 'error', message: error.message };
        }
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({ namespace: '/chat', cors: { origin: true, credentials: true } }),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => chat_service_1.ChatService))),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService,
        chat_service_1.ChatService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map