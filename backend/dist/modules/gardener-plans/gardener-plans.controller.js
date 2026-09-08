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
exports.GardenerPlansController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const gardener_plans_service_1 = require("./gardener-plans.service");
const create_gardener_plan_coupon_dto_1 = require("./dto/create-gardener-plan-coupon.dto");
const redeem_gardener_plan_coupon_dto_1 = require("./dto/redeem-gardener-plan-coupon.dto");
let GardenerPlansController = class GardenerPlansController {
    gardenerPlansService;
    constructor(gardenerPlansService) {
        this.gardenerPlansService = gardenerPlansService;
    }
    getMyPlan(user) {
        return this.gardenerPlansService.getMyPlan(user);
    }
    previewCoupon(user, code) {
        return this.gardenerPlansService.previewCoupon(user, code);
    }
    redeemCoupon(user, dto) {
        return this.gardenerPlansService.redeemCoupon(user, dto);
    }
    createCoupon(user, dto) {
        return this.gardenerPlansService.createCoupon(user, dto);
    }
    listAllCoupons() {
        return this.gardenerPlansService.listAllCoupons();
    }
    listAllGardenerPlans() {
        return this.gardenerPlansService.listAllGardenerPlans();
    }
};
exports.GardenerPlansController = GardenerPlansController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.GARDENER),
    (0, common_1.Get)('my-plan'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GardenerPlansController.prototype, "getMyPlan", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.GARDENER),
    (0, common_1.Get)('coupon/:code/preview'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GardenerPlansController.prototype, "previewCoupon", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.GARDENER),
    (0, common_1.Post)('redeem'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, redeem_gardener_plan_coupon_dto_1.RedeemGardenerPlanCouponDto]),
    __metadata("design:returntype", void 0)
], GardenerPlansController.prototype, "redeemCoupon", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('coupons'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_gardener_plan_coupon_dto_1.CreateGardenerPlanCouponDto]),
    __metadata("design:returntype", void 0)
], GardenerPlansController.prototype, "createCoupon", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('coupons'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GardenerPlansController.prototype, "listAllCoupons", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GardenerPlansController.prototype, "listAllGardenerPlans", null);
exports.GardenerPlansController = GardenerPlansController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('gardener-plans'),
    __metadata("design:paramtypes", [gardener_plans_service_1.GardenerPlansService])
], GardenerPlansController);
//# sourceMappingURL=gardener-plans.controller.js.map