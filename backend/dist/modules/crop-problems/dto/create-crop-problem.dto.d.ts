import { CropProblemSeverity } from '@prisma/client';
export declare class CreateCropProblemDto {
    cropCycleId: string;
    title: string;
    description: string;
    severity?: CropProblemSeverity;
    photoUrls?: string[];
}
