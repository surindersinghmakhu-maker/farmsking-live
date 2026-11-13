import { DeliveryPricingType, NurseryCategoryType } from '@prisma/client';
export declare class CreateNurseryBatchDto {
    plotId?: string;
    category: NurseryCategoryType;
    varietyName: string;
    sowingDate?: string;
    readyDate?: string;
    uprootingDeadline?: string;
    seedTagPhotoUrl?: string;
    isSeedCertified?: boolean;
    sowingPhotoUrl?: string;
    uprootingPhotoUrl?: string;
    trayCavityCount?: number;
    guaranteedBundlesPerAcre?: number;
    pricePerUnit: number;
    estimatedCapacity: number;
    minOrderAmount?: number;
    deliveryPricingType?: DeliveryPricingType;
}
