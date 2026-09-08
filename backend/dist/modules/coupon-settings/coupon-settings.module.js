"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponSettingsModule = void 0;
const common_1 = require("@nestjs/common");
const coupon_settings_controller_1 = require("./coupon-settings.controller");
const coupon_settings_service_1 = require("./coupon-settings.service");
let CouponSettingsModule = class CouponSettingsModule {
};
exports.CouponSettingsModule = CouponSettingsModule;
exports.CouponSettingsModule = CouponSettingsModule = __decorate([
    (0, common_1.Module)({
        controllers: [coupon_settings_controller_1.CouponSettingsController],
        providers: [coupon_settings_service_1.CouponSettingsService],
        exports: [coupon_settings_service_1.CouponSettingsService],
    })
], CouponSettingsModule);
//# sourceMappingURL=coupon-settings.module.js.map