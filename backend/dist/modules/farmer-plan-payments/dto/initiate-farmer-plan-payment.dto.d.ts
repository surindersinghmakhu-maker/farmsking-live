import { FarmerSubscriptionPlan } from '@prisma/client';
export declare class InitiateFarmerPlanPaymentDto {
    targetPlan: FarmerSubscriptionPlan;
    billingPeriodDays?: number;
    selectedDoctorId?: string;
    selectedAdvisorId?: string;
    doctorKingId?: string;
    advisorKingId?: string;
}
