import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import type { AuthUser } from '../../common/types/auth-user.type';
import { StartGroupCallDto } from './dto/start-group-call.dto';
import { ScheduleGroupCallDto } from './dto/schedule-group-call.dto';
export declare class VoiceCallService {
    private readonly prisma;
    private readonly configService;
    private readonly appSettingsService;
    constructor(prisma: PrismaService, configService: ConfigService, appSettingsService: AppSettingsService);
    private generateAgoraToken;
    startGroupCall(user: AuthUser, dto: StartGroupCallDto): Promise<{
        call: {
            host: {
                id: string;
                name: string;
                role: import(".prisma/client").$Enums.Role;
                photoUrl: string | null;
            };
            participants: ({
                user: {
                    id: string;
                    name: string;
                    village: string | null;
                    photoUrl: string | null;
                };
            } & {
                id: string;
                role: string;
                userId: string;
                isMuted: boolean;
                isHandRaised: boolean;
                joinedAt: Date;
                leftAt: Date | null;
                callId: string;
            })[];
        } & {
            id: string;
            status: import(".prisma/client").$Enums.GroupVoiceCallStatus;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            channelName: string;
            scheduledAt: Date | null;
            targetAudienceType: string;
            targetPlanType: string | null;
            targetCropName: string | null;
            invitedFarmerIds: string[];
            alertSentAt: Date | null;
            alertMessage: string | null;
            startedAt: Date;
            endedAt: Date | null;
            hostId: string;
        };
        token: string;
        appId: string;
        channelName: string;
        eligibleFarmersCount: number;
    }>;
    joinGroupCall(user: AuthUser, callId: string): Promise<{
        call: {
            host: {
                id: string;
                name: string;
                photoUrl: string | null;
            };
            participants: ({
                user: {
                    id: string;
                    name: string;
                    photoUrl: string | null;
                };
            } & {
                id: string;
                role: string;
                userId: string;
                isMuted: boolean;
                isHandRaised: boolean;
                joinedAt: Date;
                leftAt: Date | null;
                callId: string;
            })[];
        } & {
            id: string;
            status: import(".prisma/client").$Enums.GroupVoiceCallStatus;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            channelName: string;
            scheduledAt: Date | null;
            targetAudienceType: string;
            targetPlanType: string | null;
            targetCropName: string | null;
            invitedFarmerIds: string[];
            alertSentAt: Date | null;
            alertMessage: string | null;
            startedAt: Date;
            endedAt: Date | null;
            hostId: string;
        };
        token: string;
        appId: string;
        channelName: string;
    }>;
    endGroupCall(user: AuthUser, callId: string): Promise<{
        success: boolean;
        callId: string;
    }>;
    getActiveCallForUser(user: AuthUser): Promise<({
        host: {
            id: string;
            name: string;
            photoUrl: string | null;
        };
        participants: ({
            user: {
                id: string;
                name: string;
                village: string | null;
                photoUrl: string | null;
            };
        } & {
            id: string;
            role: string;
            userId: string;
            isMuted: boolean;
            isHandRaised: boolean;
            joinedAt: Date;
            leftAt: Date | null;
            callId: string;
        })[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.GroupVoiceCallStatus;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        channelName: string;
        scheduledAt: Date | null;
        targetAudienceType: string;
        targetPlanType: string | null;
        targetCropName: string | null;
        invitedFarmerIds: string[];
        alertSentAt: Date | null;
        alertMessage: string | null;
        startedAt: Date;
        endedAt: Date | null;
        hostId: string;
    }) | null>;
    scheduleGroupCall(advisor: AuthUser, dto: ScheduleGroupCallDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.GroupVoiceCallStatus;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        channelName: string;
        scheduledAt: Date | null;
        targetAudienceType: string;
        targetPlanType: string | null;
        targetCropName: string | null;
        invitedFarmerIds: string[];
        alertSentAt: Date | null;
        alertMessage: string | null;
        startedAt: Date;
        endedAt: Date | null;
        hostId: string;
    }>;
    sendGroupCallAlert(advisor: AuthUser, callId: string, customMessage?: string): Promise<{
        success: boolean;
        notifiedFarmerCount: number;
        alertSentAt: Date | null;
        callId: string;
    }>;
    getAdvisorGroupEvents(advisor: AuthUser): Promise<({
        participants: ({
            user: {
                id: string;
                name: string;
                village: string | null;
                mobile: string;
            };
        } & {
            id: string;
            role: string;
            userId: string;
            isMuted: boolean;
            isHandRaised: boolean;
            joinedAt: Date;
            leftAt: Date | null;
            callId: string;
        })[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.GroupVoiceCallStatus;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        channelName: string;
        scheduledAt: Date | null;
        targetAudienceType: string;
        targetPlanType: string | null;
        targetCropName: string | null;
        invitedFarmerIds: string[];
        alertSentAt: Date | null;
        alertMessage: string | null;
        startedAt: Date;
        endedAt: Date | null;
        hostId: string;
    })[]>;
    getFarmerGroupInvitations(farmer: AuthUser): Promise<({
        host: {
            id: string;
            name: string;
            kingId: string | null;
            photoUrl: string | null;
            specialization: string | null;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.GroupVoiceCallStatus;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        channelName: string;
        scheduledAt: Date | null;
        targetAudienceType: string;
        targetPlanType: string | null;
        targetCropName: string | null;
        invitedFarmerIds: string[];
        alertSentAt: Date | null;
        alertMessage: string | null;
        startedAt: Date;
        endedAt: Date | null;
        hostId: string;
    })[]>;
}
