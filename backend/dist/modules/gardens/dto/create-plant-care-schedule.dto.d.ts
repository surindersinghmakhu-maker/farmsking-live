import { PlantCareType } from '@prisma/client';
export declare class CreatePlantCareScheduleDto {
    plantId: string;
    careType: PlantCareType;
    title: string;
    instructions?: string;
    intervalDays: number;
    nextDueDate: string;
}
