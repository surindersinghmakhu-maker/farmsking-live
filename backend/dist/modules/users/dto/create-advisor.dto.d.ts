import { AdvisorType } from '@prisma/client';
export declare class CreateAdvisorDto {
    mobile: string;
    name: string;
    email?: string;
    village?: string;
    district?: string;
    state?: string;
    preferredLanguage?: string;
    advisorType: AdvisorType;
}
