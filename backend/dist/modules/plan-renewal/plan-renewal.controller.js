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
exports.PlanRenewalController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const plan_renewal_service_1 = require("./plan-renewal.service");
const create_plan_renewal_coupon_dto_1 = require("./dto/create-plan-renewal-coupon.dto");
const redeem_plan_renewal_coupon_dto_1 = require("./dto/redeem-plan-renewal-coupon.dto");
const grant_plan_days_dto_1 = require("./dto/grant-plan-days.dto");
let PlanRenewalController = class PlanRenewalController {
    planRenewalService;
    constructor(planRenewalService) {
        this.planRenewalService = planRenewalService;
    }
    create(user, dto) {
        return this.planRenewalService.create(user, dto);
    }
    listAll() {
        return this.planRenewalService.listAll();
    }
    listMine(user) {
        return this.planRenewalService.listMineForAdvisor(user);
    }
    getUpiLink(user, farmerId) {
        return this.planRenewalService.getUpiLinkForFarmer(user, farmerId);
    }
    preview(user, code, farmerId) {
        return this.planRenewalService.previewRedeem(user, code, farmerId);
    }
    redeem(user, code, dto) {
        return this.planRenewalService.redeem(user, code, dto);
    }
    grantDays(dto) {
        return this.planRenewalService.grantDaysDirectly(dto.farmerId, dto.daysGranted);
    }
};
exports.PlanRenewalController = PlanRenewalController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_plan_renewal_coupon_dto_1.CreatePlanRenewalCouponDto]),
    __metadata("design:returntype", void 0)
], PlanRenewalController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PlanRenewalController.prototype, "listAll", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Get)('mine'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PlanRenewalController.prototype, "listMine", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADVISOR),
    (0, common_1.Get)('upi-link'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('farmerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PlanRenewalController.prototype, "getUpiLink", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADVISOR),
    (0, common_1.Get)(':code/preview'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('code')),
    __param(2, (0, common_1.Query)('farmerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], PlanRenewalController.prototype, "preview", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADVISOR),
    (0, common_1.Post)(':code/redeem'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('code')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, redeem_plan_renewal_coupon_dto_1.RedeemPlanRenewalCouponDto]),
    __metadata("design:returntype", void 0)
], PlanRenewalController.prototype, "redeem", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('grant-days'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [grant_plan_days_dto_1.GrantPlanDaysDto]),
    __metadata("design:returntype", void 0)
], PlanRenewalController.prototype, "grantDays", null);
exports.PlanRenewalController = PlanRenewalController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('plan-renewal-coupons'),
    __metadata("design:paramtypes", [plan_renewal_service_1.PlanRenewalService])
], PlanRenewalController);
//# sourceMappingURL=plan-renewal.controller.js.map