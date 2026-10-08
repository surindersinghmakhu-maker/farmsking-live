import { SatelliteService } from './satellite.service';
export declare class SatelliteController {
    private readonly satelliteService;
    constructor(satelliteService: SatelliteService);
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
