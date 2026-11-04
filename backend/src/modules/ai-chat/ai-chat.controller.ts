import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AiChatService, AiChatRequestDto } from './ai-chat.service';

@Controller('ai-chat')
@UseGuards(ThrottlerGuard)
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('ask')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async askAi(@Body() dto: AiChatRequestDto) {
    return this.aiChatService.generateAiResponse(dto);
  }

  @Post('diagnose-leaf')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async diagnoseLeaf(@Body() body: { imageBase64: string }) {
    return this.aiChatService.diagnoseLeaf(body?.imageBase64 || '');
  }
}
