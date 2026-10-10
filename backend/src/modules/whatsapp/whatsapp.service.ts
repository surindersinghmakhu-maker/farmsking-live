
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class WhatsappBotService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappBotService.name);

  async onModuleInit() {
    this.logger.log('WhatsApp Bot disabled.');
  }

  getQrCodeStatus() {
    return { isConnected: false, qrCode: null, message: 'WhatsApp integration is disabled' };
  }

  logout() {
    return { success: true, message: 'Disabled' };
  }

  async sendDirectTextMessage(mobile: string, text: string) {
    // Disabled
  }

  async sendOtpMessage(mobile: string, otp: string) {
    return { success: true };
  }

  formatJid(mobile: string) {
    return mobile;
  }

  async getGroupParticipants(groupJid: string) {
    return [];
  }

  async addParticipantToGroup(groupJid: string, mobile: string, name?: string) {
    return { success: true };
  }

  async removeParticipantFromGroup(groupJid: string, mobile: string, name?: string) {
    return { success: true };
  }
  
  async getGroupInfoFromInviteCode(code: string) {
    return { id: 'disabled_group_id' };
  }
}

