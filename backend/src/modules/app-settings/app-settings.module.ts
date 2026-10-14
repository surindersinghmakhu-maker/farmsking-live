import { Module } from '@nestjs/common';
import { AppSettingsController, PublicContactController } from './app-settings.controller';
import { AppSettingsService } from './app-settings.service';

@Module({
  controllers: [AppSettingsController, PublicContactController],
  providers: [AppSettingsService],
  exports: [AppSettingsService],
})
export class AppSettingsModule {}
