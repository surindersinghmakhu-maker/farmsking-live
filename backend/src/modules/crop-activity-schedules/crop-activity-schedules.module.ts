import { Module } from '@nestjs/common';
import { CropsModule } from '../crops/crops.module';
import { AdvisorAssignmentModule } from '../advisor-assignment/advisor-assignment.module';
import { CropActivitySchedulesController } from './crop-activity-schedules.controller';
import { CropActivitySchedulesService } from './crop-activity-schedules.service';

@Module({
  imports: [CropsModule, AdvisorAssignmentModule],
  controllers: [CropActivitySchedulesController],
  providers: [CropActivitySchedulesService],
  exports: [CropActivitySchedulesService],
})
export class CropActivitySchedulesModule {}
