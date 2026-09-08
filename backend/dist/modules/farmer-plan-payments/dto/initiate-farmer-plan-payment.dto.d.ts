import { FarmerSubscriptionPlan } from '@prisma/client';
export declare class InitiateFarmerPlanPaymentDto {
    targetPlan: FarmerSubscriptionPlan;
    billingPeriodDays?: number;
}
