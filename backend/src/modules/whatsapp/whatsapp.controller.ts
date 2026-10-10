
import { Controller, Get, Post, Body } from '@nestjs/common';
import { WhatsappBotService } from './whatsapp.service';
import { WhatsAppGroupSyncService } from './whatsapp-group-sync.service';

@Controller('whatsapp')
export class WhatsappBotController {
  constructor(
    private readonly whatsappService: WhatsappBotService,
    private readonly groupSyncService: WhatsAppGroupSyncService,
  ) {}

  @Get('groups')
  async getAllGroups() {
    return [];
  }

  @Post('reset-qr')
  async resetQr() {
    return { success: true };
  }

  @Get('status')
  async getStatus() {
    return { isConnected: false, message: 'Disabled' };
  }

  @Post('send-otp')
  async sendOtp(@Body() body: any) {
    return { success: true };
  }

  @Post('logout')
  async logout() {
    return { success: true };
  }

  @Post('sync-advisor-group')
  async syncAdvisorGroup() {
    return { success: true };
  }

  @Get('group-sync-status')
  async getSyncStatus() {
    return { enabled: false, groupId: null };
  }
}

