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
                role: import(".prisma/client").$Enums.Role;
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
                callId: string;
                isMuted: boolean;
                isHandRaised: boolean;
                joinedAt: Date;
                leftAt: Date | null;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            status: import(".prisma/client").$Enums.GroupVoiceCallStatus;
            channelName: string;
            hostId: string;
            scheduledAt: Date | null;
            targetAudienceType: string;
            targetPlanType: string | null;
            targetCropName: string | null;
            invitedFarmerIds: string[];
            alertSentAt: Date | null;
            alertMessage: string | null;
            startedAt: Date;
            endedAt: Date | null;
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
                callId: string;
                isMuted: boolean;
                isHandRaised: boolean;
                joinedAt: Date;
                leftAt: Date | null;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            status: import(".prisma/client").$Enums.GroupVoiceCallStatus;
            channelName: string;
            hostId: string;
            scheduledAt: Date | null;
            targetAudienceType: string;
            targetPlanType: string | null;
            targetCropName: string | null;
            invitedFarmerIds: string[];
            alertSentAt: Date | null;
            alertMessage: string | null;
            startedAt: Date;
            endedAt: Date | null;
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
            callId: string;
            isMuted: boolean;
            isHandRaised: boolean;
            joinedAt: Date;
            leftAt: Date | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: import(".prisma/client").$Enums.GroupVoiceCallStatus;
        channelName: string;
        hostId: string;
        scheduledAt: Date | null;
        targetAudienceType: string;
        targetPlanType: string | null;
        targetCropName: string | null;
        invitedFarmerIds: string[];
        alertSentAt: Date | null;
        alertMessage: string | null;
        startedAt: Date;
        endedAt: Date | null;
    }) | null>;
    scheduleGroupCall(advisor: AuthUser, dto: ScheduleGroupCallDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: import(".prisma/client").$Enums.GroupVoiceCallStatus;
        channelName: string;
        hostId: string;
        scheduledAt: Date | null;
        targetAudienceType: string;
        targetPlanType: string | null;
        targetCropName: string | null;
        invitedFarmerIds: string[];
        alertSentAt: Date | null;
        alertMessage: string | null;
        startedAt: Date;
        endedAt: Date | null;
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
                mobile: string;
                name: string;
                village: string | null;
            };
        } & {
            id: string;
            role: string;
            userId: string;
            callId: string;
            isMuted: boolean;
            isHandRaised: boolean;
            joinedAt: Date;
            leftAt: Date | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: import(".prisma/client").$Enums.GroupVoiceCallStatus;
        channelName: string;
        hostId: string;
        scheduledAt: Date | null;
        targetAudienceType: string;
        targetPlanType: string | null;
        targetCropName: string | null;
        invitedFarmerIds: string[];
        alertSentAt: Date | null;
        alertMessage: string | null;
        startedAt: Date;
        endedAt: Date | null;
    })[]>;
    getFarmerGroupInvitations(farmer: AuthUser): Promise<({
        host: {
            id: string;
            kingId: string | null;
            name: string;
            photoUrl: string | null;
            specialization: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: import(".prisma/client").$Enums.GroupVoiceCallStatus;
        channelName: string;
        hostId: string;
        scheduledAt: Date | null;
        targetAudienceType: string;
        targetPlanType: string | null;
        targetCropName: string | null;
        invitedFarmerIds: string[];
        alertSentAt: Date | null;
        alertMessage: string | null;
        startedAt: Date;
        endedAt: Date | null;
    })[]>;
}
