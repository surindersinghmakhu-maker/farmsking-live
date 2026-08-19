import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FARMER, Role.GARDENER, Role.ADVISOR, Role.ADMIN, Role.SUPER_ADMIN)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  listConversations(@CurrentUser() user: AuthUser) {
    return this.chatService.listConversations(user);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: AuthUser) {
    return this.chatService.getUnreadCount(user).then((count) => ({ count }));
  }

  @Get('with/:userId')
  getMessages(@CurrentUser() user: AuthUser, @Param('userId') userId: string) {
    return this.chatService.getMessages(user, userId);
  }

  @Get('online/:userId')
  isUserOnline(@Param('userId') userId: string) {
    return this.chatService.isUserOnline(userId);
  }

  /** Super Admin only: read-only chat log between any two users — private message content, owner-level access. */
  @Roles(Role.SUPER_ADMIN)
  @Get('admin/between/:userAId/:userBId')
  getMessagesBetweenAsAdmin(@Param('userAId') userAId: string, @Param('userBId') userBId: string) {
    return this.chatService.getMessagesBetweenAsAdmin(userAId, userBId);
  }

  /** REST fallback for sending — the WebSocket gateway is the primary real-time path. */
  @Post()
  sendMessage(@CurrentUser() user: AuthUser, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(user, dto.receiverId, dto.content);
  }
}
