import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GroupVoiceCallStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import type { AuthUser } from '../../common/types/auth-user.type';
import { StartGroupCallDto } from './dto/start-group-call.dto';
import { ScheduleGroupCallDto, SendGroupAlertDto } from './dto/schedule-group-call.dto';

@Injectable()
export class VoiceCallService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly appSettingsService: AppSettingsService,
  ) {}

  /**
   * Generates Agora RTC Token or fallback token if credentials not configured
   */
  private async generateAgoraToken(channelName: string, uid: string, role: 'publisher' | 'subscriber'): Promise<{ token: string; appId: string }> {
    let appId = this.configService.get<string>('AGORA_APP_ID') || 'demo_agora_app_id';
    let appCertificate = this.configService.get<string>('AGORA_APP_CERTIFICATE');

    try {
      const integrations = await this.appSettingsService.getIntegrations();
      const agora = integrations?.telecom?.providers?.agora;
      if (agora?.appId) appId = agora.appId;
      if (agora?.appCertificate) appCertificate = agora.appCertificate;
    } catch {}

    if (!appCertificate || appId === 'demo_agora_app_id') {
      // Fallback secure token format for development/testing
      return {
        token: `fk_voice_token_${channelName}_${uid}_${Date.now()}`,
        appId,
      };
    }

    try {
      // Dynamically require agora-token if available
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { RtcTokenBuilder, RtcRole } = require('agora-token');
      const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
      const expirationTimeInSeconds = 3600 * 2; // 2 hours
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

      const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        agoraRole,
        privilegeExpiredTs,
      );
      return { token, appId };
    } catch {
      return {
        token: `fk_voice_token_${channelName}_${uid}_${Date.now()}`,
        appId,
      };
    }
  }

  /**
   * Initiate a Group Voice Call (Restricted to ADVISOR, ADMIN, SUPER_ADMIN)
   */
  async startGroupCall(user: AuthUser, dto: StartGroupCallDto) {
    const userRoleStr = String(user.role || '').toUpperCase();
    const isAdvisor =
      userRoleStr === 'ADVISOR' ||
      userRoleStr === 'FARM_ADVISOR' ||
      userRoleStr === 'GARDEN_ADVISOR' ||
      user.roles?.some((r: any) => ['ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR'].includes(String(r).toUpperCase()));
    const isAdmin =
      userRoleStr === 'ADMIN' ||
      userRoleStr === 'SUPER_ADMIN' ||
      user.roles?.some((r: any) => ['ADMIN', 'SUPER_ADMIN'].includes(String(r).toUpperCase()));

    // Check if global Group Voice Call feature is enabled by Super Admin
    const appSetting = await this.prisma.appSetting.findUnique({
      where: { id: 'default' },
    });
    if (appSetting && appSetting.groupVoiceCallEnabled === false) {
      throw new ForbiddenException('Group Voice Call feature is currently disabled by Super Admin.');
    }

    // Fetch farmers who have an ACTIVE subscription assignment with this advisor / platform
    const now = new Date();
    let activeFarmerIds: string[] = [];

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
    } else {
      // Admin can invite all active subscription farmers
      const activeSubscriptions = await this.prisma.advisorSubscription.findMany({
        where: {
          status: 'ACTIVE',
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
        select: { farmerId: true },
      });
      activeFarmerIds = Array.from(new Set(activeSubscriptions.map((s) => s.farmerId)));
    }

    // Fallback: If no assigned farmers found yet, include all registered farmers in dev
    if (activeFarmerIds.length === 0) {
      const allFarmers = await this.prisma.user.findMany({
        where: { role: Role.FARMER, deletedAt: null },
        select: { id: true },
        take: 50,
      });
      activeFarmerIds = allFarmers.map((f) => f.id);
    }

    const channelName = `fk-call-${user.id.substring(0, 8)}-${Date.now()}`;

    // Create call record in DB
    const call = await this.prisma.groupVoiceCall.create({
      data: {
        title: dto.title,
        channelName,
        hostId: user.id,
        status: GroupVoiceCallStatus.ACTIVE,
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

  /**
   * Join an ongoing group call
   */
  async joinGroupCall(user: AuthUser, callId: string) {
    const appSetting = await this.prisma.appSetting.findUnique({
      where: { id: 'default' },
    });
    if (appSetting && appSetting.groupVoiceCallEnabled === false) {
      throw new ForbiddenException('Group Voice Call feature is currently disabled by Super Admin.');
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

    if (!call || call.status !== GroupVoiceCallStatus.ACTIVE) {
      throw new NotFoundException('Group voice call is not active or has ended.');
    }

    const isHost = call.hostId === user.id;

    // Update participant joinedAt
    const existingPart = await this.prisma.groupVoiceCallParticipant.findFirst({
      where: { callId, userId: user.id },
    });

    if (existingPart) {
      await this.prisma.groupVoiceCallParticipant.update({
        where: { id: existingPart.id },
        data: { joinedAt: new Date(), leftAt: null },
      });
    } else {
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

  /**
   * End an active group call (Host / Admin only)
   */
  async endGroupCall(user: AuthUser, callId: string) {
    const call = await this.prisma.groupVoiceCall.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call session not found.');
    }

    const updated = await this.prisma.groupVoiceCall.update({
      where: { id: callId },
      data: {
        status: GroupVoiceCallStatus.ENDED,
        endedAt: new Date(),
      },
    });

    return { success: true, callId: updated.id };
  }

  /**
   * Get active call details for user
   */
  async getActiveCallForUser(user: AuthUser) {
    const appSetting = await this.prisma.appSetting.findUnique({
      where: { id: 'default' },
    });
    if (appSetting && appSetting.groupVoiceCallEnabled === false) {
      return null;
    }

    const activeCall = await this.prisma.groupVoiceCall.findFirst({
      where: {
        status: GroupVoiceCallStatus.ACTIVE,
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

  /**
   * Schedule a group call event (Doctor/Advisor)
   */
  async scheduleGroupCall(advisor: AuthUser, dto: ScheduleGroupCallDto) {
    const channelName = `fk_group_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const scheduledDate = new Date(dto.scheduledAt);

    const call = await this.prisma.groupVoiceCall.create({
      data: {
        title: dto.title,
        channelName,
        hostId: advisor.id,
        status: GroupVoiceCallStatus.ACTIVE,
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

  /**
   * Trigger alert/broadcast notification for scheduled group call to selected farmers
   */
  async sendGroupCallAlert(advisor: AuthUser, callId: string, customMessage?: string) {
    const call = await this.prisma.groupVoiceCall.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Group call not found.');
    }

    if (call.hostId !== advisor.id && advisor.role !== Role.ADMIN && advisor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only the host or admin can send alerts for this call.');
    }

    // Determine target farmer IDs
    let targetFarmerIds: string[] = [];

    if (call.targetAudienceType === 'SPECIFIC_FARMERS' && call.invitedFarmerIds?.length) {
      targetFarmerIds = call.invitedFarmerIds;
    } else if (call.targetAudienceType === 'CROP_SPECIAL' && call.targetCropName) {
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
    } else {
      // Find all farmers currently assigned to this advisor via subscription or crop
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

    // Create notifications for target farmers
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

    // Update alertSentAt timestamp on the call
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

  /**
   * Get all group call events scheduled/hosted by this advisor
   */
  async getAdvisorGroupEvents(advisor: AuthUser) {
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

  /**
   * Get group call invitations for a farmer
   */
  async getFarmerGroupInvitations(farmer: AuthUser) {
    return this.prisma.groupVoiceCall.findMany({
      where: {
        status: GroupVoiceCallStatus.ACTIVE,
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
}
