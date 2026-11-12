export declare const ECOMMERCE_TCS_RATE_PERCENT = 0.5;
export declare const ECOMMERCE_TCS_RATE = 0.005;
export declare const COMMISSION_GST_RATE_PERCENT = 18;
export declare const TDS_RATES: {
    readonly SEC_194O_WITH_PAN: 0.1;
    readonly SEC_194O_NO_PAN_206AA: 5;
    readonly SEC_194H_WITH_PAN: 2;
    readonly SEC_194H_NO_PAN_206AA: 20;
    readonly SEC_194J_WITH_PAN: 10;
    readonly SEC_194J_NO_PAN_206AA: 20;
};
export declare const GSTIN_REGEX: RegExp;
export declare const PAN_REGEX: RegExp;
export declare const IFSC_REGEX: RegExp;
export declare const FSSAI_REGEX: RegExp;
export declare const AADHAAR_LAST4_REGEX: RegExp;
export declare const PLACEHOLDER_TAX_IDS: Set<string>;
export declare function isRealStatutoryId(val?: string | null): boolean;
export declare function isValidGstin(val?: string | null): boolean;
export declare function isValidPan(val?: string | null): boolean;
export declare function maskPan(val?: string | null): string | null;
export declare function detectInterStateSupply(sellerState?: string | null, buyerStateOrAddress?: string | null): boolean;
export declare function getCurrentFinancialYearAndQuarter(date?: Date): {
    financialYear: string;
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
};
export type TdsSectionType = '194O' | '194H' | '194J';
export declare function computeTdsDeduction(params: {
    grossAmount: number;
    section: TdsSectionType;
    panNumber?: string | null;
}): {
    grossAmount: number;
    tdsRate: number;
    tdsAmount: number;
    netAmount: number;
    effectiveSection: string;
    panAvailable: boolean;
};
export declare function computeMarketplaceSettlement(params: {
    grossAmount: number;
    gstPercentage: number;
    commissionPercent: number;
    isSellerGstRegistered: boolean;
    sellerPanNumber?: string | null;
    includeTds194O?: boolean;
}): {
    netTaxableAmount: number;
    productGstAmount: number;
    tcsRate: number;
    tcsAmount: number;
    commissionAmount: number;
    commissionGstAmount: number;
    tds194OAmount: number;
    netSellerPayout: number;
};
