import { Module } from '@nestjs/common';
import { PartnerAssignmentController } from './partner-assignment.controller';
import { PartnerAssignmentService } from './partner-assignment.service';

@Module({
  controllers: [PartnerAssignmentController],
  providers: [PartnerAssignmentService],
})
export class PartnerAssignmentModule {}
