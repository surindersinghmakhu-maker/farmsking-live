import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashfreeVendorDto, CreateSplitOrderDto } from './dto/cashfree.dto';
export declare class CashfreeService {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    private readonly appId;
    private readonly secretKey;
    private readonly baseUrl;
    constructor(configService: ConfigService, prisma: PrismaService);
    private getHeaders;
    createVendorOnCashfree(dto: CreateCashfreeVendorDto): Promise<any>;
    createSplitOrder(dto: CreateSplitOrderDto): Promise<{
        orderId: any;
        paymentSessionId: any;
        orderStatus: any;
    }>;
    createStandardOrder(dto: {
        orderId: string;
        amount: number;
        customerId: string;
        customerPhone: string;
        customerName?: string;
    }): Promise<{
        orderId: any;
        paymentSessionId: any;
        orderStatus: any;
    }>;
    verifyPayment(orderId: string): Promise<any>;
    handlePaymentSuccess(orderId: string, cashfreeData: any): Promise<void>;
    handleWebhook(body: any): Promise<{
        status: string;
    }>;
    handleWalletTopupSuccess(orderId: string, cashfreeData: any): Promise<void>;
    handleDoctorConsultationSuccess(orderId: string): Promise<void>;
    handlePlanPaymentSuccess(orderId: string): Promise<void>;
    handleGardenerPlanPaymentSuccess(orderId: string): Promise<void>;
}
