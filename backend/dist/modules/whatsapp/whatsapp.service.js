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
var WhatsappBotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappBotService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const app_settings_service_1 = require("../app-settings/app-settings.service");
let WhatsappBotService = WhatsappBotService_1 = class WhatsappBotService {
    constructor(configService, prisma, appSettingsService) {
        this.configService = configService;
        this.prisma = prisma;
        this.appSettingsService = appSettingsService;
        this.logger = new common_1.Logger(WhatsappBotService_1.name);
    }
    async onModuleInit() {
        let phoneNumberId = this.configService.get('META_PHONE_NUMBER_ID');
        let token = this.configService.get('META_WHATSAPP_TOKEN');
        try {
            const integrations = await this.appSettingsService.getIntegrations();
            const meta = integrations?.whatsapp?.providers?.metaCloud;
            if (meta?.phoneNumberId)
                phoneNumberId = meta.phoneNumberId;
            if (meta?.accessToken)
                token = meta.accessToken;
        }
        catch { }
        if (phoneNumberId && token) {
            this.logger.log(`WhatsApp Meta Cloud API initialized with Phone ID: ${phoneNumberId}`);
        }
        else {
            this.logger.log('WhatsApp Bot running in Hybrid Sandbox / Meta Cloud Ready mode.');
        }
    }
    formatIndianMobile(mobile) {
        const clean = mobile.replace(/\D/g, '');
        if (clean.length === 10) {
            return `91${clean}`;
        }
        if (clean.length === 12 && clean.startsWith('91')) {
            return clean;
        }
        return clean;
    }
    async getQrCodeStatus() {
        let activeProvider = 'META_CLOUD';
        try {
            const integrations = await this.appSettingsService.getIntegrations();
            if (integrations?.whatsapp?.activeProvider) {
                activeProvider = integrations.whatsapp.activeProvider;
            }
        }
        catch { }
        return {
            isConnected: true,
            activeProvider,
            verifiedSender: 'FARMSKING TECHNOLOGIES PRIVATE LIMITED',
            message: `Active WhatsApp Provider: ${activeProvider} (Global System Integrations)`,
        };
    }
    logout() {
        return { success: true, message: 'WhatsApp session reset.' };
    }
    async sendDirectTextMessage(mobile, text) {
        const cleanRecipient = this.formatIndianMobile(mobile);
        let phoneNumberId = this.configService.get('META_PHONE_NUMBER_ID') || '9577622000';
        let token = this.configService.get('META_WHATSAPP_TOKEN');
        try {
            const integrations = await this.appSettingsService.getIntegrations();
            const meta = integrations?.whatsapp?.providers?.metaCloud;
            if (meta?.phoneNumberId)
                phoneNumberId = meta.phoneNumberId;
            if (meta?.accessToken)
                token = meta.accessToken;
        }
        catch { }
        if (!token) {
            this.logger.log(`[WhatsApp Sandbox Echo to ${cleanRecipient}]: ${text.slice(0, 80)}...`);
            return {
                success: true,
                messageId: `sim_wa_${Date.now()}`,
                provider: 'META_CLOUD_SIMULATED',
            };
        }
        try {
            const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: cleanRecipient,
                    type: 'text',
                    text: { preview_url: true, body: text },
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                this.logger.warn(`[Meta WhatsApp API Error]: ${JSON.stringify(data)}`);
                return { success: false, error: data?.error?.message || 'Meta API delivery failed' };
            }
            const messageId = data?.messages?.[0]?.id;
            this.logger.log(`[WhatsApp Dispatched to ${cleanRecipient}]: ID ${messageId}`);
            return { success: true, messageId, provider: 'META_CLOUD' };
        }
        catch (err) {
            this.logger.error(`[WhatsApp Dispatch Exception]: ${err.message}`);
            return { success: false, error: err.message };
        }
    }
    async sendOtpMessage(mobile, otp) {
        const message = `🌱 *FarmsKing Verification*\n\nYour 6-digit login verification code is: *${otp}*\n\nValid for 5 minutes. Please do not share this code with anyone.\n\n_FarmsKing Technologies Private Limited_`;
        return this.sendDirectTextMessage(mobile, message);
    }
    async sendOrderInvoice(mobile, orderNumber, amount, trackingUrl) {
        const trackingSection = trackingUrl ? `\n📍 *Live Courier Tracking:* ${trackingUrl}` : '';
        const message = `📦 *FarmsKing Order Confirmed*\n\nOrder ID: *#${orderNumber}*\nTotal Amount: *₹${amount.toLocaleString('en-IN')}*\nStatus: *Packed & Dispatched via Shiprocket*${trackingSection}\n\nYour official GST Invoice is available in your FarmsKing profile.\n\nThank you for choosing sustainable agritech! 🌾\n_FarmsKing Technologies Private Limited_`;
        return this.sendDirectTextMessage(mobile, message);
    }
    async sendMandiRatesBroadcast(groupJid, ratesSummary) {
        this.logger.log(`[WhatsApp Group Broadcast to ${groupJid}]: ${ratesSummary.slice(0, 60)}...`);
        return { success: true, messageId: `mandi_broadcast_${Date.now()}` };
    }
    formatJid(mobile) {
        const clean = this.formatIndianMobile(mobile);
        return `${clean}@s.whatsapp.net`;
    }
    async getGroupParticipants(groupJid) {
        return [];
    }
    async addParticipantToGroup(groupJid, mobile, name) {
        this.logger.log(`[WhatsApp Auto-Add]: Adding ${mobile} (${name || 'Farmer'}) to ${groupJid}`);
        return { success: true };
    }
    async removeParticipantFromGroup(groupJid, mobile, name) {
        this.logger.log(`[WhatsApp Auto-Remove]: Removing ${mobile} from ${groupJid}`);
        return { success: true };
    }
    async getGroupInfoFromInviteCode(code) {
        return { id: `farmsking_advisory_${code}` };
    }
};
exports.WhatsappBotService = WhatsappBotService;
exports.WhatsappBotService = WhatsappBotService = WhatsappBotService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        app_settings_service_1.AppSettingsService])
], WhatsappBotService);
//# sourceMappingURL=whatsapp.service.js.map