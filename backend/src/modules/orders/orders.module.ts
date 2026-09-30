import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { CouponsModule } from '../coupons/coupons.module';
import { WalletModule } from '../wallet/wallet.module';
import { AppSettingsModule } from '../app-settings/app-settings.module';
import { PhonePeModule } from '../phonepe/phonepe.module';
import { ShiprocketModule } from '../shiprocket/shiprocket.module';
import { CashfreeModule } from '../cashfree/cashfree.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { BillingService } from './billing.service';

@Module({
  imports: [
    NotificationsModule,
    CouponsModule,
    WalletModule,
    AppSettingsModule,
    PhonePeModule,
    ShiprocketModule,
    CashfreeModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, BillingService],
  exports: [OrdersService, BillingService],
})
export class OrdersModule {}

