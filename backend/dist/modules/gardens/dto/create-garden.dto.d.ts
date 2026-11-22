import { GardenType } from '@prisma/client';
export declare class CreateGardenDto {
    name: string;
    gardenType?: GardenType;
    location?: string;
    area?: number;
    sunlightExposure?: string;
    wateringSource?: string;
}
