"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./modules/prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const farms_module_1 = require("./modules/farms/farms.module");
const plots_module_1 = require("./modules/plots/plots.module");
const crops_module_1 = require("./modules/crops/crops.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const market_rates_module_1 = require("./modules/market-rates/market-rates.module");
const expenses_module_1 = require("./modules/expenses/expenses.module");
const uploads_module_1 = require("./modules/uploads/uploads.module");
const advisor_assignment_module_1 = require("./modules/advisor-assignment/advisor-assignment.module");
const subscriptions_module_1 = require("./modules/subscriptions/subscriptions.module");
const crop_activity_schedules_module_1 = require("./modules/crop-activity-schedules/crop-activity-schedules.module");
const spray_schedules_module_1 = require("./modules/spray-schedules/spray-schedules.module");
const spray_item_templates_module_1 = require("./modules/spray-item-templates/spray-item-templates.module");
const crop_problems_module_1 = require("./modules/crop-problems/crop-problems.module");
const users_module_1 = require("./modules/users/users.module");
const weather_module_1 = require("./modules/weather/weather.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const wallet_module_1 = require("./modules/wallet/wallet.module");
const coupons_module_1 = require("./modules/coupons/coupons.module");
const withdrawals_module_1 = require("./modules/withdrawals/withdrawals.module");
const plan_renewal_module_1 = require("./modules/plan-renewal/plan-renewal.module");
const chat_module_1 = require("./modules/chat/chat.module");
const products_module_1 = require("./modules/products/products.module");
const orders_module_1 = require("./modules/orders/orders.module");
const phonepe_module_1 = require("./modules/phonepe/phonepe.module");
const farmer_plans_module_1 = require("./modules/farmer-plans/farmer-plans.module");
const plan_payments_module_1 = require("./modules/plan-payments/plan-payments.module");
const farmer_plan_payments_module_1 = require("./modules/farmer-plan-payments/farmer-plan-payments.module");
const partner_assignment_module_1 = require("./modules/partner-assignment/partner-assignment.module");
const gardener_plans_module_1 = require("./modules/gardener-plans/gardener-plans.module");
const gardens_module_1 = require("./modules/gardens/gardens.module");
const parties_module_1 = require("./modules/parties/parties.module");
const sale_bills_module_1 = require("./modules/sale-bills/sale-bills.module");
const payment_receipts_module_1 = require("./modules/payment-receipts/payment-receipts.module");
const basic_plan_coupons_module_1 = require("./modules/basic-plan-coupons/basic-plan-coupons.module");
const app_settings_module_1 = require("./modules/app-settings/app-settings.module");
const coupon_settings_module_1 = require("./modules/coupon-settings/coupon-settings.module");
const call_requests_module_1 = require("./modules/call-requests/call-requests.module");
const addresses_module_1 = require("./modules/addresses/addresses.module");
const audit_module_1 = require("./modules/audit/audit.module");
const labour_module_1 = require("./modules/labour/labour.module");
const admin_chat_module_1 = require("./modules/admin-chat/admin-chat.module");
const whatsapp_module_1 = require("./modules/whatsapp/whatsapp.module");
const referrals_module_1 = require("./modules/referrals/referrals.module");
const voice_ai_module_1 = require("./modules/voice-ai/voice-ai.module");
const satellite_module_1 = require("./modules/satellite/satellite.module");
const mandi_ai_module_1 = require("./modules/mandi-ai/mandi-ai.module");
const king_connect_module_1 = require("./modules/king-connect/king-connect.module");
const voice_call_module_1 = require("./modules/voice-call/voice-call.module");
const prisma_exception_filter_1 = require("./common/filters/prisma-exception.filter");
const audit_log_interceptor_1 = require("./common/interceptors/audit-log.interceptor");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            farms_module_1.FarmsModule,
            plots_module_1.PlotsModule,
            crops_module_1.CropsModule,
            dashboard_module_1.DashboardModule,
            market_rates_module_1.MarketRatesModule,
            parties_module_1.PartiesModule,
            sale_bills_module_1.SaleBillsModule,
            payment_receipts_module_1.PaymentReceiptsModule,
            basic_plan_coupons_module_1.BasicPlanCouponsModule,
            app_settings_module_1.AppSettingsModule,
            coupon_settings_module_1.CouponSettingsModule,
            call_requests_module_1.CallRequestsModule,
            addresses_module_1.AddressesModule,
            expenses_module_1.ExpensesModule,
            labour_module_1.LabourModule,
            admin_chat_module_1.AdminChatModule,
            whatsapp_module_1.WhatsappBotModule,
            uploads_module_1.UploadsModule,
            advisor_assignment_module_1.AdvisorAssignmentModule,
            subscriptions_module_1.SubscriptionsModule,
            crop_activity_schedules_module_1.CropActivitySchedulesModule,
            spray_schedules_module_1.SprayScheduleModule,
            spray_item_templates_module_1.SprayItemTemplatesModule,
            crop_problems_module_1.CropProblemsModule,
            users_module_1.UsersModule,
            weather_module_1.WeatherModule,
            notifications_module_1.NotificationsModule,
            wallet_module_1.WalletModule,
            coupons_module_1.CouponsModule,
            withdrawals_module_1.WithdrawalsModule,
            plan_renewal_module_1.PlanRenewalModule,
            chat_module_1.ChatModule,
            products_module_1.ProductsModule,
            orders_module_1.OrdersModule,
            phonepe_module_1.PhonePeModule,
            farmer_plans_module_1.FarmerPlansModule,
            plan_payments_module_1.PlanPaymentsModule,
            farmer_plan_payments_module_1.FarmerPlanPaymentsModule,
            partner_assignment_module_1.PartnerAssignmentModule,
            gardener_plans_module_1.GardenerPlansModule,
            gardens_module_1.GardensModule,
            audit_module_1.AuditModule,
            referrals_module_1.ReferralsModule,
            voice_ai_module_1.VoiceAIModule,
            satellite_module_1.SatelliteModule,
            mandi_ai_module_1.MandiAIModule,
            king_connect_module_1.KingConnectModule,
            voice_call_module_1.VoiceCallModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_FILTER, useClass: prisma_exception_filter_1.PrismaExceptionFilter },
            { provide: core_1.APP_INTERCEPTOR, useClass: audit_log_interceptor_1.AuditLogInterceptor },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map