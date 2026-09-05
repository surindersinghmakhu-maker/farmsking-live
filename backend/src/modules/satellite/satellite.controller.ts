import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SatelliteService } from './satellite.service';

@UseGuards(JwtAuthGuard)
@Controller('satellite')
export class SatelliteController {
  constructor(private readonly satelliteService: SatelliteService) {}

  @Get('plot/:plotId/health')
  getPlotSatelliteHealth(@Param('plotId') plotId: string) {
    return this.satelliteService.getPlotSatelliteHealth(plotId);
  }
}
