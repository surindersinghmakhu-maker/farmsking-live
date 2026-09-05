import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletModule } from '../wallet/wallet.module';
import { WhatsappBotModule } from '../whatsapp/whatsapp.module';
import { AdvisorAssignmentController } from './advisor-assignment.controller';
import { AdvisorAssignmentService } from './advisor-assignment.service';

@Module({
  imports: [NotificationsModule, WalletModule, WhatsappBotModule],
  controllers: [AdvisorAssignmentController],
  providers: [AdvisorAssignmentService],
  exports: [AdvisorAssignmentService],
})
export class AdvisorAssignmentModule {}

