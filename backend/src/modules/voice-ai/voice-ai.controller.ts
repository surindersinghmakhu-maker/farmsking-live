import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { ProcessVoiceDto, VoiceAIService } from './voice-ai.service';

@UseGuards(JwtAuthGuard)
@Controller('ai/voice')
export class VoiceAIController {
  constructor(private readonly voiceAIService: VoiceAIService) {}

  @Post('command')
  processVoiceCommand(@CurrentUser() user: AuthUser, @Body() dto: ProcessVoiceDto) {
    return this.voiceAIService.processVoiceCommand(user, dto);
  }

  @Get('history')
  getVoiceHistory(@CurrentUser() user: AuthUser) {
    return this.voiceAIService.getVoiceHistory(user);
  }
}
