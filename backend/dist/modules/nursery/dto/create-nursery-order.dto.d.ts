import { InterStateDeliveryMode, TransportMode } from '@prisma/client';
export declare class CreateNurseryOrderDto {
    batchId: string;
    quantityUnits: number;
    requestedDeliveryDate: string;
    transportMode: TransportMode;
    deliveryMode: InterStateDeliveryMode;
    agentId?: string;
    notes?: string;
}
