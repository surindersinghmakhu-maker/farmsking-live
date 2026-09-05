import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { FarmsModule } from './modules/farms/farms.module';
import { PlotsModule } from './modules/plots/plots.module';
import { CropsModule } from './modules/crops/crops.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MarketRatesModule } from './modules/market-rates/market-rates.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { AdvisorAssignmentModule } from './modules/advisor-assignment/advisor-assignment.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { CropActivitySchedulesModule } from './modules/crop-activity-schedules/crop-activity-schedules.module';
import { SprayScheduleModule } from './modules/spray-schedules/spray-schedules.module';
import { SprayItemTemplatesModule } from './modules/spray-item-templates/spray-item-templates.module';
import { CropProblemsModule } from './modules/crop-problems/crop-problems.module';
import { UsersModule } from './modules/users/users.module';
import { WeatherModule } from './modules/weather/weather.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { WithdrawalsModule } from './modules/withdrawals/withdrawals.module';
import { PlanRenewalModule } from './modules/plan-renewal/plan-renewal.module';
import { ChatModule } from './modules/chat/chat.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PhonePeModule } from './modules/phonepe/phonepe.module';
import { FarmerPlansModule } from './modules/farmer-plans/farmer-plans.module';
import { PlanPaymentsModule } from './modules/plan-payments/plan-payments.module';
import { FarmerPlanPaymentsModule } from './modules/farmer-plan-payments/farmer-plan-payments.module';
import { PartnerAssignmentModule } from './modules/partner-assignment/partner-assignment.module';
import { GardenerPlansModule } from './modules/gardener-plans/gardener-plans.module';
import { GardensModule } from './modules/gardens/gardens.module';
import { PartiesModule } from './modules/parties/parties.module';
import { SaleBillsModule } from './modules/sale-bills/sale-bills.module';
import { PaymentReceiptsModule } from './modules/payment-receipts/payment-receipts.module';
import { BasicPlanCouponsModule } from './modules/basic-plan-coupons/basic-plan-coupons.module';
import { AppSettingsModule } from './modules/app-settings/app-settings.module';
import { CouponSettingsModule } from './modules/coupon-settings/coupon-settings.module';
import { CallRequestsModule } from './modules/call-requests/call-requests.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { AuditModule } from './modules/audit/audit.module';
import { LabourModule } from './modules/labour/labour.module';
import { AdminChatModule } from './modules/admin-chat/admin-chat.module';
import { WhatsappBotModule } from './modules/whatsapp/whatsapp.module';
import { ReferralsModule } from './modules/referrals/referrals.module';
import { VoiceAIModule } from './modules/voice-ai/voice-ai.module';
import { SatelliteModule } from './modules/satellite/satellite.module';
import { MandiAIModule } from './modules/mandi-ai/mandi-ai.module';
import { GoogleDriveBackupModule } from './modules/google-drive-backup/google-drive-backup.module';
import { KingConnectModule } from './modules/king-connect/king-connect.module';
import { VoiceCallModule } from './modules/voice-call/voice-call.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';


import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    AuthModule,
    FarmsModule,
    PlotsModule,
    CropsModule,
    DashboardModule,
    MarketRatesModule,
    PartiesModule,
    SaleBillsModule,
    PaymentReceiptsModule,
    BasicPlanCouponsModule,
    AppSettingsModule,
    CouponSettingsModule,
    CallRequestsModule,
    AddressesModule,
    ExpensesModule,
    LabourModule,
    AdminChatModule,
    WhatsappBotModule,
    UploadsModule,
    AdvisorAssignmentModule,
    SubscriptionsModule,
    CropActivitySchedulesModule,
    SprayScheduleModule,
    SprayItemTemplatesModule,
    CropProblemsModule,
    UsersModule,
    WeatherModule,
    NotificationsModule,
    WalletModule,
    CouponsModule,
    WithdrawalsModule,
    PlanRenewalModule,
    ChatModule,
    ProductsModule,
    OrdersModule,
    PhonePeModule,
    FarmerPlansModule,
    PlanPaymentsModule,
    FarmerPlanPaymentsModule,
    PartnerAssignmentModule,
    GardenerPlansModule,
    GardensModule,
    AuditModule,
    ReferralsModule,
    VoiceAIModule,
    SatelliteModule,
    MandiAIModule,
    KingConnectModule,
    VoiceCallModule,
  ],


  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppModule {}
