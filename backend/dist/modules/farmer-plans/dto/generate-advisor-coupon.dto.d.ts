import { FarmerSubscriptionPlan } from '@prisma/client';
export declare class GenerateAdvisorCouponDto {
    plan: FarmerSubscriptionPlan;
    daysGranted: number;
    assignedFarmerId?: string;
    assignedBusinessPartnerId?: string;
    quantity?: number;
}
