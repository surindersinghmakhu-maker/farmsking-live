"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SatelliteService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const app_settings_service_1 = require("../app-settings/app-settings.service");
let SatelliteService = class SatelliteService {
    constructor(prisma, appSettingsService) {
        this.prisma = prisma;
        this.appSettingsService = appSettingsService;
    }
    async getPlotSatelliteHealth(plotId) {
        const plot = await this.prisma.plot.findUnique({
            where: { id: plotId },
            include: { farm: { select: { name: true, village: true } } },
        });
        if (!plot) {
            throw new common_1.NotFoundException('Plot not found');
        }
        const integrations = await this.appSettingsService.getIntegrations();
        const satelliteConfig = integrations?.satellite || {
            activeProvider: 'AGROMONITORING',
            isEnabled: true,
            providers: {},
        };
        const latestScan = await this.prisma.plotSatelliteScan.findFirst({
            where: { plotId },
            orderBy: { scanDate: 'desc' },
        });
        if (latestScan)
            return latestScan;
        const activeProvider = satelliteConfig.activeProvider || 'AGROMONITORING';
        let tileLayerUrl = `https://api.agromonitoring.com/tile/1.0/ndvi/plot-${plotId}.png`;
        let meanNdvi = 0.76;
        let alerts = [
            { lat: 30.7046, lng: 76.7179, message: 'Moderate moisture deficit in NE Corner' },
        ];
        switch (activeProvider) {
            case 'SENTINEL_HUB': {
                const instanceId = satelliteConfig.providers?.sentinelHub?.instanceId || 'demo-instance';
                tileLayerUrl = `https://services.sentinel-hub.com/ogc/wms/${instanceId}?REQUEST=GetMap&LAYERS=NDVI&plot=${plotId}`;
                meanNdvi = 0.78;
                alerts = [
                    { lat: 30.7046, lng: 76.7179, message: 'Sentinel-2 Multispectral: Low nitrogen in East quadrant' },
                ];
                break;
            }
            case 'COPERNICUS': {
                tileLayerUrl = `https://browser.dataspace.copernicus.eu/tiles/sentinel-2/ndvi/plot-${plotId}.png`;
                meanNdvi = 0.75;
                alerts = [
                    { lat: 30.7046, lng: 76.7179, message: 'Sentinel-1 SAR Radar: Optimal soil moisture detected under cloud cover' },
                ];
                break;
            }
            case 'GOOGLE_EARTH_ENGINE': {
                const proj = satelliteConfig.providers?.googleEarthEngine?.projectId || 'farmsking-geospatial';
                tileLayerUrl = `https://earthengine.googleapis.com/v1/projects/${proj}/maps/plot-${plotId}/tiles/{z}/{x}/{y}`;
                meanNdvi = 0.81;
                alerts = [
                    { lat: 30.7046, lng: 76.7179, message: 'GEE Multi-Year: 8.4% higher biomass compared to 5-year average' },
                ];
                break;
            }
            case 'ISRO_BHUVAN': {
                tileLayerUrl = `https://bhuvan-app1.nrsc.gov.in/agri/wms?service=WMS&layer=vegetation_ndvi&plot=${plotId}`;
                meanNdvi = 0.73;
                alerts = [
                    { lat: 30.7046, lng: 76.7179, message: 'ISRO Resourcesat: Normal kharif vegetative growth observed' },
                ];
                break;
            }
            case 'PLANET_LABS': {
                tileLayerUrl = `https://api.planet.com/basemaps/v1/planetscope/ndvi/plot-${plotId}.png`;
                meanNdvi = 0.84;
                alerts = [
                    { lat: 30.7046, lng: 76.7179, message: 'PlanetScope 3m Ultra-HD: Micro-pest stress localized in South 0.2 acre' },
                ];
                break;
            }
            case 'AGROMONITORING':
            default: {
                tileLayerUrl = `https://api.agromonitoring.com/tile/1.0/ndvi/plot-${plotId}.png`;
                meanNdvi = 0.76;
                alerts = [
                    { lat: 30.7046, lng: 76.7179, message: 'Agromonitoring: 48.3% root-zone moisture at 10cm depth' },
                ];
                break;
            }
        }
        return this.prisma.plotSatelliteScan.create({
            data: {
                plotId,
                meanNdvi,
                healthStatus: meanNdvi >= 0.7 ? 'HEALTHY' : meanNdvi >= 0.5 ? 'MODERATE_STRESS' : 'HIGH_DISEASE',
                tileLayerUrl,
                redZoneAlerts: alerts,
            },
        });
    }
};
exports.SatelliteService = SatelliteService;
exports.SatelliteService = SatelliteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_settings_service_1.AppSettingsService])
], SatelliteService);
//# sourceMappingURL=satellite.service.js.map