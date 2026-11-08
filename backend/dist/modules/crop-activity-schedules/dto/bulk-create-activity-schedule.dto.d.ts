import { ActivityType } from '@prisma/client';
declare class ActivityScheduleItemDto {
    activityType: ActivityType;
    title: string;
    description?: string;
    scheduledDate: string;
    notes?: string;
}
export declare class BulkCreateActivityScheduleDto {
    cropCycleId: string;
    items: ActivityScheduleItemDto[];
}
export {};
