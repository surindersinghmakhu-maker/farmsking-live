export declare class CreateCashfreeVendorDto {
    vendorId: string;
    name: string;
    email: string;
    phone: string;
    bankAccountNo?: string;
    bankIfsc?: string;
    bankAccountHolderName?: string;
    upiId?: string;
    gstin?: string;
}
export declare class CreateSplitOrderDto {
    orderId: string;
    amount: number;
    customerId: string;
    customerPhone: string;
    customerName?: string;
    splits: {
        sellerStoreId: string;
        cashfreeVendorId: string;
        itemSubtotal: number;
        commissionRate: number;
    }[];
}
