import { Module } from '@nestjs/common';
import { AdvisorAssignmentController } from './advisor-assignment.controller';
import { AdvisorAssignmentService } from './advisor-assignment.service';

@Module({
  controllers: [AdvisorAssignmentController],
  providers: [AdvisorAssignmentService],
  exports: [AdvisorAssignmentService],
})
export class AdvisorAssignmentModule {}
