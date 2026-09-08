import { AdvisorType } from '@prisma/client';
export declare class UpdateAdvisorProfileDto {
    photoUrl?: string;
    pincode?: string;
    postOffice?: string;
    specialization?: string;
    bio?: string;
    yearsExperience?: number;
    email?: string;
    village?: string;
    district?: string;
    state?: string;
    advisorType?: AdvisorType;
    notificationsEnabled?: boolean;
    qualification?: string;
    profileTitle?: string;
    alternativeMobile?: string;
    panNumber?: string;
    upiId?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
    bankAccountHolderName?: string;
}
