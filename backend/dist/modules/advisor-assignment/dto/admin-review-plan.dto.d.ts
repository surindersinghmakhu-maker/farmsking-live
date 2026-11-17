export declare class AdminApprovePlanDto {
    price?: number;
    callRequestLimit?: number;
    inAppCallLimit?: number;
    videoCallAllowed?: boolean;
    videoCallLimit?: number;
    chatEnabled?: boolean;
    adminNotes?: string;
}
export declare class AdminRejectPlanDto {
    reason?: string;
}
