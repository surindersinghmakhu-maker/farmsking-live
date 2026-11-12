import { SoilType, WaterType } from '@prisma/client';
export declare class ConvertVerifiedLeadDto {
    name: string;
    role: 'CUSTOMER' | 'FARMER' | 'GARDENER';
    pincode?: string;
    postOffice?: string;
    village?: string;
    district?: string;
    state?: string;
    email?: string;
    sprayTankSizeL?: number;
    soilType?: SoilType;
    waterType?: WaterType;
    referralCode?: string;
    adminNotes?: string;
}
export declare class UpdateVerifiedLeadNotesDto {
    adminNotes?: string;
    capturedName?: string;
    capturedEmail?: string;
    pincode?: string;
    district?: string;
    state?: string;
    village?: string;
    intendedRole?: 'CUSTOMER' | 'FARMER' | 'GARDENER' | 'ADVISOR' | 'AGENT' | 'SELLER' | 'TRADER';
    status?: 'OTP_CONFIRMED' | 'DISMISSED';
}
