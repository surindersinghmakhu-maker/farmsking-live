import { AppSettingsService } from '../app-settings/app-settings.service';
export declare function formatMaskedMobile(rawMobile?: string | null): string;
export declare class EmailService {
    private readonly appSettingsService;
    private readonly logger;
    private transporter;
    constructor(appSettingsService: AppSettingsService);
    private initTransporter;
    private getActiveTransporterAndSender;
    sendEmailOtp(toEmail: string, otpCode: string): Promise<boolean>;
    sendWelcomeEmail(toEmail: string, userName: string, roleName?: string, kingId?: string): Promise<boolean>;
    sendEmailLinkedNotification(toEmail: string, userName: string, rawMobile: string): Promise<boolean>;
    sendEmailDisconnectedNotification(oldEmail: string, userName: string, rawMobile: string, newEmail?: string): Promise<boolean>;
    sendEmailVerificationLink(toEmail: string, userName: string, verifyUrl: string): Promise<boolean>;
    sendMobileUpdatedEmailNotification(toEmail: string, userName: string, oldMobile: string, newMobile: string): Promise<boolean>;
    sendOrderLifecycleEmail(toEmail: string, userName: string, orderData: {
        orderNumber: string;
        statusTitle: string;
        statusDescription: string;
        totalAmount: number;
        itemCount?: number;
        trackingNumber?: string;
        courierName?: string;
    }): Promise<boolean>;
    sendOrderPlacedConfirmationEmail(toEmail: string, recipientName: string, order: {
        orderNumber: string;
        totalAmount: number;
        paymentMode?: string;
        deliveryAddress?: string;
        items: Array<{
            productName: string;
            quantity: number;
            price: number;
        }>;
    }): Promise<boolean>;
    sendAdminOrderAlertEmail(adminEmail: string, order: {
        orderNumber: string;
        totalAmount: number;
        customerName: string;
        customerMobile: string;
        deliveryAddress?: string;
        itemCount: number;
        paymentMode?: string;
    }): Promise<boolean>;
}
