import { Module } from '@nestjs/common';
import { SaleBillsController } from './sale-bills.controller';
import { SaleBillsService } from './sale-bills.service';

@Module({
  controllers: [SaleBillsController],
  providers: [SaleBillsService],
})
export class SaleBillsModule {}
