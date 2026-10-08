import { FarmerSubscriptionPlan, PlanCouponCategory } from '@prisma/client';
export declare class GenerateAdvisorCouponDto {
    category?: PlanCouponCategory;
    plan: FarmerSubscriptionPlan;
    daysGranted: number;
    doctorFeeAmount?: number;
    includeMembership?: boolean;
    includedMembershipPlan?: FarmerSubscriptionPlan;
    includedMembershipDays?: number;
    assignedFarmerId?: string;
    assignedBusinessPartnerId?: string;
    targetType?: 'SELF' | 'ADVISOR';
    advisorKingId?: string;
    quantity?: number;
}
