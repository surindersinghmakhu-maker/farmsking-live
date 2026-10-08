declare class SaleBillItemDto {
    id?: string;
    cropId?: string;
    cropName: string;
    unit: string;
    qty: number;
    rate: number;
    amount: number;
    createdAt?: string;
    timestamp?: string;
}
export declare class CreateSaleBillDto {
    billNo?: string;
    farmerName: string;
    partyId?: string;
    partyName: string;
    partyMobile?: string;
    partyAddress?: string;
    isCash?: boolean;
    amountReceivedMode?: string;
    items: SaleBillItemDto[];
    totalItems: number;
    totalAmount: number;
    amountReceived: number;
    thisSaleBalance: number;
    previousBalance: number;
    netReceivable: number;
    discountAmount?: number;
    deliveryCharge?: number;
    notes?: string;
    createdAt?: string;
}
export {};
