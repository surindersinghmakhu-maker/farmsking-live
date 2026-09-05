import { Module } from '@nestjs/common';
import { MandiAIService } from './mandi-ai.service';
import { MandiAIController } from './mandi-ai.controller';

@Module({
  controllers: [MandiAIController],
  providers: [MandiAIService],
  exports: [MandiAIService],
})
export class MandiAIModule {}
