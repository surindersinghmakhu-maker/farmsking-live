import { AreaUnit } from '@prisma/client';
export declare class CreatePlotDto {
    farmId: string;
    name: string;
    area: number;
    areaUnit?: AreaUnit;
    soilType?: string;
    irrigationType?: string;
    waterSource?: string;
    notes?: string;
}
