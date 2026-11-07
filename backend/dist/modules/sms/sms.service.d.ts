import { AppSettingsService } from '../app-settings/app-settings.service';
export interface SmsSendResult {
    success: boolean;
    provider: string;
    messageId?: string;
    error?: string;
}
export declare class SmsService {
    private readonly appSettingsService;
    private readonly logger;
    constructor(appSettingsService: AppSettingsService);
    format10DigitMobile(mobile: string): string;
    sendOrderPlacedSms(mobile: string, customerName: string, orderNumber: string, totalAmount: number): Promise<SmsSendResult>;
    sendTextMessage(mobile: string, text: string, templateKey?: string): Promise<SmsSendResult>;
}
