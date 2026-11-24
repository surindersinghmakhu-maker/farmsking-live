import { Module } from '@nestjs/common';
import { AdvisorAssignmentModule } from '../advisor-assignment/advisor-assignment.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AppSettingsModule } from '../app-settings/app-settings.module';
import { FarmerPlansModule } from '../farmer-plans/farmer-plans.module';
import { WalletModule } from '../wallet/wallet.module';
import { CashfreeModule } from '../cashfree/cashfree.module';
import { RazorpayModule } from '../razorpay/razorpay.module';
import { PhonePeModule } from '../phonepe/phonepe.module';
import { FarmerPlanPaymentsController } from './farmer-plan-payments.controller';
import { FarmerPlanPaymentsService } from './farmer-plan-payments.service';

@Module({
  imports: [
    AdvisorAssignmentModule,
    NotificationsModule,
    AppSettingsModule,
    FarmerPlansModule,
    WalletModule,
    CashfreeModule,
    RazorpayModule,
    PhonePeModule,
  ],
  controllers: [FarmerPlanPaymentsController],
  providers: [FarmerPlanPaymentsService],
  exports: [FarmerPlanPaymentsService],
})
export class FarmerPlanPaymentsModule {}
