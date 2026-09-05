import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { VoiceCallService } from './voice-call.service';
import { StartGroupCallDto } from './dto/start-group-call.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('voice-call')
export class VoiceCallController {
  constructor(private readonly voiceCallService: VoiceCallService) {}

  @Roles(Role.FARMER, Role.ADVISOR, Role.ADMIN, Role.SUPER_ADMIN, Role.GARDENER, Role.OPERATOR, Role.CUSTOMER, Role.BUSINESS_PARTNER, Role.LABOUR)
  @Post('start')
  startGroupCall(@CurrentUser() user: AuthUser, @Body() dto: StartGroupCallDto) {
    return this.voiceCallService.startGroupCall(user, dto);
  }

  @Roles(Role.FARMER, Role.ADVISOR, Role.ADMIN, Role.SUPER_ADMIN, Role.GARDENER, Role.OPERATOR, Role.CUSTOMER, Role.BUSINESS_PARTNER, Role.LABOUR)
  @Post(':id/join')
  joinGroupCall(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.voiceCallService.joinGroupCall(user, id);
  }

  @Roles(Role.FARMER, Role.ADVISOR, Role.ADMIN, Role.SUPER_ADMIN, Role.GARDENER, Role.OPERATOR, Role.CUSTOMER, Role.BUSINESS_PARTNER, Role.LABOUR)
  @Post(':id/end')
  endGroupCall(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.voiceCallService.endGroupCall(user, id);
  }

  @Get('active')
  getActiveCall(@CurrentUser() user: AuthUser) {
    return this.voiceCallService.getActiveCallForUser(user);
  }
}
