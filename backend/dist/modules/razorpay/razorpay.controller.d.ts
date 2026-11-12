import type { Request } from 'express';
import type { AuthUser } from '../../common/types/auth-user.type';
import { RazorpayService } from './razorpay.service';
import { CreateRazorpayOrderDto, CreateRazorpaySubscriptionDto, VerifyRazorpayPaymentDto } from './dto/razorpay.dto';
export declare class RazorpayController {
    private readonly razorpayService;
    constructor(razorpayService: RazorpayService);
    createOrder(user: AuthUser, dto: CreateRazorpayOrderDto): Promise<{
        orderId: string;
        razorpayOrderId: any;
        amount: number;
        currency: string;
        keyId: string;
    }>;
    createSubscription(user: AuthUser, dto: CreateRazorpaySubscriptionDto): Promise<{
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
    handleWebhook(req: Request, body: any, signature?: string): Promise<{
        status: string;
        event: any;
    }>;
}
