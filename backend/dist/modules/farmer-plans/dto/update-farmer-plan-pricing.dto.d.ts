import { DiscountValueType } from '@prisma/client';
export declare class UpdateFarmerPlanPricingDto {
    price?: number;
    billingPeriodDays?: number;
    partnerShareType?: DiscountValueType;
    partnerShareValue?: number;
    advisorShareValue?: number;
    adminShareValue?: number;
    partnerGenerationCostPercent?: number;
    advisorGenerationCostPercent?: number;
    maxTotalCrops?: number;
    maxActiveCrops?: number;
    advisorIncluded?: boolean;
    chatEnabled?: boolean;
    weatherEnabled?: boolean;
    isActive?: boolean;
    gardenAdvisorIncluded?: boolean;
}
