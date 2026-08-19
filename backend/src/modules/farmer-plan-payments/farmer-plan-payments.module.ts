import { Module } from '@nestjs/common';
import { AdvisorAssignmentModule } from '../advisor-assignment/advisor-assignment.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AppSettingsModule } from '../app-settings/app-settings.module';
import { FarmerPlansModule } from '../farmer-plans/farmer-plans.module';
import { FarmerPlanPaymentsController } from './farmer-plan-payments.controller';
import { FarmerPlanPaymentsService } from './farmer-plan-payments.service';

@Module({
  imports: [AdvisorAssignmentModule, NotificationsModule, AppSettingsModule, FarmerPlansModule],
  controllers: [FarmerPlanPaymentsController],
  providers: [FarmerPlanPaymentsService],
})
export class FarmerPlanPaymentsModule {}
