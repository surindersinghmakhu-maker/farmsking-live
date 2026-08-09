import { Module } from '@nestjs/common';
import { AdvisorAssignmentModule } from '../advisor-assignment/advisor-assignment.module';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [AdvisorAssignmentModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
