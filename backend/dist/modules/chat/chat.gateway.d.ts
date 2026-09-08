import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';
import { AuthUser } from '../../common/types/auth-user.type';
interface AuthedSocket extends Socket {
    data: {
        user?: AuthUser;
    };
}
export declare const userRoom: (userId: string) => string;
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly prisma;
    private readonly chatService;
    server: Server;
    private readonly logger;
    private readonly onlineSocketCounts;
    constructor(jwtService: JwtService, prisma: PrismaService, chatService: ChatService);
    isUserOnline(userId: string): boolean;
    private setOnline;
    private setOffline;
    handleConnection(client: AuthedSocket): Promise<void>;
    handleDisconnect(client: AuthedSocket): void;
    handleSendMessage(client: AuthedSocket, body: {
        receiverId: string;
        content: string;
    }): Promise<{
        status: string;
        message: any;
    } | undefined>;
}
export {};
