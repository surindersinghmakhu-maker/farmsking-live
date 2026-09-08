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
let SatelliteService = class SatelliteService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPlotSatelliteHealth(plotId) {
        const plot = await this.prisma.plot.findUnique({
            where: { id: plotId },
            include: { farm: { select: { name: true, village: true } } },
        });
        if (!plot) {
            throw new common_1.NotFoundException('Plot not found');
        }
        const latestScan = await this.prisma.plotSatelliteScan.findFirst({
            where: { plotId },
            orderBy: { scanDate: 'desc' },
        });
        if (latestScan)
            return latestScan;
        const meanNdvi = 0.74;
        const tileLayerUrl = `https://tiles.sentinel-hub.com/v1/ndvi/plot-${plotId}.png`;
        return this.prisma.plotSatelliteScan.create({
            data: {
                plotId,
                meanNdvi,
                healthStatus: 'HEALTHY',
                tileLayerUrl,
                redZoneAlerts: [
                    { lat: 30.7046, lng: 76.7179, message: 'Moderate moisture deficit in NE Corner' },
                ],
            },
        });
    }
};
exports.SatelliteService = SatelliteService;
exports.SatelliteService = SatelliteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SatelliteService);
//# sourceMappingURL=satellite.service.js.map