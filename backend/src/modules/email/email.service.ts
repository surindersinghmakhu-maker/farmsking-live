import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
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

  async sendEmailOtp(toEmail: string, otpCode: string): Promise<boolean> {
    if (!this.transporter) {
      this.initTransporter();
    }

    if (!this.transporter) {
      this.logger.warn('SMTP Transporter not configured.');
      return false;
    }

    const senderUser = process.env.SMTP_USER || 'farmskingindia@gmail.com';

    const mailOptions = {
      from: `"FarmsKing Official" <${senderUser}>`,
      to: toEmail.trim(),
      subject: `🔑 Your FarmsKing Account Verification OTP Code: ${otpCode}`,
      text: `Hello, Your FarmsKing verification OTP code is ${otpCode}. Valid for 10 minutes. Please do not share this OTP code with anyone. - FarmsKing India`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #064E3B; padding: 24px; border-radius: 12px; color: #ffffff; max-width: 480px; margin: auto;">
          <h2 style="color: #34D399; margin-bottom: 8px;">🌾 FarmsKing India</h2>
          <p style="font-size: 14px; color: #E5E7EB;">Hello,</p>
          <p style="font-size: 14px; color: #E5E7EB;">Your verification OTP code for logging into <b>FarmsKing</b> is:</p>
          <div style="background-color: #065F46; border: 2px dashed #34D399; padding: 14px; border-radius: 8px; text-align: center; margin: 16px 0;">
            <span style="font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #F59E0B;">${otpCode}</span>
          </div>
          <p style="font-size: 12px; color: #9CA3AF;">This OTP code is valid for 10 minutes. Please do not share this OTP code with anyone.</p>
          <hr style="border-color: #065F46; margin-top: 20px;" />
          <p style="font-size: 11px; color: #6EE7B7; text-align: center;">© 2026 FarmsKing India. All rights reserved.</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email OTP sent successfully to ${toEmail}. Message ID: ${info.messageId}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Error sending email OTP to ${toEmail}:`, error.message);
      return false;
    }
  }
}
