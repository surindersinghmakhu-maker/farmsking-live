import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
} from '@whiskeysockets/baileys';
import * as QRCode from 'qrcode';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class WhatsappBotService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappBotService.name);
  private socket: WASocket | null = null;
  private qrCodeDataUrl: string | null = null;
  private isConnected = false;

  async onModuleInit() {
    this.initWhatsAppSocket();
  }

  private async initWhatsAppSocket() {
    try {
      if (this.socket) {
        try {
          this.socket.ev.removeAllListeners('creds.update');
          this.socket.ev.removeAllListeners('connection.update');
          this.socket.end(undefined);
        } catch {}
        this.socket = null;
      }

      const authFolder = path.join(process.cwd(), 'whatsapp_auth_session');
      const { state, saveCreds } = await useMultiFileAuthState(authFolder);

      this.socket = makeWASocket({
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
          const shouldReconnect =
            (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
          this.isConnected = false;
          this.logger.warn(`WhatsApp connection closed. Reconnecting: ${shouldReconnect}`);
          if (shouldReconnect) {
            setTimeout(() => this.initWhatsAppSocket(), 5000);
          } else {
            this.qrCodeDataUrl = null;
          }
        } else if (connection === 'open') {
          this.isConnected = true;
          this.qrCodeDataUrl = null;
          this.logger.log('🟢 WhatsApp Business connected successfully & linked!');
        }
      });
    } catch (err) {
      this.logger.error('Error initializing WhatsApp socket:', err);
    }
  }

  getQrCodeStatus(): { isConnected: boolean; qrCodeDataUrl: string | null } {
    return {
      isConnected: this.isConnected,
      qrCodeDataUrl: this.qrCodeDataUrl,
    };
  }

  async unlinkSession(): Promise<boolean> {
    try {
      if (this.socket) {
        await this.socket.logout().catch(() => {});
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
    } catch (err) {
      this.logger.error('Error unlinking WhatsApp session:', err);
      return false;
    }
  }

  async sendOtpMessage(mobileNumber: string, otpCode: string): Promise<boolean> {
    const metaToken = process.env.META_WA_TOKEN || process.env.WHATSAPP_CLOUD_API_TOKEN;
    const metaPhoneId = process.env.META_WA_PHONE_ID || process.env.WHATSAPP_CLOUD_PHONE_ID;

    // 1. Primary: Official Meta WhatsApp Cloud API (If configured in .env)
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
        } else {
          const errJson = await response.json().catch(() => ({}));
          this.logger.warn('Meta WhatsApp Cloud API error response:', JSON.stringify(errJson));
        }
      } catch (metaErr) {
        this.logger.error('Meta WhatsApp Cloud API request failed:', metaErr);
      }
    }

    // 2. Secondary: Baileys WhatsApp Web Socket Connection
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
    } catch (err) {
      this.logger.error(`Failed to send WhatsApp message to ${mobileNumber}:`, err);
      return false;
    }
  }

  /**
   * Resolve a WhatsApp group invite code (from invite link) to group JID
   * Code is the part after https://chat.whatsapp.com/
   */
  async getGroupInfoFromInviteCode(inviteCode: string): Promise<{ id: string; subject: string } | null> {
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
    } catch (err) {
      this.logger.error(`Failed to get group info for invite code ${inviteCode}:`, err);
      return null;
    }
  }

  /**
   * Helper to format mobile number into standard Baileys JID (e.g. 919876543210@s.whatsapp.net)
   */
  formatJid(mobileNumber: string): string {
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    return `${cleanMobile.startsWith('91') ? cleanMobile : '91' + cleanMobile}@s.whatsapp.net`;
  }

  /**
   * Send arbitrary text message to a user on WhatsApp
   */
  async sendDirectTextMessage(mobileNumber: string, text: string): Promise<boolean> {
    if (!this.socket || !this.isConnected) {
      this.logger.warn('WhatsApp Bot is not connected. Unable to send direct message.');
      return false;
    }

    try {
      const formattedJid = this.formatJid(mobileNumber);
      await this.socket.sendMessage(formattedJid, { text });
      this.logger.log(`WhatsApp text message sent successfully to ${mobileNumber}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send WhatsApp text message to ${mobileNumber}:`, err);
      return false;
    }
  }

  /**
   * Fetch member JIDs currently present in a WhatsApp group
   */
  async getGroupParticipants(groupJid: string): Promise<string[]> {
    if (!this.socket || !this.isConnected) {
      this.logger.warn('WhatsApp Bot not connected. Cannot fetch group participants.');
      return [];
    }

    try {
      const metadata = await this.socket.groupMetadata(groupJid);
      return metadata.participants.map((p) => p.id);
    } catch (err) {
      this.logger.error(`Failed to fetch group metadata for ${groupJid}:`, err);
      return [];
    }
  }

  /**
   * Fetch all WhatsApp groups the bot is currently a member of
   */
  async getAllGroups(): Promise<{ jid: string; name: string; memberCount: number }[]> {
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
    } catch (err) {
      this.logger.error('Failed to fetch all groups:', err);
      return [];
    }
  }

  /**
   * Add a participant directly to a WhatsApp group via Baileys API
   */
  async addParticipantToGroup(
    groupJid: string,
    mobileNumber: string,
    farmerName?: string,
  ): Promise<{ success: boolean; status?: string }> {
    if (!this.socket || !this.isConnected) {
      this.logger.warn('WhatsApp Bot not connected. Cannot add participant.');
      return { success: false, status: 'NOT_CONNECTED' };
    }

    try {
      const participantJid = this.formatJid(mobileNumber);
      const response = await this.socket.groupParticipantsUpdate(
        groupJid,
        [participantJid],
        'add',
      );

      const res = response[0];
      this.logger.log(
        `Group add participant ${participantJid} to ${groupJid} result: ${JSON.stringify(res)}`,
      );

      if (res.status === '200') {
        // Welcome message sent to the group or farmer on direct add
        const welcomeName = farmerName?.trim() || 'Farmer';
        const welcomeMessage = `🌾 Welcome *${welcomeName}* ji to the FarmsKing Advisor Group! 🙏✨`;
        
        // Send welcome message to group mentioning farmer
        await this.socket.sendMessage(groupJid, { text: welcomeMessage }).catch(() => {});
        // Also send direct welcome message
        await this.sendDirectTextMessage(mobileNumber, welcomeMessage).catch(() => {});

        return { success: true, status: 'ADDED' };
      }

      this.logger.warn(
        `Direct add for ${mobileNumber} returned status ${res.status}. Direct add skipped/failed.`,
      );
      return { success: false, status: res.status };
    } catch (err) {
      this.logger.error(`Error adding participant ${mobileNumber} to group ${groupJid}:`, err);
      return { success: false, status: 'ERROR' };
    }
  }

  /**
   * Remove a participant from a WhatsApp group via Baileys API
   */
  async removeParticipantFromGroup(
    groupJid: string,
    mobileNumber: string,
    farmerName?: string,
  ): Promise<{ success: boolean; status?: string }> {
    if (!this.socket || !this.isConnected) {
      this.logger.warn('WhatsApp Bot not connected. Cannot remove participant.');
      return { success: false, status: 'NOT_CONNECTED' };
    }

    try {
      const participantJid = this.formatJid(mobileNumber);
      const response = await this.socket.groupParticipantsUpdate(
        groupJid,
        [participantJid],
        'remove',
      );

      const res = response[0];
      this.logger.log(
        `Group remove participant ${participantJid} from ${groupJid} result: ${JSON.stringify(res)}`,
      );

      if (res.status === '200') {
        const nameLabel = farmerName?.trim() || '';
        // Thank you and plan purchase prompt sent to farmer upon removal
        const notification = `🌾 *FarmsKing Notice*\n\nਧੰਨਵਾਦ ${nameLabel ? '*' + nameLabel + '*' : ''} ਜੀ!\nਤੁਹਾਡਾ FarmsKing Advisor Plan ਸਮਾਪਤ ਹੋ ਗਿਆ ਹੈ। ਦੁਬਾਰਾ ਗਰੁੱਪ ਮੈਂਬਰ ਬਣਨ ਲਈ ਨਵਾਂ ਪਲਾਨ ਖਰੀਦੋ।\n\nThank you! Your FarmsKing Advisor Plan has expired. Please purchase a plan to rejoin the group.`;
        await this.sendDirectTextMessage(mobileNumber, notification).catch(() => {});
        return { success: true, status: 'REMOVED' };
      }

      return { success: false, status: res.status };
    } catch (err) {
      this.logger.error(`Error removing participant ${mobileNumber} from group ${groupJid}:`, err);
      return { success: false, status: 'ERROR' };
    }
  }
}


