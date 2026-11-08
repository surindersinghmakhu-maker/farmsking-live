export declare class CreateRazorpayOrderDto {
    orderId: string;
    amount: number;
    customerId?: string;
    customerPhone?: string;
    customerName?: string;
    notes?: Record<string, any>;
}
export declare class CreateRazorpaySubscriptionDto {
    planName: string;
    amount: number;
    intervalType?: 'monthly' | 'yearly';
    totalCount?: number;
    customerId?: string;
    customerPhone?: string;
    customerEmail?: string;
    customerName?: string;
    notes?: Record<string, any>;
}
export declare class VerifyRazorpayPaymentDto {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}
