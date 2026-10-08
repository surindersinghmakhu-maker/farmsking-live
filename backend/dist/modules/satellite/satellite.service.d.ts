import { PrismaService } from '../prisma/prisma.service';
export declare class SatelliteService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPlotSatelliteHealth(plotId: string): Promise<{
        id: string;
        createdAt: Date;
        plotId: string;
        scanDate: Date;
        meanNdvi: number;
        healthStatus: string;
        tileLayerUrl: string;
        redZoneAlerts: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
