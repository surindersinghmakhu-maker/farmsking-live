import { SoilType, WaterType } from '@prisma/client';
export declare class UpdateFarmerProfileDto {
    photoUrl?: string;
    pincode?: string;
    postOffice?: string;
    village?: string;
    district?: string;
    state?: string;
    sprayTankSizeL?: number;
    soilType?: SoilType;
    waterType?: WaterType;
    upiId?: string;
    billPrintingAddress?: string;
}
