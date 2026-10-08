export interface Gstr8Record {
    gstin: string;
    legalName: string;
    tradeName: string;
    month: number;
    year: number;
    totalGrossSales: number;
    totalSalesReturn: number;
    netTaxableValue: number;
    cgstTcsAmount: number;
    sgstTcsAmount: number;
    igstTcsAmount: number;
    totalTcsAmount: number;
}
export declare function convertGstr8ToCsv(records: Gstr8Record[]): string;
