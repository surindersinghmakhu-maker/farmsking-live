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
exports.VoiceCallService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const app_settings_service_1 = require("../app-settings/app-settings.service");
let VoiceCallService = class VoiceCallService {
    constructor(prisma, configService, appSettingsService) {
        this.prisma = prisma;
        this.configService = configService;
        this.appSettingsService = appSettingsService;
    }
    async generateAgoraToken(channelName, uid, role) {
        let appId = this.configService.get('AGORA_APP_ID') || 'demo_agora_app_id';
        let appCertificate = this.configService.get('AGORA_APP_CERTIFICATE');
        try {
            const integrations = await this.appSettingsService.getIntegrations();
            const agora = integrations?.telecom?.providers?.agora;
            if (agora?.appId)
                appId = agora.appId;
            if (agora?.appCertificate)
                appCertificate = agora.appCertificate;
        }
        catch { }
        if (!appCertificate || appId === 'demo_agora_app_id') {
            return {
                token: `fk_voice_token_${channelName}_${uid}_${Date.now()}`,
                appId,
            };
        }
        try {
            const { RtcTokenBuilder, RtcRole } = require('agora-token');
            const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
            const expirationTimeInSeconds = 3600 * 2;
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
            const token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, agoraRole, privilegeExpiredTs);
            return { token, appId };
        }
        catch {
            return {
                token: `fk_voice_token_${channelName}_${uid}_${Date.now()}`,
                appId,
            };
        }
    }
    async startGroupCall(user, dto) {
        const userRoleStr = String(user.role || '').toUpperCase();
        const isAdvisor = userRoleStr === 'ADVISOR' ||
            userRoleStr === 'FARM_ADVISOR' ||
            userRoleStr === 'GARDEN_ADVISOR' ||
            user.roles?.some((r) => ['ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR'].includes(String(r).toUpperCase()));
        const isAdmin = userRoleStr === 'ADMIN' ||
            userRoleStr === 'SUPER_ADMIN' ||
            user.roles?.some((r) => ['ADMIN', 'SUPER_ADMIN'].includes(String(r).toUpperCase()));
        const appSetting = await this.prisma.appSetting.findUnique({
            where: { id: 'default' },
        });
        if (appSetting && appSetting.groupVoiceCallEnabled === false) {
            throw new common_1.ForbiddenException('Group Voice Call feature is currently disabled by Super Admin.');
        }
        const now = new Date();
        let activeFarmerIds = [];
        if (isAdvisor) {
            const activeAssignments = await this.prisma.advisorAssignment.findMany({
                where: {
                    advisorId: user.id,
                    status: 'ACTIVE',
                    OR: [{ endDate: null }, { endDate: { gte: now } }],
                },
                select: { farmerId: true },
            });
            activeFarmerIds = activeAssignments.map((a) => a.farmerId);
        }
        else {
            const activeSubscriptions = await this.prisma.advisorSubscription.findMany({
                where: {
                    status: 'ACTIVE',
                    OR: [{ endDate: null }, { endDate: { gte: now } }],
                },
                select: { farmerId: true },
            });
            activeFarmerIds = Array.from(new Set(activeSubscriptions.map((s) => s.farmerId)));
        }
        if (activeFarmerIds.length === 0) {
            const allFarmers = await this.prisma.user.findMany({
                where: { role: client_1.Role.FARMER, deletedAt: null },
                select: { id: true },
                take: 50,
            });
            activeFarmerIds = allFarmers.map((f) => f.id);
        }
        const channelName = `fk-call-${user.id.substring(0, 8)}-${Date.now()}`;
        const call = await this.prisma.groupVoiceCall.create({
            data: {
                title: dto.title,
                channelName,
                hostId: user.id,
                status: client_1.GroupVoiceCallStatus.ACTIVE,
                participants: {
                    create: [
                        {
                            userId: user.id,
                            role: 'HOST',
                            isMuted: false,
                        },
                        ...activeFarmerIds.map((farmerId) => ({
                            userId: farmerId,
                            role: 'LISTENER',
                            isMuted: true,
                        })),
                    ],
                },
            },
            include: {
                host: { select: { id: true, name: true, photoUrl: true, role: true } },
                participants: {
                    include: {
                        user: { select: { id: true, name: true, photoUrl: true, village: true } },
                    },
                },
            },
        });
        const { token, appId } = await this.generateAgoraToken(channelName, user.id, 'publisher');
        return {
            call,
            token,
            appId,
            channelName,
            eligibleFarmersCount: activeFarmerIds.length,
        };
    }
    async joinGroupCall(user, callId) {
        const appSetting = await this.prisma.appSetting.findUnique({
            where: { id: 'default' },
        });
        if (appSetting && appSetting.groupVoiceCallEnabled === false) {
            throw new common_1.ForbiddenException('Group Voice Call feature is currently disabled by Super Admin.');
        }
        const call = await this.prisma.groupVoiceCall.findUnique({
            where: { id: callId },
            include: {
                host: { select: { id: true, name: true, photoUrl: true } },
                participants: {
                    include: {
                        user: { select: { id: true, name: true, photoUrl: true } },
                    },
                },
            },
        });
        if (!call || call.status !== client_1.GroupVoiceCallStatus.ACTIVE) {
            throw new common_1.NotFoundException('Group voice call is not active or has ended.');
        }
        const isHost = call.hostId === user.id;
        const existingPart = await this.prisma.groupVoiceCallParticipant.findFirst({
            where: { callId, userId: user.id },
        });
        if (existingPart) {
            await this.prisma.groupVoiceCallParticipant.update({
                where: { id: existingPart.id },
                data: { joinedAt: new Date(), leftAt: null },
            });
        }
        else {
            await this.prisma.groupVoiceCallParticipant.create({
                data: {
                    callId,
                    userId: user.id,
                    role: isHost ? 'HOST' : 'LISTENER',
                    isMuted: !isHost,
                },
            });
        }
        const agoraRole = isHost ? 'publisher' : 'subscriber';
        const { token, appId } = await this.generateAgoraToken(call.channelName, user.id, agoraRole);
        return {
            call,
            token,
            appId,
            channelName: call.channelName,
        };
    }
    async endGroupCall(user, callId) {
        const call = await this.prisma.groupVoiceCall.findUnique({
            where: { id: callId },
        });
        if (!call) {
            throw new common_1.NotFoundException('Call session not found.');
        }
        const updated = await this.prisma.groupVoiceCall.update({
            where: { id: callId },
            data: {
                status: client_1.GroupVoiceCallStatus.ENDED,
                endedAt: new Date(),
            },
        });
        return { success: true, callId: updated.id };
    }
    async getActiveCallForUser(user) {
        const appSetting = await this.prisma.appSetting.findUnique({
            where: { id: 'default' },
        });
        if (appSetting && appSetting.groupVoiceCallEnabled === false) {
            return null;
        }
        const activeCall = await this.prisma.groupVoiceCall.findFirst({
            where: {
                status: client_1.GroupVoiceCallStatus.ACTIVE,
                OR: [
                    { hostId: user.id },
                    { participants: { some: { userId: user.id } } },
                ],
            },
            include: {
                host: { select: { id: true, name: true, photoUrl: true } },
                participants: {
                    include: {
                        user: { select: { id: true, name: true, photoUrl: true, village: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return activeCall;
    }
    async scheduleGroupCall(advisor, dto) {
        const channelName = `fk_group_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const scheduledDate = new Date(dto.scheduledAt);
        const call = await this.prisma.groupVoiceCall.create({
            data: {
                title: dto.title,
                channelName,
                hostId: advisor.id,
                status: client_1.GroupVoiceCallStatus.ACTIVE,
                scheduledAt: scheduledDate,
                targetAudienceType: dto.targetAudienceType || 'ALL_FARMERS',
                targetPlanType: dto.targetPlanType || null,
                targetCropName: dto.targetCropName || null,
                invitedFarmerIds: dto.invitedFarmerIds || [],
                alertMessage: dto.alertMessage || null,
            },
        });
        return call;
    }
    async sendGroupCallAlert(advisor, callId, customMessage) {
        const call = await this.prisma.groupVoiceCall.findUnique({
            where: { id: callId },
        });
        if (!call) {
            throw new common_1.NotFoundException('Group call not found.');
        }
        if (call.hostId !== advisor.id && advisor.role !== client_1.Role.ADMIN && advisor.role !== client_1.Role.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only the host or admin can send alerts for this call.');
        }
        let targetFarmerIds = [];
        if (call.targetAudienceType === 'SPECIFIC_FARMERS' && call.invitedFarmerIds?.length) {
            targetFarmerIds = call.invitedFarmerIds;
        }
        else if (call.targetAudienceType === 'CROP_SPECIAL' && call.targetCropName) {
            const crops = await this.prisma.cropCycle.findMany({
                where: {
                    cropName: { contains: call.targetCropName, mode: 'insensitive' },
                    assignedAdvisorId: advisor.id,
                },
                include: {
                    plot: { include: { farm: { select: { ownerId: true } } } },
                },
            });
            targetFarmerIds = Array.from(new Set(crops.map((c) => c.plot.farm.ownerId)));
        }
        else {
            const assignments = await this.prisma.advisorAssignment.findMany({
                where: { advisorId: advisor.id, status: 'ACTIVE' },
                select: { farmerId: true },
            });
            const cropAssignments = await this.prisma.cropCycle.findMany({
                where: { assignedAdvisorId: advisor.id },
                include: {
                    plot: { include: { farm: { select: { ownerId: true } } } },
                },
            });
            const ids = new Set([
                ...assignments.map((a) => a.farmerId),
                ...cropAssignments.map((c) => c.plot.farm.ownerId),
            ]);
            targetFarmerIds = Array.from(ids);
        }
        const scheduledTimeStr = call.scheduledAt
            ? new Date(call.scheduledAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
            : 'shortly';
        const message = customMessage || call.alertMessage || `Dr. ${advisor.name} scheduled a group consultation session "${call.title}" on ${scheduledTimeStr}. Join to get live crop advice.`;
        if (targetFarmerIds.length > 0) {
            await this.prisma.notification.createMany({
                data: targetFarmerIds.map((farmerId) => ({
                    userId: farmerId,
                    type: 'ADVISOR_MESSAGE',
                    title: `📞 Live Group Consultation: ${call.title}`,
                    body: message,
                    data: {
                        type: 'GROUP_CALL',
                        callId: call.id,
                        channelName: call.channelName,
                        scheduledAt: call.scheduledAt?.toISOString(),
                    },
                })),
                skipDuplicates: true,
            });
        }
        const updated = await this.prisma.groupVoiceCall.update({
            where: { id: callId },
            data: {
                alertSentAt: new Date(),
                alertMessage: message,
            },
        });
        return {
            success: true,
            notifiedFarmerCount: targetFarmerIds.length,
            alertSentAt: updated.alertSentAt,
            callId: updated.id,
        };
    }
    async getAdvisorGroupEvents(advisor) {
        return this.prisma.groupVoiceCall.findMany({
            where: { hostId: advisor.id },
            include: {
                participants: {
                    include: {
                        user: { select: { id: true, name: true, mobile: true, village: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async getFarmerGroupInvitations(farmer) {
        return this.prisma.groupVoiceCall.findMany({
            where: {
                status: client_1.GroupVoiceCallStatus.ACTIVE,
                OR: [
                    { targetAudienceType: 'ALL_FARMERS' },
                    { invitedFarmerIds: { has: farmer.id } },
                    { host: { advisorAssignmentsAsAdvisor: { some: { farmerId: farmer.id, status: 'ACTIVE' } } } },
                ],
            },
            include: {
                host: { select: { id: true, name: true, kingId: true, photoUrl: true, specialization: true } },
            },
            orderBy: { scheduledAt: 'asc' },
            take: 20,
        });
    }
};
exports.VoiceCallService = VoiceCallService;
exports.VoiceCallService = VoiceCallService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        app_settings_service_1.AppSettingsService])
], VoiceCallService);
//# sourceMappingURL=voice-call.service.js.map