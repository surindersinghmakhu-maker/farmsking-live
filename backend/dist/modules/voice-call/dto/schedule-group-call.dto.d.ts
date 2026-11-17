export declare class ScheduleGroupCallDto {
    title: string;
    scheduledAt: string;
    targetAudienceType?: string;
    targetPlanType?: string;
    targetCropName?: string;
    invitedFarmerIds?: string[];
    alertMessage?: string;
}
export declare class SendGroupAlertDto {
    message?: string;
}
