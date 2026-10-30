export declare class CreateWorkEntryDto {
    workerId: string;
    workDate: string;
    workType: string;
    unit: string;
    quantity: number;
    rate: number;
    notes?: string;
    farmId?: string;
    plotId?: string;
    cropCycleId?: string;
}
