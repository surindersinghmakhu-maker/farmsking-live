import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletModule } from '../wallet/wallet.module';
import { AdvisorAssignmentController } from './advisor-assignment.controller';
import { AdvisorAssignmentService } from './advisor-assignment.service';

@Module({
  imports: [NotificationsModule, WalletModule],
  controllers: [AdvisorAssignmentController],
  providers: [AdvisorAssignmentService],
  exports: [AdvisorAssignmentService],
})
export class AdvisorAssignmentModule {}
