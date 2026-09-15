import { Module } from '@nestjs/common';
import { SaleBillsController } from './sale-bills.controller';
import { SaleBillsService } from './sale-bills.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  controllers: [SaleBillsController],
  providers: [SaleBillsService],
  exports: [SaleBillsService],
})
export class SaleBillsModule {}

