import { Module } from '@nestjs/common';
import { AdvisorAssignmentModule } from '../advisor-assignment/advisor-assignment.module';
import { PlanRenewalModule } from '../plan-renewal/plan-renewal.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AppSettingsModule } from '../app-settings/app-settings.module';
import { PlanPaymentsController } from './plan-payments.controller';
import { PlanPaymentsService } from './plan-payments.service';

@Module({
  imports: [AdvisorAssignmentModule, PlanRenewalModule, NotificationsModule, AppSettingsModule],
  controllers: [PlanPaymentsController],
  providers: [PlanPaymentsService],
})
export class PlanPaymentsModule {}
