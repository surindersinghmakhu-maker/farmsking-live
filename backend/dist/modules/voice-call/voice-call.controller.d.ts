import type { AuthUser } from '../../common/types/auth-user.type';
import { VoiceCallService } from './voice-call.service';
import { StartGroupCallDto } from './dto/start-group-call.dto';
import { ScheduleGroupCallDto, SendGroupAlertDto } from './dto/schedule-group-call.dto';
export declare class VoiceCallController {
    private readonly voiceCallService;
    constructor(voiceCallService: VoiceCallService);
    scheduleGroupCall(user: AuthUser, dto: ScheduleGroupCallDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.GroupVoiceCallStatus;
        title: string;
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
    sendGroupCallAlert(user: AuthUser, id: string, dto: SendGroupAlertDto): Promise<{
        success: boolean;
        notifiedFarmerCount: number;
        alertSentAt: Date | null;
        callId: string;
    }>;
    getAdvisorGroupEvents(user: AuthUser): Promise<({
        participants: ({
            user: {
                name: string;
                id: string;
                mobile: string;
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
        status: import(".prisma/client").$Enums.GroupVoiceCallStatus;
        title: string;
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
    getFarmerGroupInvitations(user: AuthUser): Promise<({
        host: {
            name: string;
            id: string;
            kingId: string | null;
            photoUrl: string | null;
            specialization: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.GroupVoiceCallStatus;
        title: string;
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
    startGroupCall(user: AuthUser, dto: StartGroupCallDto): Promise<{
        call: {
            host: {
                name: string;
                id: string;
                role: import(".prisma/client").$Enums.Role;
                photoUrl: string | null;
            };
            participants: ({
                user: {
                    name: string;
                    id: string;
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
            status: import(".prisma/client").$Enums.GroupVoiceCallStatus;
            title: string;
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
    joinGroupCall(user: AuthUser, id: string): Promise<{
        call: {
            host: {
                name: string;
                id: string;
                photoUrl: string | null;
            };
            participants: ({
                user: {
                    name: string;
                    id: string;
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
            status: import(".prisma/client").$Enums.GroupVoiceCallStatus;
            title: string;
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
    endGroupCall(user: AuthUser, id: string): Promise<{
        success: boolean;
        callId: string;
    }>;
    getActiveCall(user: AuthUser): Promise<({
        host: {
            name: string;
            id: string;
            photoUrl: string | null;
        };
        participants: ({
            user: {
                name: string;
                id: string;
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
        status: import(".prisma/client").$Enums.GroupVoiceCallStatus;
        title: string;
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
}
