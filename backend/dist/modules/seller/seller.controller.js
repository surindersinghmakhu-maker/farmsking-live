"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellerController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const seller_service_1 = require("./seller.service");
const seller_store_dto_1 = require("./dto/seller-store.dto");
let SellerController = class SellerController {
    constructor(sellerService) {
        this.sellerService = sellerService;
    }
    registerStore(user, dto) {
        return this.sellerService.registerStore(user, dto);
    }
    getMyStore(user) {
        return this.sellerService.getMyStore(user);
    }
    updateKyc(user, dto) {
        return this.sellerService.updateKyc(user, dto);
    }
    getDashboardStats(user) {
        return this.sellerService.getDashboardStats(user);
    }
    listStoresForAdmin(kycStatus) {
        return this.sellerService.listStoresForAdmin(kycStatus);
    }
    verifyKycByAdmin(storeId, status, commissionRate, rejectionReason) {
        return this.sellerService.verifyKycByAdmin(storeId, status, commissionRate, rejectionReason);
    }
    updateSellerSettings(storeId, dto) {
        return this.sellerService.updateSellerSettings(storeId, dto);
    }
    generateGstr8Report(sellerStoreId, month, year) {
        return this.sellerService.generateGstr8Report(sellerStoreId, parseInt(month || '1', 10), parseInt(year || '2026', 10));
    }
};
exports.SellerController = SellerController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('store'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, seller_store_dto_1.CreateSellerStoreDto]),
    __metadata("design:returntype", void 0)
], SellerController.prototype, "registerStore", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('store/me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SellerController.prototype, "getMyStore", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('store/kyc'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, seller_store_dto_1.UpdateSellerKycDto]),
    __metadata("design:returntype", void 0)
], SellerController.prototype, "updateKyc", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('dashboard/stats'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SellerController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('admin/stores'),
    __param(0, (0, common_1.Query)('kycStatus')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SellerController.prototype, "listStoresForAdmin", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)('admin/stores/:storeId/kyc'),
    __param(0, (0, common_1.Param)('storeId')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Body)('commissionRate')),
    __param(3, (0, common_1.Body)('rejectionReason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, String]),
    __metadata("design:returntype", void 0)
], SellerController.prototype, "verifyKycByAdmin", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)('admin/stores/:storeId/settings'),
    __param(0, (0, common_1.Param)('storeId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, seller_store_dto_1.UpdateSellerSettingsDto]),
    __metadata("design:returntype", void 0)
], SellerController.prototype, "updateSellerSettings", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('admin/gstr8'),
    __param(0, (0, common_1.Query)('sellerStoreId')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], SellerController.prototype, "generateGstr8Report", null);
exports.SellerController = SellerController = __decorate([
    (0, common_1.Controller)('seller'),
    __metadata("design:paramtypes", [seller_service_1.SellerService])
], SellerController);
//# sourceMappingURL=seller.controller.js.map