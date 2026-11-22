import { PlantCareType } from '@prisma/client';
export declare class PrescribePlantCareDto {
    gardenerId: string;
    plantId?: string;
    gardenId?: string;
    careType: PlantCareType;
    title: string;
    instructions?: string;
    intervalDays: number;
    nextDueDate?: string;
}
export declare class DoctorConsultationNoteDto {
    gardenerId: string;
    plantId: string;
    notes: string;
    conditionStatus?: string;
    photoUrl?: string;
}
