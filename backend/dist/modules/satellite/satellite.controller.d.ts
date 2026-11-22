import { SatelliteService } from './satellite.service';
export declare class SatelliteController {
    private readonly satelliteService;
    constructor(satelliteService: SatelliteService);
    getPlotSatelliteHealth(plotId: string): Promise<{
        id: string;
        createdAt: Date;
        plotId: string;
        healthStatus: string;
        scanDate: Date;
        meanNdvi: number;
        tileLayerUrl: string;
        redZoneAlerts: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
