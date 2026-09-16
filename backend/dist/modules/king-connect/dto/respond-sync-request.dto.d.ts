export declare class RespondSyncRequestDto {
    response: 'ACCEPTED' | 'REJECTED' | 'COUNTER_PROPOSED';
    rejectionReason?: string;
    counterAmount?: number;
    counterNote?: string;
}
