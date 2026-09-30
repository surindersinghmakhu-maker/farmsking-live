import { Controller, Post, Body } from '@nestjs/common';
import { AiChatService, AiChatRequestDto } from './ai-chat.service';

@Controller('ai-chat')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('ask')
  async askAi(@Body() dto: AiChatRequestDto) {
    return this.aiChatService.generateAiResponse(dto);
  }
}
