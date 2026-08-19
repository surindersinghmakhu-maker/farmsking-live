import { Module } from '@nestjs/common';
import { PlotsModule } from '../plots/plots.module';
import { FarmerPlansModule } from '../farmer-plans/farmer-plans.module';
import { AdvisorAssignmentModule } from '../advisor-assignment/advisor-assignment.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CropsController } from './crops.controller';
import { CropsService } from './crops.service';

@Module({
  imports: [PlotsModule, FarmerPlansModule, AdvisorAssignmentModule, NotificationsModule],
  controllers: [CropsController],
  providers: [CropsService],
  exports: [CropsService],
})
export class CropsModule {}
