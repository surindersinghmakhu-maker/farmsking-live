import { Inject, Logger, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { ADMIN_STAFF_ROLES, getActiveRolesList } from '../../common/utils/role-policy.util';
import { UserSessionService } from '../auth/user-session.service';

interface AuthedSocket extends Socket {
  data: { user?: AuthUser };
}

export const userRoom = (userId: string) => `user:${userId}`;
export const ADMIN_DESK_ROOM = 'role:ADMIN_DESK';

const WS_ALLOWED_ORIGINS = [
  'https://farmsking.in',
  'https://www.farmsking.in',
  'https://admin.farmsking.in',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:3000',
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
];

@WebSocketGateway({ namespace: '/chat', cors: { origin: WS_ALLOWED_ORIGINS, credentials: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  // Tracks how many live sockets each user currently has open (a user can have more than one tab/device
  // connected at once) — "online" means this count is > 0. Purely in-memory: fine for presence, since a
  // server restart just means everyone briefly shows offline until they reconnect.
  private readonly onlineSocketCounts = new Map<string, number>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly userSessionService: UserSessionService,
  ) {}

  broadcastMarketRateUpdate(payload?: any) {
    if (this.server) {
      this.server.emit('market_rate_updated', payload || { timestamp: new Date().toISOString() });
    }
  }

  isUserOnline(userId: string): boolean {
    return (this.onlineSocketCounts.get(userId) ?? 0) > 0;
  }

  private setOnline(userId: string) {
    const wasOnline = this.isUserOnline(userId);
    this.onlineSocketCounts.set(userId, (this.onlineSocketCounts.get(userId) ?? 0) + 1);
    if (!wasOnline) {
      this.server.emit('presence_update', { userId, isOnline: true });
    }
  }

  private setOffline(userId: string) {
    const current = this.onlineSocketCounts.get(userId) ?? 0;
    if (current <= 1) {
      this.onlineSocketCounts.delete(userId);
      this.server.emit('presence_update', { userId, isOnline: false });
    } else {
      this.onlineSocketCounts.set(userId, current - 1);
    }
  }

  async handleConnection(client: AuthedSocket) {
    const token = client.handshake.auth?.token || client.handshake.query?.token;
    if (!token || typeof token !== 'string') {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<{ sub: string; sid?: string; iat?: number }>(token);
      const user = await this.prisma.user.findFirst({
        where: { id: payload.sub, deletedAt: null },
        select: {
          id: true,
          mobile: true,
          role: true,
          roles: true,
          deactivatedRoles: true,
          name: true,
          isPermanentlyBlocked: true,
          lockoutUntil: true,
        },
      });
      if (!user) {
        client.disconnect();
        return;
      }
      if (user.isPermanentlyBlocked || (user.lockoutUntil && new Date(user.lockoutUntil) > new Date())) {
        client.disconnect();
        return;
      }
      if (!this.userSessionService.isValidSession(user.id, payload.sid, payload.iat)) {
        client.disconnect();
        return;
      }
      client.data.user = {
        id: user.id,
        mobile: user.mobile,
        role: user.role,
        roles: user.roles,
        deactivatedRoles: user.deactivatedRoles,
        name: user.name,
      };
      client.join(userRoom(user.id));
      const activeRoles = getActiveRolesList(user);
      if (activeRoles.some((r) => ADMIN_STAFF_ROLES.includes(r))) {
        client.join(ADMIN_DESK_ROOM);
      }
      this.setOnline(user.id);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthedSocket) {
    const user = client.data.user;
    if (user) this.setOffline(user.id);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { receiverId: string; content: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    try {
      const message = await this.chatService.sendMessage(user, body.receiverId, body.content);
      this.server.to(userRoom(user.id)).to(userRoom(body.receiverId)).emit('new_message', message);
      return { status: 'ok', message };
    } catch (error: any) {
      this.logger.warn(`send_message rejected for ${user.id} -> ${body.receiverId}: ${error.message}`);
      client.emit('chat_error', { message: error.message ?? 'Could not send message.' });
      return { status: 'error', message: error.message };
    }
  }
}
