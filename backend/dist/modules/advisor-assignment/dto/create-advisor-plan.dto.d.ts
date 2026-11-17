import { HiringModelType } from '@prisma/client';
export declare class CreateAdvisorPlanDto {
    name: string;
    description?: string;
    hiringModel: HiringModelType;
    price: number;
    billingCycle?: string;
    callRequestLimit?: number;
    inAppCallLimit?: number;
    videoCallAllowed?: boolean;
    videoCallLimit?: number;
    chatEnabled?: boolean;
}
