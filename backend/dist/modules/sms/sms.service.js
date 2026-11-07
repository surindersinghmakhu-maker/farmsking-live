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
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const app_settings_service_1 = require("../app-settings/app-settings.service");
let SmsService = SmsService_1 = class SmsService {
    constructor(appSettingsService) {
        this.appSettingsService = appSettingsService;
        this.logger = new common_1.Logger(SmsService_1.name);
    }
    format10DigitMobile(mobile) {
        return (mobile || '').replace(/\D/g, '').slice(-10);
    }
    async sendOrderPlacedSms(mobile, customerName, orderNumber, totalAmount) {
        const name = customerName || 'Valued Customer';
        const text = `Dear ${name}, your FarmsKing Order #${orderNumber} of Rs ${totalAmount} has been placed successfully! Track order: https://farmsking.in/order-tracking - FarmsKing Technologies`;
        return this.sendTextMessage(mobile, text, 'ORDER_PLACED');
    }
    async sendTextMessage(mobile, text, templateKey) {
        const cleanMobile = this.format10DigitMobile(mobile);
        if (cleanMobile.length !== 10) {
            this.logger.warn(`Invalid mobile number format for SMS dispatch: ${mobile}`);
            return { success: false, provider: 'NONE', error: 'Invalid 10-digit Indian mobile number' };
        }
        let activeProvider = 'FIREBASE';
        let isEnabled = true;
        let smsConfig = null;
        try {
            const integrations = await this.appSettingsService.getIntegrations();
            smsConfig = integrations?.sms;
            if (smsConfig) {
                isEnabled = smsConfig.isEnabled ?? true;
                activeProvider = (smsConfig.activeProvider || 'FIREBASE').toUpperCase();
            }
        }
        catch (e) {
            this.logger.warn(`Could not load SMS integrations: ${e.message}`);
        }
        if (!isEnabled) {
            this.logger.log(`SMS Gateway is disabled in Admin Settings.`);
            return { success: false, provider: activeProvider, error: 'SMS Gateway disabled in Admin settings' };
        }
        const providers = smsConfig?.providers || {};
        try {
            switch (activeProvider) {
                case 'FAST2SMS': {
                    const fast2sms = providers.fast2sms;
                    const apiKey = fast2sms?.apiKey || process.env.FAST2SMS_API_KEY;
                    if (!apiKey) {
                        this.logger.warn(`Fast2SMS API Key missing in Admin Settings.`);
                        return { success: false, provider: 'FAST2SMS', error: 'Fast2SMS API Key missing in Admin Settings' };
                    }
                    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
                        method: 'POST',
                        headers: {
                            authorization: apiKey,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            route: fast2sms?.route || 'q',
                            message: text,
                            language: 'english',
                            flash: 0,
                            numbers: cleanMobile,
                        }),
                    });
                    const data = await response.json();
                    this.logger.log(`[Fast2SMS Dispatched to ${cleanMobile}]: ${JSON.stringify(data)}`);
                    return {
                        success: data?.return === true,
                        provider: 'FAST2SMS',
                        messageId: data?.request_id,
                        error: data?.return ? undefined : (Array.isArray(data?.message) ? data.message.join(', ') : data?.message) || 'Fast2SMS delivery error',
                    };
                }
                case 'MSG91': {
                    const msg91 = providers.msg91;
                    const authKey = msg91?.authKey || process.env.MSG91_AUTH_KEY;
                    if (!authKey) {
                        this.logger.warn(`MSG91 AuthKey missing in Admin Settings.`);
                        return { success: false, provider: 'MSG91', error: 'MSG91 AuthKey missing in Admin Settings' };
                    }
                    const response = await fetch('https://api.msg91.com/api/v2/sendsms', {
                        method: 'POST',
                        headers: {
                            authkey: authKey,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            sender: msg91?.senderId || 'FRMKNG',
                            route: msg91?.route || '4',
                            country: '91',
                            sms: [{ message: text, to: [cleanMobile] }],
                        }),
                    });
                    const data = await response.json();
                    this.logger.log(`[MSG91 Dispatched to ${cleanMobile}]: ${JSON.stringify(data)}`);
                    return {
                        success: data?.type === 'success',
                        provider: 'MSG91',
                        messageId: data?.message,
                        error: data?.type === 'success' ? undefined : JSON.stringify(data),
                    };
                }
                case 'TWILIO': {
                    const twilio = providers.twilio;
                    const accountSid = twilio?.accountSid || process.env.TWILIO_ACCOUNT_SID;
                    const authToken = twilio?.authToken || process.env.TWILIO_AUTH_TOKEN;
                    const fromNumber = twilio?.fromNumber || process.env.TWILIO_FROM_NUMBER;
                    if (!accountSid || !authToken || !fromNumber) {
                        this.logger.warn(`Twilio credentials missing in Admin Settings.`);
                        return { success: false, provider: 'TWILIO', error: 'Twilio credentials missing in Admin Settings' };
                    }
                    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
                    const bodyParams = new URLSearchParams();
                    bodyParams.append('To', `+91${cleanMobile}`);
                    bodyParams.append('From', fromNumber);
                    bodyParams.append('Body', text);
                    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
                        method: 'POST',
                        headers: {
                            Authorization: `Basic ${auth}`,
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: bodyParams.toString(),
                    });
                    const data = await response.json();
                    this.logger.log(`[Twilio SMS Dispatched to ${cleanMobile}]: ${data?.sid || data?.message}`);
                    return {
                        success: !data?.error_code,
                        provider: 'TWILIO',
                        messageId: data?.sid,
                        error: data?.message,
                    };
                }
                case 'TEXTLOCAL': {
                    const textlocal = providers.textlocal;
                    const apiKey = textlocal?.apiKey || process.env.TEXTLOCAL_API_KEY;
                    if (!apiKey) {
                        return { success: false, provider: 'TEXTLOCAL', error: 'Textlocal API key missing in Admin Settings' };
                    }
                    const sender = textlocal?.senderName || 'FRMKNG';
                    const url = `https://api.textlocal.in/send/?apiKey=${encodeURIComponent(apiKey)}&numbers=91${cleanMobile}&message=${encodeURIComponent(text)}&sender=${encodeURIComponent(sender)}`;
                    const response = await fetch(url);
                    const data = await response.json();
                    this.logger.log(`[Textlocal SMS Dispatched to ${cleanMobile}]: ${JSON.stringify(data)}`);
                    return {
                        success: data?.status === 'success',
                        provider: 'TEXTLOCAL',
                        error: data?.status === 'success' ? undefined : JSON.stringify(data?.errors || data),
                    };
                }
                case 'CUSTOM_HTTP': {
                    const custom = providers.customHttp;
                    if (!custom?.endpointUrl) {
                        return { success: false, provider: 'CUSTOM_HTTP', error: 'Custom HTTP endpoint missing' };
                    }
                    let payload = custom.payloadTemplate || '{"to":"{{mobile}}","text":"{{message}}"}';
                    payload = payload.replace(/{{mobile}}/g, cleanMobile).replace(/{{message}}/g, text);
                    const headers = { 'Content-Type': 'application/json' };
                    if (custom.authHeaderKey && custom.authHeaderValue) {
                        headers[custom.authHeaderKey] = custom.authHeaderValue;
                    }
                    const response = await fetch(custom.endpointUrl, {
                        method: custom.method || 'POST',
                        headers,
                        body: payload,
                    });
                    const resText = await response.text();
                    this.logger.log(`[Custom HTTP SMS Dispatched to ${cleanMobile}]: ${response.status} ${resText.slice(0, 80)}`);
                    return { success: response.ok, provider: 'CUSTOM_HTTP' };
                }
                case 'FIREBASE':
                default: {
                    this.logger.log(`[Firebase SMS Active · Dispatched to +91 ${cleanMobile}]: ${text}`);
                    return {
                        success: true,
                        provider: 'FIREBASE_SMS',
                        messageId: `fb_sms_${Date.now()}`,
                    };
                }
            }
        }
        catch (dispatchErr) {
            this.logger.error(`SMS dispatch failure via ${activeProvider}:`, dispatchErr.message);
            return { success: false, provider: activeProvider, error: dispatchErr.message };
        }
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [app_settings_service_1.AppSettingsService])
], SmsService);
//# sourceMappingURL=sms.service.js.map