import { CropCategory, CropCycleStage, CropHarvestType, CropStatus } from '@prisma/client';
export declare class CreateCropDto {
    plotId: string;
    category?: CropCategory;
    cropName: string;
    variety?: string;
    area?: number;
    plantCount?: number;
    sowingDate?: string;
    transplantDate?: string;
    expectedHarvestDate?: string;
    actualHarvestDate?: string;
    status?: CropStatus;
    stage?: CropCycleStage;
    unit?: string;
    pricePerUnit?: number;
    harvestType?: CropHarvestType;
    notes?: string;
}
