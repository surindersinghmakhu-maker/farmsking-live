import { Module } from '@nestjs/common';
import { CouponSettingsController } from './coupon-settings.controller';
import { CouponSettingsService } from './coupon-settings.service';

@Module({
  controllers: [CouponSettingsController],
  providers: [CouponSettingsService],
  exports: [CouponSettingsService],
})
export class CouponSettingsModule {}
