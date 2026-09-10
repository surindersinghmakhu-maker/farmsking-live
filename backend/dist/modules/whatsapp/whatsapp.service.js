"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var WhatsappBotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappBotService = void 0;
const common_1 = require("@nestjs/common");
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const QRCode = __importStar(require("qrcode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
let WhatsappBotService = WhatsappBotService_1 = class WhatsappBotService {
    logger = new common_1.Logger(WhatsappBotService_1.name);
    socket = null;
    qrCodeDataUrl = null;
    isConnected = false;
    async onModuleInit() {
        this.initWhatsAppSocket();
    }
    async initWhatsAppSocket() {
        try {
            if (this.socket) {
                try {
                    this.socket.ev.removeAllListeners('creds.update');
                    this.socket.ev.removeAllListeners('connection.update');
                    this.socket.end(undefined);
                }
                catch { }
                this.socket = null;
            }
            const authFolder = path.join(process.cwd(), 'whatsapp_auth_session');
            const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)(authFolder);
            this.socket = (0, baileys_1.default)({
                auth: state,
                printQRInTerminal: false,
            });
            this.socket.ev.on('creds.update', saveCreds);
            this.socket.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                if (qr) {
                    this.logger.log('New WhatsApp QR Code generated!');
                    this.qrCodeDataUrl = await QRCode.toDataURL(qr);
                }
                if (connection === 'close') {
                    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== baileys_1.DisconnectReason.loggedOut;
                    this.isConnected = false;
                    this.logger.warn(`WhatsApp connection closed. Reconnecting: ${shouldReconnect}`);
                    if (shouldReconnect) {
                        setTimeout(() => this.initWhatsAppSocket(), 5000);
                    }
                    else {
                        this.qrCodeDataUrl = null;
                    }
                }
                else if (connection === 'open') {
                    this.isConnected = true;
                    this.qrCodeDataUrl = null;
                    this.logger.log('🟢 WhatsApp Business connected successfully & linked!');
                }
            });
        }
        catch (err) {
            this.logger.error('Error initializing WhatsApp socket:', err);
        }
    }
    getQrCodeStatus() {
        return {
            isConnected: this.isConnected,
            qrCodeDataUrl: this.qrCodeDataUrl,
        };
    }
    async unlinkSession() {
        try {
            if (this.socket) {
                await this.socket.logout().catch(() => { });
                this.socket.end(new Error('Unlinked by SuperAdmin'));
                this.socket = null;
            }
            this.isConnected = false;
            this.qrCodeDataUrl = null;
            const authFolder = path.join(process.cwd(), 'whatsapp_auth_session');
            if (fs.existsSync(authFolder)) {
                fs.rmSync(authFolder, { recursive: true, force: true });
            }
            setTimeout(() => this.initWhatsAppSocket(), 2000);
            return true;
        }
        catch (err) {
            this.logger.error('Error unlinking WhatsApp session:', err);
            return false;
        }
    }
    async sendOtpMessage(mobileNumber, otpCode) {
        const metaToken = process.env.META_WA_TOKEN || process.env.WHATSAPP_CLOUD_API_TOKEN;
        const metaPhoneId = process.env.META_WA_PHONE_ID || process.env.WHATSAPP_CLOUD_PHONE_ID;
        if (metaToken && metaPhoneId) {
            try {
                const cleanMobile = mobileNumber.replace(/\D/g, '');
                const recipient = cleanMobile.startsWith('91') ? cleanMobile : '91' + cleanMobile;
                const response = await fetch(`https://graph.facebook.com/v20.0/${metaPhoneId}/messages`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${metaToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        to: recipient,
                        type: 'text',
                        text: {
                            body: `🌾 *FarmsKing Verification Code*\n\nYour 5-digit FarmsKing verification code is: *${otpCode}*\n\nThis code is valid for 10 minutes.`,
                        },
                    }),
                });
                if (response.ok) {
                    this.logger.log(`🟢 Meta WhatsApp Cloud API OTP sent successfully to ${recipient}`);
                    return true;
                }
                else {
                    const errJson = await response.json().catch(() => ({}));
                    this.logger.warn('Meta WhatsApp Cloud API error response:', JSON.stringify(errJson));
                }
            }
            catch (metaErr) {
                this.logger.error('Meta WhatsApp Cloud API request failed:', metaErr);
            }
        }
        if (!this.socket || !this.isConnected) {
            this.logger.warn('WhatsApp Bot is not connected yet. Fallback to deep-link / auto-fill.');
            return false;
        }
        try {
            const cleanMobile = mobileNumber.replace(/\D/g, '');
            const formattedJid = `${cleanMobile.startsWith('91') ? cleanMobile : '91' + cleanMobile}@s.whatsapp.net`;
            const message = `🌾 *FarmsKing Verification Code*\n\nYour 5-digit FarmsKing verification code is: *${otpCode}*\n\nThis code is valid for 10 minutes.`;
            await this.socket.sendMessage(formattedJid, { text: message });
            this.logger.log(`WhatsApp OTP sent successfully to ${mobileNumber}`);
            return true;
        }
        catch (err) {
            this.logger.error(`Failed to send WhatsApp message to ${mobileNumber}:`, err);
            return false;
        }
    }
    async getGroupInfoFromInviteCode(inviteCode) {
        if (!this.socket || !this.isConnected) {
            this.logger.warn('WhatsApp Bot not connected. Cannot resolve invite code.');
            return null;
        }
        try {
            const info = await this.socket.groupGetInviteInfo(inviteCode);
            if (info?.id) {
                return { id: info.id, subject: info.subject || '' };
            }
            return null;
        }
        catch (err) {
            this.logger.error(`Failed to get group info for invite code ${inviteCode}:`, err);
            return null;
        }
    }
    formatJid(mobileNumber) {
        const cleanMobile = mobileNumber.replace(/\D/g, '');
        return `${cleanMobile.startsWith('91') ? cleanMobile : '91' + cleanMobile}@s.whatsapp.net`;
    }
    async sendDirectTextMessage(mobileNumber, text) {
        const metaToken = process.env.META_WA_TOKEN || process.env.WHATSAPP_CLOUD_API_TOKEN;
        const metaPhoneId = process.env.META_WA_PHONE_ID || process.env.WHATSAPP_CLOUD_PHONE_ID;
        if (metaToken && metaPhoneId) {
            try {
                const cleanMobile = mobileNumber.replace(/\D/g, '');
                const recipient = cleanMobile.startsWith('91') ? cleanMobile : '91' + cleanMobile;
                const response = await fetch(`https://graph.facebook.com/v20.0/${metaPhoneId}/messages`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${metaToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        to: recipient,
                        type: 'text',
                        text: { body: text },
                    }),
                });
                if (response.ok) {
                    this.logger.log(`🟢 Meta WhatsApp Cloud API text message sent to ${recipient}`);
                    return true;
                }
                else {
                    const errJson = await response.json().catch(() => ({}));
                    this.logger.warn('Meta WhatsApp Cloud API error response:', JSON.stringify(errJson));
                }
            }
            catch (metaErr) {
                this.logger.error('Meta WhatsApp Cloud API text message request failed:', metaErr);
            }
        }
        if (!this.socket || !this.isConnected) {
            this.logger.warn('WhatsApp Bot is not connected. Unable to send direct message.');
            return false;
        }
        try {
            const formattedJid = this.formatJid(mobileNumber);
            await this.socket.sendMessage(formattedJid, { text });
            this.logger.log(`WhatsApp text message sent successfully to ${mobileNumber}`);
            return true;
        }
        catch (err) {
            this.logger.error(`Failed to send WhatsApp text message to ${mobileNumber}:`, err);
            return false;
        }
    }
    async getGroupParticipants(groupJid) {
        if (!this.socket || !this.isConnected) {
            this.logger.warn('WhatsApp Bot not connected. Cannot fetch group participants.');
            return [];
        }
        try {
            const metadata = await this.socket.groupMetadata(groupJid);
            return metadata.participants.map((p) => p.id);
        }
        catch (err) {
            this.logger.error(`Failed to fetch group metadata for ${groupJid}:`, err);
            return [];
        }
    }
    async getAllGroups() {
        if (!this.socket || !this.isConnected) {
            this.logger.warn('WhatsApp Bot not connected. Cannot fetch groups.');
            return [];
        }
        try {
            const groups = await this.socket.groupFetchAllParticipating();
            return Object.values(groups).map((g) => ({
                jid: g.id,
                name: g.subject || 'Unnamed Group',
                memberCount: g.participants?.length ?? 0,
            }));
        }
        catch (err) {
            this.logger.error('Failed to fetch all groups:', err);
            return [];
        }
    }
    async addParticipantToGroup(groupJid, mobileNumber, farmerName) {
        if (!this.socket || !this.isConnected) {
            this.logger.warn('WhatsApp Bot not connected. Cannot add participant.');
            return { success: false, status: 'NOT_CONNECTED' };
        }
        try {
            const participantJid = this.formatJid(mobileNumber);
            const response = await this.socket.groupParticipantsUpdate(groupJid, [participantJid], 'add');
            const res = response[0];
            this.logger.log(`Group add participant ${participantJid} to ${groupJid} result: ${JSON.stringify(res)}`);
            if (res.status === '200') {
                const welcomeName = farmerName?.trim() || 'Farmer';
                const welcomeMessage = `🌾 Welcome *${welcomeName}* ji to the FarmsKing Advisor Group! 🙏✨`;
                await this.socket.sendMessage(groupJid, { text: welcomeMessage }).catch(() => { });
                await this.sendDirectTextMessage(mobileNumber, welcomeMessage).catch(() => { });
                return { success: true, status: 'ADDED' };
            }
            this.logger.warn(`Direct add for ${mobileNumber} returned status ${res.status}. Direct add skipped/failed.`);
            return { success: false, status: res.status };
        }
        catch (err) {
            this.logger.error(`Error adding participant ${mobileNumber} to group ${groupJid}:`, err);
            return { success: false, status: 'ERROR' };
        }
    }
    async removeParticipantFromGroup(groupJid, mobileNumber, farmerName) {
        if (!this.socket || !this.isConnected) {
            this.logger.warn('WhatsApp Bot not connected. Cannot remove participant.');
            return { success: false, status: 'NOT_CONNECTED' };
        }
        try {
            const participantJid = this.formatJid(mobileNumber);
            const response = await this.socket.groupParticipantsUpdate(groupJid, [participantJid], 'remove');
            const res = response[0];
            this.logger.log(`Group remove participant ${participantJid} from ${groupJid} result: ${JSON.stringify(res)}`);
            if (res.status === '200') {
                const nameLabel = farmerName?.trim() || '';
                const notification = `🌾 *FarmsKing Notice*\n\nਧੰਨਵਾਦ ${nameLabel ? '*' + nameLabel + '*' : ''} ਜੀ!\nਤੁਹਾਡਾ FarmsKing Advisor Plan ਸਮਾਪਤ ਹੋ ਗਿਆ ਹੈ। ਦੁਬਾਰਾ ਗਰੁੱਪ ਮੈਂਬਰ ਬਣਨ ਲਈ ਨਵਾਂ ਪਲਾਨ ਖਰੀਦੋ।\n\nThank you! Your FarmsKing Advisor Plan has expired. Please purchase a plan to rejoin the group.`;
                await this.sendDirectTextMessage(mobileNumber, notification).catch(() => { });
                return { success: true, status: 'REMOVED' };
            }
            return { success: false, status: res.status };
        }
        catch (err) {
            this.logger.error(`Error removing participant ${mobileNumber} from group ${groupJid}:`, err);
            return { success: false, status: 'ERROR' };
        }
    }
};
exports.WhatsappBotService = WhatsappBotService;
exports.WhatsappBotService = WhatsappBotService = WhatsappBotService_1 = __decorate([
    (0, common_1.Injectable)()
], WhatsappBotService);
//# sourceMappingURL=whatsapp.service.js.map