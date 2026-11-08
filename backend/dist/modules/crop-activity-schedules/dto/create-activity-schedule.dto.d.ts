import { ActivityType } from '@prisma/client';
export declare class CreateActivityScheduleDto {
    cropCycleId: string;
    activityType: ActivityType;
    title: string;
    description?: string;
    scheduledDate: string;
    notes?: string;
}
