import { GardenerSubscriptionPlan } from '@prisma/client';
export declare class CreateGardenerPlanCouponDto {
    daysGranted: number;
    plan: GardenerSubscriptionPlan;
    assignedGardenerId?: string;
    expiresAt?: string;
}
