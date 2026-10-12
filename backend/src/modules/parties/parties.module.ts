import { Module } from '@nestjs/common';
import { PartiesController } from './parties.controller';
import { PublicPartiesController } from './public-parties.controller';
import { PartiesService } from './parties.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  controllers: [PartiesController, PublicPartiesController],
  providers: [PartiesService],
  exports: [PartiesService],
})
export class PartiesModule {}

