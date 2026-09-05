import { Module } from '@nestjs/common';
import { VoiceAIService } from './voice-ai.service';
import { VoiceAIController } from './voice-ai.controller';

@Module({
  controllers: [VoiceAIController],
  providers: [VoiceAIService],
  exports: [VoiceAIService],
})
export class VoiceAIModule {}
