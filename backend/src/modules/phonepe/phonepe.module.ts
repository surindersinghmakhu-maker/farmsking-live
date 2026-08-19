import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PhonePeService } from './phonepe.service';
import { PhonePeWebhookController } from './phonepe-webhook.controller';

@Module({
  imports: [NotificationsModule],
  controllers: [PhonePeWebhookController],
  providers: [PhonePeService],
  exports: [PhonePeService],
})
export class PhonePeModule {}
