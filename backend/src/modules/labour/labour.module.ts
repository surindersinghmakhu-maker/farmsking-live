import { Module } from '@nestjs/common';
import { LabourController } from './labour.controller';
import { LabourService } from './labour.service';

@Module({
  controllers: [LabourController],
  providers: [LabourService],
  exports: [LabourService],
})
export class LabourModule {}
