import { AdvisorType } from '@prisma/client';
export declare class CreateAssistantDoctorDto {
    mobile: string;
    name: string;
    password?: string;
    specialization?: string;
    doctorConsultationFee?: number;
    qualification?: string;
    profileTitle?: string;
    advisorType?: AdvisorType;
}
