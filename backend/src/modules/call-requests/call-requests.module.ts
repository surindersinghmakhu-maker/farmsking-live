import { Module, forwardRef } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { CallRequestsController } from './call-requests.controller';
import { CallRequestsService } from './call-requests.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [NotificationsModule, forwardRef(() => ChatModule)],
  controllers: [CallRequestsController],
  providers: [CallRequestsService],
  exports: [CallRequestsService],
})
export class CallRequestsModule {}

