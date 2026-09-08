import { SoilType, WaterType } from '@prisma/client';
export declare class RegisterDto {
    mobile: string;
    accountType?: 'CUSTOMER' | 'FARMER' | 'GARDENER';
    sprayTankSizeL?: number;
    soilType?: SoilType;
    waterType?: WaterType;
    password: string;
    name: string;
    pincode: string;
    postOffice?: string;
    village?: string;
    district?: string;
    state?: string;
    preferredLanguage?: string;
    securityQuestion?: string;
    securityAnswer?: string;
    upiId?: string;
    referralCode?: string;
}
