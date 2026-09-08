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
    whatsappService;
    groupSyncService;
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
    getQrWebPage(res) {
        const status = this.whatsappService.getQrCodeStatus();
        let contentHtml = '';
        if (status.isConnected) {
            contentHtml = `
        <div style="background:#dcfce7; border:1.5px solid #22c55e; color:#15803d; padding:20px; border-radius:12px; font-family:sans-serif; text-align:center;">
          <h2 style="margin:0 0 10px;">🟢 WhatsApp Business Connected!</h2>
          <p style="margin:0;">ਤੁਹਾਡਾ WhatsApp Business ਸਫਲਤਾਪੂਰਵਕ FarmsKing ਨਾਲ ਲਿੰਕ ਹੋ ਗਿਆ ਹੈ। ਹੁਣ OTP ਆਟੋਮੈਟਿਕ ਭੇਜੇ ਜਾਣਗੇ।</p>
        </div>
      `;
        }
        else if (status.qrCodeDataUrl) {
            contentHtml = `
        <div style="background:#ffffff; border:1px solid #e2e8f0; padding:24px; border-radius:16px; font-family:sans-serif; text-align:center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <h2 style="margin:0 0 8px; color:#0f172a;">📲 WhatsApp Business QR Code Scan</h2>
          <p style="color:#64748b; margin:0 0 20px; font-size:14px;">ਆਪਣੇ ਫੋਨ ਵਿੱਚ <b>WhatsApp Business</b> ਖੋਲ੍ਹੋ ➔ <b>Linked Devices (ਲਿੰਕ ਕੀਤੇ ਡਿਵਾਈਸ)</b> ➔ ਸਕੈਨ ਕਰੋ:</p>
          <img src="${status.qrCodeDataUrl}" alt="WhatsApp QR Code" style="width:260px; height:260px; border:2px solid #16a34a; border-radius:12px; padding:8px; background:#fff;" />
          <p style="color:#94a3b8; font-size:12px; margin-top:16px;">ਇਹ ਪੇਜ ਆਪਣੇ ਆਪ ਹਰ 5 ਸੈਕਿੰਡ ਬਾਅਦ ਰਿਫ੍ਰੈਸ਼ ਹੁੰਦਾ ਹੈ...</p>
        </div>
      `;
        }
        else {
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