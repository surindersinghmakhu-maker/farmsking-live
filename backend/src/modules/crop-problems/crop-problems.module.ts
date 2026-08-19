import { Module } from '@nestjs/common';
import { CropsModule } from '../crops/crops.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SprayScheduleModule } from '../spray-schedules/spray-schedules.module';
import { ChatModule } from '../chat/chat.module';
import { CropProblemsController } from './crop-problems.controller';
import { CropProblemsService } from './crop-problems.service';

@Module({
  imports: [CropsModule, NotificationsModule, SprayScheduleModule, ChatModule],
  controllers: [CropProblemsController],
  providers: [CropProblemsService],
  exports: [CropProblemsService],
})
export class CropProblemsModule {}
