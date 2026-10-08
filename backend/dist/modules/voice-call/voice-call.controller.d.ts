import type { AuthUser } from '../../common/types/auth-user.type';
import { VoiceCallService } from './voice-call.service';
import { StartGroupCallDto } from './dto/start-group-call.dto';
export declare class VoiceCallController {
    private readonly voiceCallService;
    constructor(voiceCallService: VoiceCallService);
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
            status: import(".prisma/client").$Enums.GroupVoiceCallStatus;
            title: string;
            channelName: string;
            hostId: string;
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
            status: import(".prisma/client").$Enums.GroupVoiceCallStatus;
            title: string;
            channelName: string;
            hostId: string;
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
        status: import(".prisma/client").$Enums.GroupVoiceCallStatus;
        title: string;
        channelName: string;
        hostId: string;
        startedAt: Date;
        endedAt: Date | null;
    }) | null>;
}
