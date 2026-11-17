import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { VoiceCallService } from './voice-call.service';
import { StartGroupCallDto } from './dto/start-group-call.dto';
import { ScheduleGroupCallDto, SendGroupAlertDto } from './dto/schedule-group-call.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('voice-call')
export class VoiceCallController {
  constructor(private readonly voiceCallService: VoiceCallService) {}

  @Roles(Role.ADVISOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Post('schedule')
  scheduleGroupCall(@CurrentUser() user: AuthUser, @Body() dto: ScheduleGroupCallDto) {
    return this.voiceCallService.scheduleGroupCall(user, dto);
  }

  @Roles(Role.ADVISOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/send-alert')
  sendGroupCallAlert(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SendGroupAlertDto,
  ) {
    return this.voiceCallService.sendGroupCallAlert(user, id, dto?.message);
  }

  @Roles(Role.ADVISOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Get('advisor/events')
  getAdvisorGroupEvents(@CurrentUser() user: AuthUser) {
    return this.voiceCallService.getAdvisorGroupEvents(user);
  }

  @Roles(Role.FARMER, Role.CUSTOMER, Role.GARDENER)
  @Get('farmer/invitations')
  getFarmerGroupInvitations(@CurrentUser() user: AuthUser) {
    return this.voiceCallService.getFarmerGroupInvitations(user);
  }

  @Roles(Role.FARMER, Role.ADVISOR, Role.ADMIN, Role.SUPER_ADMIN, Role.GARDENER, Role.OPERATOR, Role.CUSTOMER, Role.AGENT, Role.LABOUR)
  @Post('start')
  startGroupCall(@CurrentUser() user: AuthUser, @Body() dto: StartGroupCallDto) {
    return this.voiceCallService.startGroupCall(user, dto);
  }

  @Roles(Role.FARMER, Role.ADVISOR, Role.ADMIN, Role.SUPER_ADMIN, Role.GARDENER, Role.OPERATOR, Role.CUSTOMER, Role.AGENT, Role.LABOUR)
  @Post(':id/join')
  joinGroupCall(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.voiceCallService.joinGroupCall(user, id);
  }

  @Roles(Role.FARMER, Role.ADVISOR, Role.ADMIN, Role.SUPER_ADMIN, Role.GARDENER, Role.OPERATOR, Role.CUSTOMER, Role.AGENT, Role.LABOUR)
  @Post(':id/end')
  endGroupCall(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.voiceCallService.endGroupCall(user, id);
  }

  @Get('active')
  getActiveCall(@CurrentUser() user: AuthUser) {
    return this.voiceCallService.getActiveCallForUser(user);
  }
}
