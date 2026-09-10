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
exports.BasicPlanCouponsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const basic_plan_coupons_service_1 = require("./basic-plan-coupons.service");
const create_basic_plan_coupon_dto_1 = require("./dto/create-basic-plan-coupon.dto");
let BasicPlanCouponsController = class BasicPlanCouponsController {
    basicPlanCouponsService;
    constructor(basicPlanCouponsService) {
        this.basicPlanCouponsService = basicPlanCouponsService;
    }
    create(user, dto) {
        return this.basicPlanCouponsService.create(user, dto);
    }
    listAll() {
        return this.basicPlanCouponsService.listAll();
    }
    listAvailable() {
        return this.basicPlanCouponsService.listAvailableForPurchase();
    }
    listMine(user) {
        return this.basicPlanCouponsService.listMinePurchased(user);
    }
    purchase(user, code) {
        return this.basicPlanCouponsService.purchase(user, code);
    }
    redeem(user, code) {
        return this.basicPlanCouponsService.redeem(user, code);
    }
};
exports.BasicPlanCouponsController = BasicPlanCouponsController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_basic_plan_coupon_dto_1.CreateBasicPlanCouponDto]),
    __metadata("design:returntype", void 0)
], BasicPlanCouponsController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BasicPlanCouponsController.prototype, "listAll", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.BUSINESS_PARTNER),
    (0, common_1.Get)('available'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BasicPlanCouponsController.prototype, "listAvailable", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.BUSINESS_PARTNER),
    (0, common_1.Get)('mine'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BasicPlanCouponsController.prototype, "listMine", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.BUSINESS_PARTNER),
    (0, common_1.Post)(':code/purchase'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BasicPlanCouponsController.prototype, "purchase", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER),
    (0, common_1.Post)(':code/redeem'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BasicPlanCouponsController.prototype, "redeem", null);
exports.BasicPlanCouponsController = BasicPlanCouponsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('basic-plan-coupons'),
    __metadata("design:paramtypes", [basic_plan_coupons_service_1.BasicPlanCouponsService])
], BasicPlanCouponsController);
//# sourceMappingURL=basic-plan-coupons.controller.js.map