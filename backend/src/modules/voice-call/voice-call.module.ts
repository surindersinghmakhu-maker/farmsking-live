import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VoiceCallController } from './voice-call.controller';
import { VoiceCallService } from './voice-call.service';
import { VoiceCallGateway } from './voice-call.gateway';

@Module({
  imports: [AuthModule],
  controllers: [VoiceCallController],
  providers: [VoiceCallService, VoiceCallGateway],
  exports: [VoiceCallService, VoiceCallGateway],
})
export class VoiceCallModule {}
