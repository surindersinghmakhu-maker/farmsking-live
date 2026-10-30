import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
interface AuthedSocket extends Socket {
    data: {
        user?: AuthUser;
    };
}
export declare const callRoom: (callId: string) => string;
export declare class VoiceCallGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly prisma;
    server: Server;
    private readonly logger;
    constructor(jwtService: JwtService, prisma: PrismaService);
    handleConnection(client: AuthedSocket): Promise<void>;
    handleDisconnect(client: AuthedSocket): void;
    handleJoinCallRoom(client: AuthedSocket, body: {
        callId: string;
    }): Promise<{
        status: string;
        callId: string;
    } | undefined>;
    handleLeaveCallRoom(client: AuthedSocket, body: {
        callId: string;
    }): Promise<{
        status: string;
    } | undefined>;
    handleRaiseHand(client: AuthedSocket, body: {
        callId: string;
    }): Promise<{
        status: string;
    } | undefined>;
    handleGrantMic(client: AuthedSocket, body: {
        callId: string;
        targetUserId: string;
    }): Promise<{
        status: string;
    } | undefined>;
    handleToggleMute(client: AuthedSocket, body: {
        callId: string;
        isMuted: boolean;
    }): Promise<{
        status: string;
    } | undefined>;
    handleVoiceAudioChunk(client: AuthedSocket, body: {
        callId: string;
        chunk: string;
    }): Promise<void>;
    handleWebRTCSignal(client: AuthedSocket, body: {
        callId: string;
        targetUserId?: string;
        signal: any;
    }): Promise<void>;
    notifyGroupCallStarted(call: any, eligibleFarmerIds: string[]): void;
}
export {};
