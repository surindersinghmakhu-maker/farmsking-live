import { SellerType, SoilType, WaterType } from '@prisma/client';
export declare const ADMIN_CREATE_CATEGORIES: readonly ["STAFF", "PARTNERS", "CLIENTS"];
export type AdminCreateCategory = (typeof ADMIN_CREATE_CATEGORIES)[number];
export declare const ADMIN_CREATE_ROLES: readonly ["ADMIN", "MANAGER", "OPERATOR", "TECHNICAL_TRAINER", "ACCOUNTANT", "AGENT", "SELLER", "FARM_ADVISOR", "GARDEN_ADVISOR", "TRADER", "FARMER", "GARDENER", "CUSTOMER", "SUPERVISOR"];
export type AdminCreateRoleKey = (typeof ADMIN_CREATE_ROLES)[number];
export declare class AdminCreateSendOtpDto {
    mobile: string;
    category?: AdminCreateCategory;
}
export declare class AdminCreateVerifyOtpDto {
    mobile: string;
    otp: string;
    category?: AdminCreateCategory;
}
export declare class AdminCreateUserDto {
    otpVerificationToken: string;
    category: AdminCreateCategory;
    role: AdminCreateRoleKey;
    mobile: string;
    name: string;
    email?: string;
    password?: string;
    pincode?: string;
    postOffice?: string;
    village?: string;
    district?: string;
    state?: string;
    address?: string;
    sprayTankSizeL?: number;
    soilType?: SoilType;
    waterType?: WaterType;
    farmName?: string;
    specialization?: string;
    qualification?: string;
    yearsExperience?: number;
    doctorConsultationFee?: number;
    bio?: string;
    panNumber?: string;
    upiId?: string;
    alternativeMobile?: string;
    bankAccountHolderName?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
    storeName?: string;
    sellerType?: SellerType;
    gstin?: string;
    employerFarmerKingIdOrMobile?: string;
}
