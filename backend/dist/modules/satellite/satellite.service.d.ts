import { PrismaService } from '../prisma/prisma.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
export declare class SatelliteService {
    private readonly prisma;
    private readonly appSettingsService;
    constructor(prisma: PrismaService, appSettingsService: AppSettingsService);
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
