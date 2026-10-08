"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappBotController = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_service_1 = require("./whatsapp.service");
const whatsapp_group_sync_service_1 = require("./whatsapp-group-sync.service");
let WhatsappBotController = class WhatsappBotController {
    constructor(whatsappService, groupSyncService) {
        this.whatsappService = whatsappService;
        this.groupSyncService = groupSyncService;
    }
    getQrStatus() {
        return this.whatsappService.getQrCodeStatus();
    }
    async getAllGroups() {
        const groups = await this.whatsappService.getAllGroups();
        return { groups, total: groups.length };
    }
    async resetAndGetQrWebPage(res) {
        await this.whatsappService.forceResetQr();
        return res.redirect('/api/v1/whatsapp/qr');
    }
    getQrWebPage(res) {
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
        }
        else if (status.qrCodeDataUrl) {
            contentHtml = `
        <div style="background:#ffffff; border:1px solid #e2e8f0; padding:24px; border-radius:16px; font-family:sans-serif; text-align:center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <h2 style="margin:0 0 8px; color:#0f172a;">📲 WhatsApp Business QR Code Scan</h2>
          <p style="color:#475569; margin:0 0 16px; font-size:14px; line-height:1.4;">Open <b>WhatsApp Business</b> on your mobile phone ➔ Go to <b>Linked Devices</b> ➔ Tap <b>Link a Device</b> ➔ Scan QR Code below:</p>
          <img src="${status.qrCodeDataUrl}" alt="WhatsApp QR Code" style="width:260px; height:260px; border:2.5px solid #16a34a; border-radius:12px; padding:8px; background:#fff;" />
          <p style="color:#94a3b8; font-size:12px; margin-top:14px; margin-bottom:14px;">This page automatically refreshes every 5 seconds...</p>
          <a href="/api/v1/whatsapp/qr/reset" style="display:inline-block; background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; padding:8px 16px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:12.5px;">🔄 Refresh / Generate New QR Code</a>
        </div>
      `;
        }
        else {
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
    async sendTestOtp(body) {
        const success = await this.whatsappService.sendOtpMessage(body.mobile, body.otp);
        return { success, message: success ? 'WhatsApp OTP sent successfully!' : 'Failed or bot not connected.' };
    }
    async unlinkWhatsAppSession() {
        const success = await this.whatsappService.unlinkSession();
        return { success, message: success ? 'WhatsApp session unlinked successfully. Ready to scan new number.' : 'Failed to unlink session.' };
    }
    async syncGroupMembers() {
        const result = await this.groupSyncService.syncAdvisorWhatsAppGroup();
        return {
            success: true,
            message: 'WhatsApp Advisor Group membership sync completed successfully.',
            result,
        };
    }
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
};
exports.WhatsappBotController = WhatsappBotController;
__decorate([
    (0, common_1.Get)('qr-status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WhatsappBotController.prototype, "getQrStatus", null);
__decorate([
    (0, common_1.Get)('groups'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WhatsappBotController.prototype, "getAllGroups", null);
__decorate([
    (0, common_1.Get)('qr/reset'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WhatsappBotController.prototype, "resetAndGetQrWebPage", null);
__decorate([
    (0, common_1.Get)('qr'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WhatsappBotController.prototype, "getQrWebPage", null);
__decorate([
    (0, common_1.Post)('send-test-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WhatsappBotController.prototype, "sendTestOtp", null);
__decorate([
    (0, common_1.Post)('unlink'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WhatsappBotController.prototype, "unlinkWhatsAppSession", null);
__decorate([
    (0, common_1.Post)('sync-group-members'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WhatsappBotController.prototype, "syncGroupMembers", null);
__decorate([
    (0, common_1.Get)('group-status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WhatsappBotController.prototype, "getGroupStatus", null);
exports.WhatsappBotController = WhatsappBotController = __decorate([
    (0, common_1.Controller)('whatsapp'),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsappBotService,
        whatsapp_group_sync_service_1.WhatsAppGroupSyncService])
], WhatsappBotController);
//# sourceMappingURL=whatsapp.controller.js.map