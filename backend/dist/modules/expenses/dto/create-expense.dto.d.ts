import { PaymentMode } from '@prisma/client';
export declare class CreateExpenseDto {
    farmId: string;
    plotId?: string;
    cropCycleId?: string;
    categoryId: string;
    amount: number;
    expenseDate: string;
    paymentMode?: PaymentMode;
    partyId?: string;
    vendorName?: string;
    description?: string;
    quantity?: number;
    unit?: string;
    receiptPhotoUrl?: string;
    notes?: string;
}
