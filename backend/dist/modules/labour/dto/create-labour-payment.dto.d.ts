import { PaymentMode } from '@prisma/client';
export declare class CreateLabourPaymentDto {
    workerId: string;
    paymentDate: string;
    amount: number;
    paymentMode?: PaymentMode;
    notes?: string;
}
