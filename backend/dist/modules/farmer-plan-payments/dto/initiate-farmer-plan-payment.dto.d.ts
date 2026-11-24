import { FarmerSubscriptionPlan } from '@prisma/client';
export declare class InitiateFarmerPlanPaymentDto {
    targetPlan: FarmerSubscriptionPlan;
    billingPeriodDays?: number;
    customAmount?: number;
    isAutoDebit?: boolean;
    preferredGateway?: 'CASHFREE' | 'RAZORPAY' | 'PHONEPE' | 'UPI_DIRECT';
    selectedDoctorId?: string;
    selectedAdvisorId?: string;
    doctorKingId?: string;
    advisorKingId?: string;
    cropCycleId?: string;
    useWalletPoints?: boolean;
    pointsToDeduct?: number;
}
