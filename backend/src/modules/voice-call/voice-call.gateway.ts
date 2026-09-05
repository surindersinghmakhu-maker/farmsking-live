import { Injectable, Logger } from '@nestjs/common';
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
import { AuthUser } from '../../common/types/auth-user.type';
import { userRoom } from '../chat/chat.gateway';

interface AuthedSocket extends Socket {
  data: { user?: AuthUser };
}

export const callRoom = (callId: string) => `call:${callId}`;

@WebSocketGateway({ namespace: '/voice-call', cors: { origin: true, credentials: true } })
@Injectable()
export class VoiceCallGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VoiceCallGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthedSocket) {
    const token = client.handshake.auth?.token || client.handshake.query?.token;
    if (!token || typeof token !== 'string') {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<{ sub: string }>(token);
      const user = await this.prisma.user.findFirst({
        where: { id: payload.sub, deletedAt: null },
        select: { id: true, mobile: true, role: true, roles: true, deactivatedRoles: true, name: true },
      });
      if (!user) {
        client.disconnect();
        return;
      }
      client.data.user = user;
      client.join(userRoom(user.id));
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthedSocket) {
    // Clean up if needed
  }

  @SubscribeMessage('join_call_room')
  async handleJoinCallRoom(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { callId: string },
  ) {
    const user = client.data.user;
    if (!user || !body.callId) return;

    client.join(callRoom(body.callId));
    this.server.to(callRoom(body.callId)).emit('user_joined_call', {
      userId: user.id,
      name: user.name,
    });

    return { status: 'joined', callId: body.callId };
  }

  @SubscribeMessage('leave_call_room')
  async handleLeaveCallRoom(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { callId: string },
  ) {
    const user = client.data.user;
    if (!user || !body.callId) return;

    client.leave(callRoom(body.callId));
    this.server.to(callRoom(body.callId)).emit('user_left_call', {
      userId: user.id,
      name: user.name,
    });

    return { status: 'left' };
  }

  @SubscribeMessage('raise_hand')
  async handleRaiseHand(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { callId: string },
  ) {
    const user = client.data.user;
    if (!user || !body.callId) return;

    await this.prisma.groupVoiceCallParticipant.updateMany({
      where: { callId: body.callId, userId: user.id },
      data: { isHandRaised: true },
    });

    this.server.to(callRoom(body.callId)).emit('hand_raised', {
      userId: user.id,
      name: user.name,
    });

    return { status: 'ok' };
  }

  @SubscribeMessage('grant_mic')
  async handleGrantMic(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { callId: string; targetUserId: string },
  ) {
    const user = client.data.user;
    if (!user || !body.callId || !body.targetUserId) return;

    // Verify client is host
    const call = await this.prisma.groupVoiceCall.findUnique({
      where: { id: body.callId },
    });

    if (!call || call.hostId !== user.id) {
      return { status: 'forbidden' };
    }

    await this.prisma.groupVoiceCallParticipant.updateMany({
      where: { callId: body.callId, userId: body.targetUserId },
      data: { role: 'SPEAKER', isMuted: false, isHandRaised: false },
    });

    this.server.to(callRoom(body.callId)).emit('mic_granted', {
      userId: body.targetUserId,
      grantedBy: user.id,
    });

    return { status: 'ok' };
  }

  @SubscribeMessage('toggle_mute')
  async handleToggleMute(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { callId: string; isMuted: boolean },
  ) {
    const user = client.data.user;
    if (!user || !body.callId) return;

    await this.prisma.groupVoiceCallParticipant.updateMany({
      where: { callId: body.callId, userId: user.id },
      data: { isMuted: body.isMuted },
    });

    this.server.to(callRoom(body.callId)).emit('mute_changed', {
      userId: user.id,
      isMuted: body.isMuted,
    });

    return { status: 'ok' };
  }

  @SubscribeMessage('voice_audio_chunk')
  async handleVoiceAudioChunk(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { callId: string; chunk: string },
  ) {
    const user = client.data.user;
    if (!user || !body.callId || !body.chunk) return;

    client.to(callRoom(body.callId)).emit('remote_audio_chunk', {
      senderId: user.id,
      senderName: user.name,
      chunk: body.chunk,
    });
  }

  @SubscribeMessage('webrtc_signal')
  async handleWebRTCSignal(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { callId: string; targetUserId?: string; signal: any },
  ) {
    const user = client.data.user;
    if (!user || !body.callId || !body.signal) return;

    if (body.targetUserId) {
      this.server.to(userRoom(body.targetUserId)).emit('webrtc_signal', {
        senderId: user.id,
        signal: body.signal,
      });
    } else {
      client.to(callRoom(body.callId)).emit('webrtc_signal', {
        senderId: user.id,
        signal: body.signal,
      });
    }
  }

  /**
   * Broadcast to online farmers when an advisor starts a group call
   */
  notifyGroupCallStarted(call: any, eligibleFarmerIds: string[]) {
    eligibleFarmerIds.forEach((farmerId) => {
      this.server.to(userRoom(farmerId)).emit('group_call_started', {
        callId: call.id,
        title: call.title,
        hostName: call.host.name,
      });
    });
  }
}

