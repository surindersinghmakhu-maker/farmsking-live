import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { CreateRazorpayOrderDto, CreateRazorpaySubscriptionDto, VerifyRazorpayPaymentDto } from './dto/razorpay.dto';
export declare class RazorpayService {
    private readonly configService;
    private readonly prisma;
    private readonly appSettingsService;
    private readonly logger;
    private keyId;
    private keySecret;
    private webhookSecret;
    constructor(configService: ConfigService, prisma: PrismaService, appSettingsService: AppSettingsService);
    private getCredentials;
    private getBasicAuthHeader;
    createStandardOrder(dto: CreateRazorpayOrderDto): Promise<{
        orderId: string;
        razorpayOrderId: any;
        amount: number;
        currency: string;
        keyId: string;
    }>;
    createSubscription(dto: CreateRazorpaySubscriptionDto): Promise<{
        subscriptionId: any;
        planId: any;
        shortUrl: any;
        status: any;
        amount: number;
        keyId: string;
    }>;
    verifyPayment(dto: VerifyRazorpayPaymentDto): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean;
    handleWebhook(rawBody: string, signatureHeader?: string): Promise<{
        status: string;
        event: any;
    }>;
    private handleFulfillment;
    handlePlanPaymentSuccess(orderId: string, paymentData?: any, isRecurring?: boolean): Promise<void>;
    handleGardenerPlanPaymentSuccess(orderId: string): Promise<void>;
}
