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
var VoiceCallGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceCallGateway = exports.callRoom = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const prisma_service_1 = require("../prisma/prisma.service");
const chat_gateway_1 = require("../chat/chat.gateway");
const callRoom = (callId) => `call:${callId}`;
exports.callRoom = callRoom;
let VoiceCallGateway = VoiceCallGateway_1 = class VoiceCallGateway {
    jwtService;
    prisma;
    server;
    logger = new common_1.Logger(VoiceCallGateway_1.name);
    constructor(jwtService, prisma) {
        this.jwtService = jwtService;
        this.prisma = prisma;
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
            client.join((0, chat_gateway_1.userRoom)(user.id));
        }
        catch {
            client.disconnect();
        }
    }
    handleDisconnect(client) {
    }
    async handleJoinCallRoom(client, body) {
        const user = client.data.user;
        if (!user || !body.callId)
            return;
        client.join((0, exports.callRoom)(body.callId));
        this.server.to((0, exports.callRoom)(body.callId)).emit('user_joined_call', {
            userId: user.id,
            name: user.name,
        });
        return { status: 'joined', callId: body.callId };
    }
    async handleLeaveCallRoom(client, body) {
        const user = client.data.user;
        if (!user || !body.callId)
            return;
        client.leave((0, exports.callRoom)(body.callId));
        this.server.to((0, exports.callRoom)(body.callId)).emit('user_left_call', {
            userId: user.id,
            name: user.name,
        });
        return { status: 'left' };
    }
    async handleRaiseHand(client, body) {
        const user = client.data.user;
        if (!user || !body.callId)
            return;
        await this.prisma.groupVoiceCallParticipant.updateMany({
            where: { callId: body.callId, userId: user.id },
            data: { isHandRaised: true },
        });
        this.server.to((0, exports.callRoom)(body.callId)).emit('hand_raised', {
            userId: user.id,
            name: user.name,
        });
        return { status: 'ok' };
    }
    async handleGrantMic(client, body) {
        const user = client.data.user;
        if (!user || !body.callId || !body.targetUserId)
            return;
        const call = await this.prisma.groupVoiceCall.findUnique({
            where: { id: body.callId },
        });
        if (!call || call.hostId !== user.id) {
            return { status: 'forbidden' };
        }
        await this.prisma.groupVoiceCallParticipant.updateMany({
            where: { callId: body.callId, userId: body.targetUserId },
            data: { role: 'SPEAKER', isMuted: false, isHandRaised: false },
        });
        this.server.to((0, exports.callRoom)(body.callId)).emit('mic_granted', {
            userId: body.targetUserId,
            grantedBy: user.id,
        });
        return { status: 'ok' };
    }
    async handleToggleMute(client, body) {
        const user = client.data.user;
        if (!user || !body.callId)
            return;
        await this.prisma.groupVoiceCallParticipant.updateMany({
            where: { callId: body.callId, userId: user.id },
            data: { isMuted: body.isMuted },
        });
        this.server.to((0, exports.callRoom)(body.callId)).emit('mute_changed', {
            userId: user.id,
            isMuted: body.isMuted,
        });
        return { status: 'ok' };
    }
    async handleVoiceAudioChunk(client, body) {
        const user = client.data.user;
        if (!user || !body.callId || !body.chunk)
            return;
        client.to((0, exports.callRoom)(body.callId)).emit('remote_audio_chunk', {
            senderId: user.id,
            senderName: user.name,
            chunk: body.chunk,
        });
    }
    async handleWebRTCSignal(client, body) {
        const user = client.data.user;
        if (!user || !body.callId || !body.signal)
            return;
        if (body.targetUserId) {
            this.server.to((0, chat_gateway_1.userRoom)(body.targetUserId)).emit('webrtc_signal', {
                senderId: user.id,
                signal: body.signal,
            });
        }
        else {
            client.to((0, exports.callRoom)(body.callId)).emit('webrtc_signal', {
                senderId: user.id,
                signal: body.signal,
            });
        }
    }
    notifyGroupCallStarted(call, eligibleFarmerIds) {
        eligibleFarmerIds.forEach((farmerId) => {
            this.server.to((0, chat_gateway_1.userRoom)(farmerId)).emit('group_call_started', {
                callId: call.id,
                title: call.title,
                hostName: call.host.name,
            });
        });
    }
};
exports.VoiceCallGateway = VoiceCallGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], VoiceCallGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_call_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VoiceCallGateway.prototype, "handleJoinCallRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_call_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VoiceCallGateway.prototype, "handleLeaveCallRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('raise_hand'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VoiceCallGateway.prototype, "handleRaiseHand", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('grant_mic'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VoiceCallGateway.prototype, "handleGrantMic", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('toggle_mute'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VoiceCallGateway.prototype, "handleToggleMute", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('voice_audio_chunk'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VoiceCallGateway.prototype, "handleVoiceAudioChunk", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('webrtc_signal'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VoiceCallGateway.prototype, "handleWebRTCSignal", null);
exports.VoiceCallGateway = VoiceCallGateway = VoiceCallGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({ namespace: '/voice-call', cors: { origin: true, credentials: true } }),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService])
], VoiceCallGateway);
//# sourceMappingURL=voice-call.gateway.js.map