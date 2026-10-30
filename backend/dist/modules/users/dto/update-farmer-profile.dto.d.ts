import { SoilType, WaterType } from '@prisma/client';
export declare class UpdateFarmerProfileDto {
    name?: string;
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
    farmName?: string;
    farmAddress?: string;
    farmMobile?: string;
    whatsappGroupEnabled?: boolean;
}
