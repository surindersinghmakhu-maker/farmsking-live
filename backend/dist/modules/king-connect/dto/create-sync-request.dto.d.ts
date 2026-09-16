import { PartyLedgerEntryType } from '@prisma/client';
export declare class CreateSyncRequestDto {
    receiverKingId: string;
    transactionType: PartyLedgerEntryType;
    amount: number;
    reason: string;
    refBillNo?: string;
    notes?: string;
}
