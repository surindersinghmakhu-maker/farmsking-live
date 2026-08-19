import { Module } from '@nestjs/common';
import { AdvisorAssignmentModule } from '../advisor-assignment/advisor-assignment.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SprayScheduleController } from './spray-schedules.controller';
import { SprayScheduleService } from './spray-schedules.service';

@Module({
  imports: [AdvisorAssignmentModule, NotificationsModule],
  controllers: [SprayScheduleController],
  providers: [SprayScheduleService],
  exports: [SprayScheduleService],
})
export class SprayScheduleModule {}
