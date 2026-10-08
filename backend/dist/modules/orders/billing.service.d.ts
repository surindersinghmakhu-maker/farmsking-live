import { PrismaService } from '../prisma/prisma.service';
export declare enum InvoiceTypeEnum {
    CUSTOMER_INVOICE = "CUSTOMER_INVOICE",
    COMMISSION_INVOICE = "COMMISSION_INVOICE",
    PAYOUT_STATEMENT = "PAYOUT_STATEMENT",
    CREDIT_NOTE = "CREDIT_NOTE"
}
export interface GstCalculationResult {
    isSellerGstRegistered: boolean;
    grossAmount: number;
    netTaxableAmount: number;
    productGstRate: number;
    productGstAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    tcsRate: number;
    tcsAmount: number;
    commissionRate: number;
    commissionAmount: number;
    commissionGstRate: number;
    commissionGstAmount: number;
    totalDeductions: number;
    netSellerPayout: number;
}
export declare class BillingService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getFinancialYear(date?: Date): string;
    generateNextInvoiceNumber(type: InvoiceTypeEnum, sellerStoreId?: string): Promise<{
        invoiceNumber: string;
        financialYear: string;
    }>;
    calculateGstAndTcs(params: {
        grossPrice: number;
        isPriceInclusiveOfGst?: boolean;
        productGstPercentage?: number;
        sellerGstin?: string | null;
        sellerCommissionRate?: number;
        isInterState?: boolean;
    }): GstCalculationResult;
    createInvoicesForOrder(orderId: string): Promise<any>;
    renderInvoiceHtml(invoice: any): string;
}
