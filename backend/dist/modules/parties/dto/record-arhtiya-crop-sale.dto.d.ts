import { MandiUnit } from '@prisma/client';
export declare class RecordArhtiyaCropSaleDto {
    partyId: string;
    cropName: string;
    cropCycleId?: string;
    inputUnit?: MandiUnit;
    inputQuantity: number;
    ratePerQuintal: number;
    transactionDate: string;
    commissionPercent?: number;
    otherCharges?: number;
    jFormNumber?: string;
    jFormDate?: string;
    jFormPhotoUrl?: string;
    notes?: string;
}
