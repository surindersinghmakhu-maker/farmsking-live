"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersModule = void 0;
const common_1 = require("@nestjs/common");
const notifications_module_1 = require("../notifications/notifications.module");
const coupons_module_1 = require("../coupons/coupons.module");
const wallet_module_1 = require("../wallet/wallet.module");
const app_settings_module_1 = require("../app-settings/app-settings.module");
const phonepe_module_1 = require("../phonepe/phonepe.module");
const shiprocket_module_1 = require("../shiprocket/shiprocket.module");
const cashfree_module_1 = require("../cashfree/cashfree.module");
const orders_controller_1 = require("./orders.controller");
const orders_service_1 = require("./orders.service");
const billing_service_1 = require("./billing.service");
let OrdersModule = class OrdersModule {
};
exports.OrdersModule = OrdersModule;
exports.OrdersModule = OrdersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            notifications_module_1.NotificationsModule,
            coupons_module_1.CouponsModule,
            wallet_module_1.WalletModule,
            app_settings_module_1.AppSettingsModule,
            phonepe_module_1.PhonePeModule,
            shiprocket_module_1.ShiprocketModule,
            cashfree_module_1.CashfreeModule,
        ],
        controllers: [orders_controller_1.OrdersController],
        providers: [orders_service_1.OrdersService, billing_service_1.BillingService],
        exports: [orders_service_1.OrdersService, billing_service_1.BillingService],
    })
], OrdersModule);
//# sourceMappingURL=orders.module.js.map