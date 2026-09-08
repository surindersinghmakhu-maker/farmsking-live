import { CropProblemStatus } from '@prisma/client';
export declare class RespondCropProblemDto {
    advisorResponse: string;
    recommendedProduct?: string;
    followUpDate?: string;
    status?: CropProblemStatus;
}
