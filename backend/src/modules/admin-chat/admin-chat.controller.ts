import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AdminChatService } from './admin-chat.service';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin-chat')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminChatController {
  constructor(private readonly adminChatService: AdminChatService) {}

  @Post('send')
  async sendMessage(@Request() req, @Body() dto: SendChatMessageDto) {
    return this.adminChatService.sendMessage(req.user.id, req.user.role, dto);
  }

  @Get('my-messages')
  async getFarmerMessages(@Request() req) {
    return this.adminChatService.getFarmerMessages(req.user.id);
  }

  @Get('admin/conversations')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAdminConversations() {
    return this.adminChatService.getAdminConversations();
  }

  @Get('admin/conversations/:farmerId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAdminFarmerThread(@Param('farmerId') farmerId: string) {
    return this.adminChatService.getAdminFarmerThread(farmerId);
  }

  @Post('admin/conversations/:farmerId/resolve')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async resolveFarmerThread(
    @Request() req,
    @Param('farmerId') farmerId: string,
    @Body('notes') notes?: string,
  ) {
    return this.adminChatService.resolveFarmerThread(req.user.id, farmerId, notes);
  }
}

