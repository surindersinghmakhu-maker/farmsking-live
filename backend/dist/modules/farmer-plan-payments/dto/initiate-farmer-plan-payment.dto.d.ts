import { FarmerSubscriptionPlan } from '@prisma/client';
export declare class InitiateFarmerPlanPaymentDto {
    targetPlan: FarmerSubscriptionPlan;
    billingPeriodDays?: number;
    isAutoDebit?: boolean;
    preferredGateway?: 'CASHFREE' | 'RAZORPAY' | 'PHONEPE' | 'UPI_DIRECT';
    selectedDoctorId?: string;
    selectedAdvisorId?: string;
    doctorKingId?: string;
    advisorKingId?: string;
}
