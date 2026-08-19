import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { CallRequestsController } from './call-requests.controller';
import { CallRequestsService } from './call-requests.service';

@Module({
  imports: [NotificationsModule],
  controllers: [CallRequestsController],
  providers: [CallRequestsService],
  exports: [CallRequestsService],
})
export class CallRequestsModule {}
