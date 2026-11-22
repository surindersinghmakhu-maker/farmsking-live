import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GardenerPlansModule } from '../gardener-plans/gardener-plans.module';
import { AiChatModule } from '../ai-chat/ai-chat.module';
import { GardensService } from './gardens.service';
import { GardensController } from './gardens.controller';

@Module({
  imports: [PrismaModule, GardenerPlansModule, AiChatModule],
  controllers: [GardensController],
  providers: [GardensService],
})
export class GardensModule {}
