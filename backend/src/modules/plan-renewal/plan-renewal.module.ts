import { Module } from '@nestjs/common';
import { AdvisorAssignmentModule } from '../advisor-assignment/advisor-assignment.module';
import { AppSettingsModule } from '../app-settings/app-settings.module';
import { PlanRenewalController } from './plan-renewal.controller';
import { PlanRenewalService } from './plan-renewal.service';

@Module({
  imports: [AdvisorAssignmentModule, AppSettingsModule],
  controllers: [PlanRenewalController],
  providers: [PlanRenewalService],
  exports: [PlanRenewalService],
})
export class PlanRenewalModule {}
