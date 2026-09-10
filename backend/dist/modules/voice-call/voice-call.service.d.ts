import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../../common/types/auth-user.type';
import { StartGroupCallDto } from './dto/start-group-call.dto';
export declare class VoiceCallService {
    private readonly prisma;
    private readonly configService;
    constructor(prisma: PrismaService, configService: ConfigService);
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
        status: import(".prisma/client").$Enums.GroupVoiceCallStatus;
        title: string;
        channelName: string;
        hostId: string;
        startedAt: Date;
        endedAt: Date | null;
    }) | null>;
}
