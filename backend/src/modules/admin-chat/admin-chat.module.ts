import { Module, forwardRef } from '@nestjs/common';
import { AdminChatController } from './admin-chat.controller';
import { AdminChatService } from './admin-chat.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatModule } from '../chat/chat.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, forwardRef(() => ChatModule), NotificationsModule],
  controllers: [AdminChatController],
  providers: [AdminChatService],
  exports: [AdminChatService],
})
export class AdminChatModule {}

