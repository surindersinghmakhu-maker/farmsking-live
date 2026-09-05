import { Module } from '@nestjs/common';
import { AdvisorAssignmentModule } from '../advisor-assignment/advisor-assignment.module';
import { WhatsappBotModule } from '../whatsapp/whatsapp.module';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [AdvisorAssignmentModule, WhatsappBotModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}

