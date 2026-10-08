export declare class RespondDemandRequestDto {
    response: 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED';
    acceptedQty?: number;
    counterNote?: string;
    rejectionReason?: string;
}
