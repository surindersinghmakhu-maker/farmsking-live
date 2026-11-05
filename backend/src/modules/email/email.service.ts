import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { AppSettingsService } from '../app-settings/app-settings.service';

/**
 * Format mobile number as: First 2 digits + xxxxx + Last 3 digits (e.g., 98xxxxx210)
 */
export function formatMaskedMobile(rawMobile?: string | null): string {
  if (!rawMobile) return 'xx*****xxx';
  const clean = rawMobile.replace(/\D/g, '').slice(-10);
  if (clean.length === 10) {
    return `${clean.slice(0, 2)}xxxxx${clean.slice(-3)}`;
  }
  return clean.length >= 5 ? `${clean.slice(0, 2)}xxxxx${clean.slice(-2)}` : 'xxxxx';
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly appSettingsService: AppSettingsService) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER || 'farmskingindia@gmail.com';
    const pass = process.env.SMTP_PASS || '';

    if (!user || !pass) {
      this.logger.warn('SMTP credentials missing in environment.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
      this.logger.log(`Email Service initialized with host: ${host}, user: ${user}`);
    } catch (err: any) {
      this.logger.error('Failed to initialize nodemailer transporter:', err.message);
    }
  }

  private async getActiveTransporterAndSender() {
    try {
      const integrations = await this.appSettingsService.getIntegrations();
      const smtp = integrations?.projectMasterData?.smtp;
      if (smtp?.host && smtp?.username && smtp?.password) {
        this.transporter = nodemailer.createTransport({
          host: smtp.host,
          port: smtp.port || 465,
          secure: (smtp.port || 465) === 465,
          auth: {
            user: smtp.username,
            pass: smtp.password,
          },
        });
      }
    } catch {}

    if (!this.transporter) {
      this.initTransporter();
    }

    let senderUser = process.env.SMTP_USER || 'farmskingindia@gmail.com';
    let senderName = 'FarmsKing Official';
    try {
      const integrations = await this.appSettingsService.getIntegrations();
      if (integrations?.projectMasterData?.smtp?.fromEmail) {
        senderUser = integrations.projectMasterData.smtp.fromEmail;
      }
      if (integrations?.projectMasterData?.smtp?.fromName) {
        senderName = integrations.projectMasterData.smtp.fromName;
      }
    } catch {}

    return { transporter: this.transporter, senderUser, senderName };
  }

  async sendEmailOtp(toEmail: string, otpCode: string): Promise<boolean> {
    const { transporter, senderUser, senderName } = await this.getActiveTransporterAndSender();
    if (!transporter) {
      this.logger.warn('SMTP Transporter not configured.');
      return false;
    }

    const mailOptions = {
      from: `"${senderName}" <${senderUser}>`,
      to: toEmail.trim(),
      subject: `🔒 Your FarmsKing Account Verification OTP Code: ${otpCode}`,
      text: `Hello, Your FarmsKing verification OTP code is ${otpCode}. Valid for 10 minutes. Please do not share this OTP code with anyone. - FarmsKing India`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #064E3B; padding: 24px; border-radius: 12px; color: #ffffff; max-width: 480px; margin: auto;">
          <h2 style="color: #34D399; margin-bottom: 8px;">🌱 FarmsKing</h2>
          <p style="font-size: 14px; color: #E5E7EB;">Hello,</p>
          <p style="font-size: 14px; color: #E5E7EB;">Your verification OTP code for logging into <b>FarmsKing</b> is:</p>
          <div style="background-color: #065F46; border: 2px dashed #34D399; padding: 14px; border-radius: 8px; text-align: center; margin: 16px 0;">
            <span style="font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #F59E0B;">${otpCode}</span>
          </div>
          <p style="font-size: 12px; color: #9CA3AF;">This OTP code is valid for 10 minutes. Please do not share this OTP code with anyone.</p>
          <hr style="border-color: #065F46; margin-top: 20px;" />
          <p style="font-size: 11px; color: #6EE7B7; text-align: center;">FARMSKING TECHNOLOGIES PRIVATE LIMITED | CIN: U01100PB2026PTC063294</p>
        </div>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      this.logger.log(`Email OTP sent successfully to ${toEmail}. Message ID: ${info.messageId}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Error sending email OTP to ${toEmail}:`, error.message);
      return false;
    }
  }

  /**
   * Welcome Email for newly created FarmsKing account
   */
  async sendWelcomeEmail(toEmail: string, userName: string, roleName?: string, kingId?: string): Promise<boolean> {
    const { transporter, senderUser, senderName } = await this.getActiveTransporterAndSender();
    if (!transporter) return false;

    const mailOptions = {
      from: `"${senderName}" <${senderUser}>`,
      to: toEmail.trim(),
      subject: `🌱 Welcome to FarmsKing - India's Smart Farming Platform`,
      text: `Welcome to FarmsKing, ${userName}! Your account has been successfully created. Role: ${roleName || 'Customer'}. King ID: ${kingId || 'Active'}. Start exploring AgriStore, Live Mandi, and AI Diagnostics at https://farmsking.com`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #064E3B; padding: 28px; border-radius: 14px; color: #ffffff; max-width: 520px; margin: auto;">
          <h1 style="color: #34D399; margin-bottom: 4px; font-size: 22px;">🌱 Welcome to FarmsKing!</h1>
          <p style="font-size: 14px; color: #a7f3d0; margin-top: 0;">Smart Farming & Agricultural Intelligence</p>
          <hr style="border-color: #065F46; margin: 16px 0;" />
          <p style="font-size: 15px; color: #E5E7EB;">Dear <b>${userName}</b>,</p>
          <p style="font-size: 14px; color: #D1D5DB; line-height: 1.5;">
            Welcome to the FarmsKing family! Your account has been registered successfully.
          </p>
          <div style="background-color: #065F46; padding: 14px 18px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #34D399;">
            <p style="margin: 4px 0; font-size: 13.5px; color: #ffffff;"><b>King ID:</b> ${kingId || 'Assigned on Login'}</p>
            <p style="margin: 4px 0; font-size: 13.5px; color: #ffffff;"><b>Primary Role:</b> ${roleName || 'Customer'}</p>
            <p style="margin: 4px 0; font-size: 13.5px; color: #ffffff;"><b>Status:</b> Active & Verified</p>
          </div>
          <p style="font-size: 13px; color: #D1D5DB; line-height: 1.5;">
            You can now access certified agri inputs, live APMC mandi prices, satellite crop health maps, and 5-second AI crop doctor diagnostics.
          </p>
          <hr style="border-color: #065F46; margin-top: 24px;" />
          <p style="font-size: 11px; color: #9CA3AF; text-align: center; margin-bottom: 2px;">
            FARMSKING TECHNOLOGIES PRIVATE LIMITED | CIN: U01100PB2026PTC063294
          </p>
          <p style="font-size: 11px; color: #6EE7B7; text-align: center; margin-top: 2px;">
            Regd. Office: VPO Goindwal Sahib, Tehsil Khadur Sahib, Tarn Taran, Punjab - 143422
          </p>
        </div>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent to ${toEmail}. Message ID: ${info.messageId}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Error sending welcome email to ${toEmail}:`, err.message);
      return false;
    }
  }

  /**
   * Notification sent to email when it is attached to a mobile number:
   * Shows mobile formatted as First 2 digits + xxxxx + Last 3 digits (e.g., 98xxxxx210)
   */
  async sendEmailLinkedNotification(toEmail: string, userName: string, rawMobile: string): Promise<boolean> {
    const { transporter, senderUser, senderName } = await this.getActiveTransporterAndSender();
    if (!transporter) return false;

    const maskedMobile = formatMaskedMobile(rawMobile);

    const mailOptions = {
      from: `"${senderName}" <${senderUser}>`,
      to: toEmail.trim(),
      subject: `🔒 Security Alert: Email Successfully Linked to Mobile ${maskedMobile}`,
      text: `Hello ${userName}, Your email address (${toEmail}) has been successfully attached to FarmsKing account with Mobile Number: ${maskedMobile}. You can now sign in using this email or mobile OTP. If this was not you, please contact support@farmsking.com immediately.`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #064E3B; padding: 26px; border-radius: 12px; color: #ffffff; max-width: 500px; margin: auto;">
          <h2 style="color: #34D399; margin-bottom: 6px; font-size: 20px;">🔒 Security Alert: Email Attached</h2>
          <p style="font-size: 13px; color: #a7f3d0; margin-top: 0;">FarmsKing Account Security Notification</p>
          <hr style="border-color: #065F46; margin: 16px 0;" />
          <p style="font-size: 14.5px; color: #E5E7EB;">Hello <b>${userName}</b>,</p>
          <p style="font-size: 14px; color: #D1D5DB; line-height: 1.5;">
            Your email address (<b>${toEmail}</b>) has been successfully attached to your FarmsKing profile:
          </p>
          <div style="background-color: #065F46; padding: 14px 18px; border-radius: 8px; margin: 18px 0; border-left: 4px solid #34D399;">
            <p style="margin: 0; font-size: 14px; color: #ffffff;">
              📱 <b>Attached Mobile Number:</b> <span style="font-size: 16px; font-weight: 700; color: #F59E0B; letter-spacing: 1px;">${maskedMobile}</span>
            </p>
          </div>
          <p style="font-size: 13px; color: #D1D5DB; line-height: 1.5;">
            You can now sign in seamlessly to your account using Google Sign-In or your mobile number OTP.
          </p>
          <p style="font-size: 12.5px; color: #fbbf24; background: rgba(245, 158, 11, 0.1); padding: 10px; border-radius: 6px;">
            ⚠️ If you did not perform or authorize this action, please contact our support desk immediately at support@farmsking.com.
          </p>
          <hr style="border-color: #065F46; margin-top: 22px;" />
          <p style="font-size: 11px; color: #9CA3AF; text-align: center;">
            FARMSKING TECHNOLOGIES PRIVATE LIMITED | CIN: U01100PB2026PTC063294
          </p>
        </div>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      this.logger.log(`Email linked alert sent to ${toEmail}. Message ID: ${info.messageId}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Error sending email-linked alert to ${toEmail}:`, err.message);
      return false;
    }
  }

  /**
   * Notification sent to the PREVIOUS email when an email is disconnected or replaced
   */
  async sendEmailDisconnectedNotification(
    oldEmail: string,
    userName: string,
    rawMobile: string,
    newEmail?: string,
  ): Promise<boolean> {
    const { transporter, senderUser, senderName } = await this.getActiveTransporterAndSender();
    if (!transporter) return false;

    const maskedMobile = formatMaskedMobile(rawMobile);

    const mailOptions = {
      from: `"${senderName}" <${senderUser}>`,
      to: oldEmail.trim(),
      subject: `⚠️ Security Notice: Google / Email Disconnected from FarmsKing`,
      text: `Hello ${userName}, Your email address (${oldEmail}) has been disconnected from your FarmsKing account (Mobile: ${maskedMobile}). If you authorized this change, no action is needed. If you did not make this change, please contact support@farmsking.com immediately.`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #1e1b4b; padding: 26px; border-radius: 12px; color: #ffffff; max-width: 500px; margin: auto; border: 1px solid #4338ca;">
          <h2 style="color: #f87171; margin-bottom: 6px; font-size: 20px;">⚠️ Account Disconnected Notice</h2>
          <p style="font-size: 13px; color: #cbd5e1; margin-top: 0;">FarmsKing Account Security Alert</p>
          <hr style="border-color: #312e81; margin: 16px 0;" />
          <p style="font-size: 14.5px; color: #E5E7EB;">Hello <b>${userName}</b>,</p>
          <p style="font-size: 14px; color: #D1D5DB; line-height: 1.5;">
            This email is to notify you that your email address (<b>${oldEmail}</b>) has been <b>disconnected</b> from your FarmsKing account:
          </p>
          <div style="background-color: #312e81; padding: 14px 18px; border-radius: 8px; margin: 18px 0; border-left: 4px solid #f87171;">
            <p style="margin: 0; font-size: 14px; color: #ffffff;">
              📱 <b>Associated Mobile Number:</b> <span style="font-size: 16px; font-weight: 700; color: #fca5a5; letter-spacing: 1px;">${maskedMobile}</span>
            </p>
            ${newEmail ? `<p style="margin: 6px 0 0; font-size: 12.5px; color: #cbd5e1;">A new email address has been attached to this mobile account.</p>` : ''}
          </div>
          <p style="font-size: 13px; color: #D1D5DB; line-height: 1.5;">
            If you requested this disconnection, you may safely disregard this message.
          </p>
          <div style="font-size: 12.5px; color: #fecaca; background: rgba(239, 68, 68, 0.15); padding: 12px; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.3);">
            🚨 <b>Did not authorize this change?</b> Please contact our security helpline immediately at <b>support@farmsking.com</b> to protect your account.
          </div>
          <hr style="border-color: #312e81; margin-top: 22px;" />
          <p style="font-size: 11px; color: #9CA3AF; text-align: center;">
            FARMSKING TECHNOLOGIES PRIVATE LIMITED | CIN: U01100PB2026PTC063294
          </p>
        </div>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      this.logger.log(`Email disconnect notice sent to ${oldEmail}. Message ID: ${info.messageId}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Error sending disconnect notice to ${oldEmail}:`, err.message);
      return false;
    }
  }

  /**
   * Security notification sent when user updates their registered mobile number
   */
  async sendMobileUpdatedEmailNotification(
    toEmail: string,
    userName: string,
    oldMobile: string,
    newMobile: string,
  ): Promise<boolean> {
    const { transporter, senderUser, senderName } = await this.getActiveTransporterAndSender();
    if (!transporter) return false;

    const maskedOld = formatMaskedMobile(oldMobile);
    const maskedNew = formatMaskedMobile(newMobile);

    const mailOptions = {
      from: `"${senderName}" <${senderUser}>`,
      to: toEmail.trim(),
      subject: `🔒 Security Alert: FarmsKing Registered Mobile Number Updated`,
      text: `Hello ${userName}, Your registered mobile number for FarmsKing has been updated from ${maskedOld} to ${maskedNew}. If you authorized this change, no action is needed. If you did NOT make this change, please contact support@farmsking.com immediately.`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #064E3B; padding: 26px; border-radius: 12px; color: #ffffff; max-width: 500px; margin: auto;">
          <h2 style="color: #34D399; margin-bottom: 6px; font-size: 20px;">🔒 Security Alert: Mobile Number Updated</h2>
          <p style="font-size: 13px; color: #a7f3d0; margin-top: 0;">FarmsKing Account Security Notification</p>
          <hr style="border-color: #065F46; margin: 16px 0;" />
          <p style="font-size: 14.5px; color: #E5E7EB;">Hello <b>${userName}</b>,</p>
          <p style="font-size: 14px; color: #D1D5DB; line-height: 1.5;">
            This email confirms that the registered mobile number on your FarmsKing account has been successfully updated after OTP verification.
          </p>
          <div style="background-color: #065F46; padding: 14px 18px; border-radius: 8px; margin: 18px 0; border-left: 4px solid #34D399;">
            <p style="margin: 0 0 8px; font-size: 13.5px; color: #D1D5DB;">
              📱 <b>Previous Mobile:</b> <span style="font-weight: 700; color: #fca5a5;">${maskedOld}</span>
            </p>
            <p style="margin: 0; font-size: 13.5px; color: #ffffff;">
              ✅ <b>New Mobile Number:</b> <span style="font-size: 15px; font-weight: 700; color: #F59E0B; letter-spacing: 0.5px;">${maskedNew}</span>
            </p>
          </div>
          <p style="font-size: 13px; color: #D1D5DB; line-height: 1.5;">
            Your future OTP logins, delivery alerts, and account communications will now be sent to your new mobile number.
          </p>
          <div style="font-size: 12.5px; color: #fbbf24; background: rgba(245, 158, 11, 0.12); padding: 12px; border-radius: 6px; border: 1px solid rgba(245, 158, 11, 0.3);">
            ⚠️ <b>Did you not make this change?</b> Contact our support desk immediately at <b>support@farmsking.com</b> to lock your account and protect your data.
          </div>
          <hr style="border-color: #065F46; margin-top: 22px;" />
          <p style="font-size: 11px; color: #9CA3AF; text-align: center; margin-bottom: 2px;">
            FARMSKING TECHNOLOGIES PRIVATE LIMITED | CIN: U01100PB2026PTC063294
          </p>
          <p style="font-size: 11px; color: #6EE7B7; text-align: center; margin-top: 2px;">
            Regd. Office: VPO Goindwal Sahib, Tehsil Khadur Sahib, Tarn Taran, Punjab - 143422
          </p>
        </div>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      this.logger.log(`Mobile update alert email sent to ${toEmail}. Message ID: ${info.messageId}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Error sending mobile update alert to ${toEmail}:`, err.message);
      return false;
    }
  }

  /**
   * Order lifecycle notification email (Placed, Confirmed, Packed, Dispatched, Delivered, Cancelled)
   */
  async sendOrderLifecycleEmail(
    toEmail: string,
    userName: string,
    orderData: {
      orderNumber: string;
      statusTitle: string;
      statusDescription: string;
      totalAmount: number;
      itemCount?: number;
      trackingNumber?: string;
      courierName?: string;
    },
  ): Promise<boolean> {
    const { transporter, senderUser, senderName } = await this.getActiveTransporterAndSender();
    if (!transporter) return false;

    const mailOptions = {
      from: `"${senderName}" <${senderUser}>`,
      to: toEmail.trim(),
      subject: `📦 FarmsKing Order #${orderData.orderNumber}: ${orderData.statusTitle}`,
      text: `Hello ${userName}, Update for Order #${orderData.orderNumber}: ${orderData.statusTitle}. ${orderData.statusDescription} Total: ₹${orderData.totalAmount}. Track at https://farmsking.com/order-tracking - FARMSKING TECHNOLOGIES PRIVATE LIMITED`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #064E3B; padding: 26px; border-radius: 12px; color: #ffffff; max-width: 520px; margin: auto;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #065F46; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="color: #34D399; margin: 0; font-size: 20px;">🌱 FarmsKing AgriStore</h2>
            <span style="background: rgba(255, 255, 255, 0.15); padding: 4px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 700; color: #d1fae5;">Order Update</span>
          </div>

          <p style="font-size: 14.5px; color: #E5E7EB; margin-top: 0;">Hello <b>${userName}</b>,</p>
          <p style="font-size: 14px; color: #D1D5DB; line-height: 1.5;">
            There is a new update regarding your FarmsKing order:
          </p>

          <div style="background-color: #065F46; padding: 16px 18px; border-radius: 10px; margin: 16px 0; border-left: 4px solid #34D399;">
            <div style="font-size: 15px; font-weight: 700; color: #F59E0B; margin-bottom: 6px;">
              ${orderData.statusTitle}
            </div>
            <p style="margin: 0; font-size: 13.5px; color: #E5E7EB; line-height: 1.5;">
              ${orderData.statusDescription}
            </p>
            <hr style="border-color: rgba(255, 255, 255, 0.15); margin: 12px 0;" />
            <div style="font-size: 13px; color: #d1fae5;">
              <p style="margin: 3px 0;"><b>Order Number:</b> #${orderData.orderNumber}</p>
              ${orderData.totalAmount > 0 ? `<p style="margin: 3px 0;"><b>Total Amount:</b> ₹${orderData.totalAmount}</p>` : ''}
              ${orderData.courierName ? `<p style="margin: 3px 0;"><b>Courier Partner:</b> ${orderData.courierName}</p>` : ''}
              ${orderData.trackingNumber ? `<p style="margin: 3px 0;"><b>Tracking ID / AWB:</b> ${orderData.trackingNumber}</p>` : ''}
            </div>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <a href="https://farmsking.com/order-tracking" style="background-color: #10b981; color: #ffffff; text-decoration: none; padding: 10px 22px; border-radius: 8px; font-weight: 700; font-size: 13px; display: inline-block;">
              Track Order on FarmsKing →
            </a>
          </div>

          <p style="font-size: 12px; color: #9CA3AF; line-height: 1.5;">
            Need help? Contact our customer support helpline or email us at support@farmsking.com.
          </p>

          <hr style="border-color: #065F46; margin-top: 20px;" />
          <p style="font-size: 11px; color: #9CA3AF; text-align: center; margin-bottom: 2px;">
            FARMSKING TECHNOLOGIES PRIVATE LIMITED | CIN: U01100PB2026PTC063294
          </p>
          <p style="font-size: 11px; color: #6EE7B7; text-align: center; margin-top: 2px;">
            Regd. Office: VPO Goindwal Sahib, Tehsil Khadur Sahib, Tarn Taran, Punjab - 143422
          </p>
        </div>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      this.logger.log(`Order update email sent to ${toEmail} for #${orderData.orderNumber}. Message ID: ${info.messageId}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Error sending order update email to ${toEmail}:`, err.message);
      return false;
    }
  }
}
