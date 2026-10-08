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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = __importStar(require("nodemailer"));
let EmailService = EmailService_1 = class EmailService {
    constructor() {
        this.logger = new common_1.Logger(EmailService_1.name);
        this.transporter = null;
        this.initTransporter();
    }
    initTransporter() {
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
        }
        catch (err) {
            this.logger.error('Failed to initialize nodemailer transporter:', err.message);
        }
    }
    async sendEmailOtp(toEmail, otpCode) {
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
        }
        catch (error) {
            this.logger.error(`Error sending email OTP to ${toEmail}:`, error.message);
            return false;
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmailService);
//# sourceMappingURL=email.service.js.map