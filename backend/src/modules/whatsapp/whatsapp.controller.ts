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

  @Get('qr/reset')
  async resetAndGetQrWebPage(@Res() res: Response) {
    await this.whatsappService.forceResetQr();
    return res.redirect('/api/v1/whatsapp/qr');
  }

  @Get('qr')
  getQrWebPage(@Res() res: Response) {
    const status = this.whatsappService.getQrCodeStatus();

    let contentHtml = '';
    if (status.isConnected) {
      contentHtml = `
        <div style="background:#dcfce7; border:1.5px solid #22c55e; color:#15803d; padding:24px; border-radius:16px; font-family:sans-serif; text-align:center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <h2 style="margin:0 0 10px; color:#15803d;">🟢 WhatsApp Business Connected!</h2>
          <p style="margin:0 0 16px; color:#166534; font-size:14px; line-height:1.5;">Your WhatsApp Business account has been successfully linked with FarmsKing Platform.<br/>OTP and notification messages will now be sent automatically.</p>
          <a href="/api/v1/whatsapp/qr/reset" style="display:inline-block; margin-top:8px; background:#dc2626; color:#ffffff; padding:10px 18px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:13px;">🔗 Unlink & Connect New Number</a>
        </div>
      `;
    } else if (status.qrCodeDataUrl) {
      contentHtml = `
        <div style="background:#ffffff; border:1px solid #e2e8f0; padding:24px; border-radius:16px; font-family:sans-serif; text-align:center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <h2 style="margin:0 0 8px; color:#0f172a;">📲 WhatsApp Business QR Code Scan</h2>
          <p style="color:#475569; margin:0 0 16px; font-size:14px; line-height:1.4;">Open <b>WhatsApp Business</b> on your mobile phone ➔ Go to <b>Linked Devices</b> ➔ Tap <b>Link a Device</b> ➔ Scan QR Code below:</p>
          <img src="${status.qrCodeDataUrl}" alt="WhatsApp QR Code" style="width:260px; height:260px; border:2.5px solid #16a34a; border-radius:12px; padding:8px; background:#fff;" />
          <p style="color:#94a3b8; font-size:12px; margin-top:14px; margin-bottom:14px;">This page automatically refreshes every 5 seconds...</p>
          <a href="/api/v1/whatsapp/qr/reset" style="display:inline-block; background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; padding:8px 16px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:12.5px;">🔄 Refresh / Generate New QR Code</a>
        </div>
      `;
    } else {
      contentHtml = `
        <div style="background:#fffbeb; border:1.5px solid #f59e0b; color:#b45309; padding:24px; border-radius:16px; font-family:sans-serif; text-align:center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <h3 style="margin:0 0 10px; color:#b45309; font-size:18px;">⏳ Generating Fresh QR Code...</h3>
          <p style="margin:0 0 16px; font-size:14px; color:#92400e;">Please wait a few seconds. The QR code will load automatically on screen.</p>
          <a href="/api/v1/whatsapp/qr/reset" style="display:inline-block; background:#f59e0b; color:#ffffff; padding:10px 18px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:13px;">⚡ Click Here to Force Reset & Load QR</a>
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

