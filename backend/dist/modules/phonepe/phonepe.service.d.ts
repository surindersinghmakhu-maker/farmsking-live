import { ConfigService } from '@nestjs/config';
interface CreatePaymentResult {
    orderId: string;
    state: string;
    redirectUrl: string;
}
interface OrderStatusResult {
    orderId: string;
    state: string;
    amount: number;
}
export declare class PhonePeService {
    private readonly configService;
    private readonly logger;
    private cachedToken;
    constructor(configService: ConfigService);
    private get isSandbox();
    private get authBaseUrl();
    private get apiBaseUrl();
    isConfigured(): boolean;
    private getAccessToken;
    createPayment(merchantOrderId: string, amountRupees: number, redirectUrl: string): Promise<CreatePaymentResult>;
    checkStatus(merchantOrderId: string): Promise<OrderStatusResult>;
    verifyWebhookAuth(authorizationHeader: string | undefined): boolean;
}
export {};
