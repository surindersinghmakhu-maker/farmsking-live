import { FarmerSubscriptionPlan, PlanCouponCategory } from '@prisma/client';
export declare class CreateFarmerPlanCouponDto {
    plan: FarmerSubscriptionPlan;
    category?: PlanCouponCategory;
    daysGranted: number;
    quantity?: number;
    assignedFarmerId?: string;
    assignedAdvisorId?: string;
    assignedBusinessPartnerId?: string;
    expiresAt?: string;
}
