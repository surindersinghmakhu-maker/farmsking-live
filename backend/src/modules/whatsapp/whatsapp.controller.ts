import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { WhatsappBotService } from './whatsapp.service';
import { WhatsAppGroupSyncService } from './whatsapp-group-sync.service';
import type { Response } from 'express';

@Controller('whatsapp')
export class WhatsappBotController {
  constructor(
    private readonly whatsappService: WhatsappBotService,
    private readonly groupSyncService: WhatsAppGroupSyncService,
  ) {}


  @Get('qr-status')
  getQrStatus() {
    return this.whatsappService.getQrCodeStatus();
  }

  @Get('groups')
  async getAllGroups() {
    const groups = await this.whatsappService.getAllGroups();
    return { groups, total: groups.length };
  }

  @Get('qr')
  getQrWebPage(@Res() res: Response) {
    const status = this.whatsappService.getQrCodeStatus();

    let contentHtml = '';
    if (status.isConnected) {
      contentHtml = `
        <div style="background:#dcfce7; border:1.5px solid #22c55e; color:#15803d; padding:20px; border-radius:12px; font-family:sans-serif; text-align:center;">
          <h2 style="margin:0 0 10px;">🟢 WhatsApp Business Connected!</h2>
          <p style="margin:0;">ਤੁਹਾਡਾ WhatsApp Business ਸਫਲਤਾਪੂਰਵਕ FarmsKing ਨਾਲ ਲਿੰਕ ਹੋ ਗਿਆ ਹੈ। ਹੁਣ OTP ਆਟੋਮੈਟਿਕ ਭੇਜੇ ਜਾਣਗੇ।</p>
        </div>
      `;
    } else if (status.qrCodeDataUrl) {
      contentHtml = `
        <div style="background:#ffffff; border:1px solid #e2e8f0; padding:24px; border-radius:16px; font-family:sans-serif; text-align:center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <h2 style="margin:0 0 8px; color:#0f172a;">📲 WhatsApp Business QR Code Scan</h2>
          <p style="color:#64748b; margin:0 0 20px; font-size:14px;">ਆਪਣੇ ਫੋਨ ਵਿੱਚ <b>WhatsApp Business</b> ਖੋਲ੍ਹੋ ➔ <b>Linked Devices (ਲਿੰਕ ਕੀਤੇ ਡਿਵਾਈਸ)</b> ➔ ਸਕੈਨ ਕਰੋ:</p>
          <img src="${status.qrCodeDataUrl}" alt="WhatsApp QR Code" style="width:260px; height:260px; border:2px solid #16a34a; border-radius:12px; padding:8px; background:#fff;" />
          <p style="color:#94a3b8; font-size:12px; margin-top:16px;">ਇਹ ਪੇਜ ਆਪਣੇ ਆਪ ਹਰ 5 ਸੈਕਿੰਡ ਬਾਅਦ ਰਿਫ੍ਰੈਸ਼ ਹੁੰਦਾ ਹੈ...</p>
        </div>
      `;
    } else {
      contentHtml = `
        <div style="background:#fef3c7; border:1.5px solid #f59e0b; color:#b45309; padding:20px; border-radius:12px; font-family:sans-serif; text-align:center;">
          <h3 style="margin:0 0 8px;">⏳ QR Code ਜਨਰੇਟ ਹੋ ਰਿਹਾ ਹੈ...</h3>
          <p style="margin:0;">ਕਿਰਪਾ ਕਰਕੇ 5 ਸੈਕਿੰਡ ਇੰਤਜ਼ਾਰ ਕਰੋ, ਇਹ ਪੇਜ ਆਟੋਮੈਟਿਕ ਰਿਫ੍ਰੈਸ਼ ਹੋਵੇਗਾ।</p>
        </div>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>FarmsKing WhatsApp Business Link</title>
          <meta http-equiv="refresh" content="5">
          <style>
            body { display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f8fafc; margin:0; }
          </style>
        </head>
        <body>
          <div style="width:100%; max-width:440px; padding:16px;">
            ${contentHtml}
          </div>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }

  @Post('send-test-otp')
  async sendTestOtp(@Body() body: { mobile: string; otp: string }) {
    const success = await this.whatsappService.sendOtpMessage(body.mobile, body.otp);
    return { success, message: success ? 'WhatsApp OTP sent successfully!' : 'Failed or bot not connected.' };
  }

  @Post('unlink')
  async unlinkWhatsAppSession() {
    const success = await this.whatsappService.unlinkSession();
    return { success, message: success ? 'WhatsApp session unlinked successfully. Ready to scan new number.' : 'Failed to unlink session.' };
  }

  @Post('sync-group-members')
  async syncGroupMembers() {
    const result = await this.groupSyncService.syncAdvisorWhatsAppGroup();
    return {
      success: true,
      message: 'WhatsApp Advisor Group membership sync completed successfully.',
      result,
    };
  }

  @Get('group-status')
  async getGroupStatus() {
    const groupJid = await this.groupSyncService.getAdvisorGroupJid();
    const isSyncEnabled = await this.groupSyncService.isSyncEnabled();
    const qrStatus = this.whatsappService.getQrCodeStatus();
    return {
      groupJid: groupJid || 'NOT_CONFIGURED',
      isWhatsAppConnected: qrStatus.isConnected,
      whatsappGroupSyncEnabled: isSyncEnabled,
      info: 'SuperAdmin can toggle whatsappGroupSyncEnabled ON/OFF in App Settings.',
    };
  }

}

