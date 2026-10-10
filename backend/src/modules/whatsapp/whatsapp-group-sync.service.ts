
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappBotService } from './whatsapp.service';
import { Role } from '@prisma/client';

@Injectable()
export class WhatsAppGroupSyncService implements OnModuleInit {
  private readonly logger = new Logger(WhatsAppGroupSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappBotService: WhatsappBotService,
  ) {}

  async onModuleInit() {
    this.logger.log('WhatsApp Group Sync disabled.');
  }

  async testConnection() {
    return { success: false, message: 'Disabled' };
  }

  async triggerGlobalSync() {
    return { success: true, message: 'Disabled' };
  }

  async syncSingleFarmerGroupStatus(userId: string) {
    // Disabled
  }

  async autoAddNewUser(userId: string, mobile: string, name: string) {
    // Disabled
  }

  async autoRemoveUser(userId: string, mobile: string, name: string) {
    // Disabled
  }

  async syncEligibleUsersToCommunityGroup(users: any[]) {
    // Disabled
  }
}

