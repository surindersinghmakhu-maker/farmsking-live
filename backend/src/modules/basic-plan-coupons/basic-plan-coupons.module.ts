import { Module } from '@nestjs/common';
import { BasicPlanCouponsController } from './basic-plan-coupons.controller';
import { BasicPlanCouponsService } from './basic-plan-coupons.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [BasicPlanCouponsController],
  providers: [BasicPlanCouponsService],
})
export class BasicPlanCouponsModule {}
