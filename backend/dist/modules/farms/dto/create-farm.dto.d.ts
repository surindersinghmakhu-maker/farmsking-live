import { AreaUnit } from '@prisma/client';
export declare class CreateFarmDto {
    name: string;
    village?: string;
    district?: string;
    state?: string;
    totalArea: number;
    areaUnit?: AreaUnit;
    soilType?: string;
    irrigationSource?: string;
    notes?: string;
}
