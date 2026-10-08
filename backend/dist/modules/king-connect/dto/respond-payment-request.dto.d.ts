export declare class RespondPaymentRequestDto {
    response: 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'POSTPONED' | 'REJECTED';
    acceptedAmount?: number;
    postponedDate?: string;
    rejectionReason?: string;
    notes?: string;
}
