import { Module } from '@nestjs/common';
import { SatelliteService } from './satellite.service';
import { SatelliteController } from './satellite.controller';
import { AppSettingsModule } from '../app-settings/app-settings.module';

@Module({
  imports: [AppSettingsModule],
  controllers: [SatelliteController],
  providers: [SatelliteService],
  exports: [SatelliteService],
})
export class SatelliteModule {}

