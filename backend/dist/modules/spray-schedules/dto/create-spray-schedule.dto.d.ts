import { SprayType } from '@prisma/client';
export declare class CreateSprayScheduleDto {
    cropCycleId: string;
    scheduledDate: string;
    sprayType?: SprayType;
    recommendedProduct: string;
    dosageInstructions?: string;
    alternativeOption?: string;
    alternativeOption2?: string;
    notes?: string;
}
