import { FarmerSubscriptionPlan } from '@prisma/client';
export declare class GrantFarmerPlanDaysDto {
    farmerId: string;
    daysGranted: number;
    plan?: FarmerSubscriptionPlan;
    advisorId?: string;
}
