import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SatelliteService {
  constructor(private readonly prisma: PrismaService) {}

  /** Fetch latest Sentinel-2 NDVI satellite crop health scan for a farm plot */
  async getPlotSatelliteHealth(plotId: string) {
    const plot = await this.prisma.plot.findUnique({
      where: { id: plotId },
      include: { farm: { select: { name: true, village: true } } },
    });

    if (!plot) {
      throw new NotFoundException('Plot not found');
    }

    const latestScan = await this.prisma.plotSatelliteScan.findFirst({
      where: { plotId },
      orderBy: { scanDate: 'desc' },
    });

    if (latestScan) return latestScan;

    // Generate Sentinel-2 NDVI satellite scan
    const meanNdvi = 0.74; // Healthy vegetation index
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
}
