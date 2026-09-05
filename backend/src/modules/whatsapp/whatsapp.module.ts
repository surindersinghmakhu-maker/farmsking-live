import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsappBotService } from './whatsapp.service';
import { WhatsappBotController } from './whatsapp.controller';
import { WhatsAppGroupSyncService } from './whatsapp-group-sync.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [WhatsappBotController],
  providers: [WhatsappBotService, WhatsAppGroupSyncService],
  exports: [WhatsappBotService, WhatsAppGroupSyncService],
})
export class WhatsappBotModule {}

