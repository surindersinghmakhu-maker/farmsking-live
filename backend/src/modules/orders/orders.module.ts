import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { CouponsModule } from '../coupons/coupons.module';
import { WalletModule } from '../wallet/wallet.module';
import { AppSettingsModule } from '../app-settings/app-settings.module';
import { PhonePeModule } from '../phonepe/phonepe.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [NotificationsModule, CouponsModule, WalletModule, AppSettingsModule, PhonePeModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
