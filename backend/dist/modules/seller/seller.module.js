"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellerModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const shiprocket_module_1 = require("../shiprocket/shiprocket.module");
const notifications_module_1 = require("../notifications/notifications.module");
const seller_service_1 = require("./seller.service");
const seller_controller_1 = require("./seller.controller");
let SellerModule = class SellerModule {
};
exports.SellerModule = SellerModule;
exports.SellerModule = SellerModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, shiprocket_module_1.ShiprocketModule, notifications_module_1.NotificationsModule],
        controllers: [seller_controller_1.SellerController],
        providers: [seller_service_1.SellerService],
        exports: [seller_service_1.SellerService],
    })
], SellerModule);
//# sourceMappingURL=seller.module.js.map