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
exports.FarmerPlansController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const operator_permission_guard_1 = require("../../common/guards/operator-permission.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const operator_permission_decorator_1 = require("../../common/decorators/operator-permission.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const farmer_plans_service_1 = require("./farmer-plans.service");
const create_farmer_plan_coupon_dto_1 = require("./dto/create-farmer-plan-coupon.dto");
const generate_advisor_coupon_dto_1 = require("./dto/generate-advisor-coupon.dto");
const redeem_farmer_plan_coupon_dto_1 = require("./dto/redeem-farmer-plan-coupon.dto");
const grant_farmer_plan_days_dto_1 = require("./dto/grant-farmer-plan-days.dto");
const update_farmer_plan_pricing_dto_1 = require("./dto/update-farmer-plan-pricing.dto");
const choose_advisor_dto_1 = require("./dto/choose-advisor.dto");
const apply_coupon_to_farmer_dto_1 = require("./dto/apply-coupon-to-farmer.dto");
let FarmerPlansController = class FarmerPlansController {
    farmerPlansService;
    constructor(farmerPlansService) {
        this.farmerPlansService = farmerPlansService;
    }
    getMyPlan(user) {
        return this.farmerPlansService.getMyPlan(user);
    }
    previewCoupon(user, code, farmerId) {
        return this.farmerPlansService.previewCoupon(user, code, farmerId);
    }
    redeemCoupon(user, dto) {
        return this.farmerPlansService.redeemCoupon(user, dto);
    }
    chooseAdvisor(user, dto) {
        return this.farmerPlansService.chooseAdvisor(user, dto.advisorId);
    }
    createCoupon(user, dto) {
        return this.farmerPlansService.createCoupon(user, dto);
    }
    generateOwnCoupon(user, dto) {
        return this.farmerPlansService.generateOwnCoupon(user, dto);
    }
    deactivateCoupon(id) {
        return this.farmerPlansService.deactivateCoupon(id);
    }
    listMineForAdvisor(user) {
        return this.farmerPlansService.listMineForAdvisor(user);
    }
    listMineForBusinessPartner(user) {
        return this.farmerPlansService.listMineForBusinessPartner(user);
    }
    getPricing() {
        return this.farmerPlansService.getPricing();
    }
    updatePricing(user, plan, dto) {
        return this.farmerPlansService.updatePricing(user, plan, dto);
    }
    deletePricing(user, id) {
        return this.farmerPlansService.deletePricing(user, id);
    }
    listAllCoupons() {
        return this.farmerPlansService.listAllCoupons();
    }
    getCouponFinancialSummary() {
        return this.farmerPlansService.getCouponFinancialSummary();
    }
    listAllFarmerPlans() {
        return this.farmerPlansService.listAllFarmerPlans();
    }
    applyCouponToFarmerDirectly(user, dto) {
        return this.farmerPlansService.applyCouponToFarmerDirectly(user, dto);
    }
    grantDaysDirectly(dto) {
        return this.farmerPlansService.grantDaysDirectly(dto);
    }
    getAdminDocsList() {
        return this.farmerPlansService.getAdminDocsList();
    }
    downloadAdminDocContent(docKey, lang) {
        return this.farmerPlansService.downloadAdminDocContent(docKey, lang || 'pa');
    }
};
exports.FarmerPlansController = FarmerPlansController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER),
    (0, common_1.Get)('my-plan'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FarmerPlansController.prototype, "getMyPlan", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADVISOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.BUSINESS_PARTNER),
    (0, common_1.Get)('coupon/:code/preview'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('code')),
    __param(2, (0, common_1.Query)('farmerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], FarmerPlansController.prototype, "previewCoupon", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADVISOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.BUSINESS_PARTNER),
    (0, common_1.Post)('redeem'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, redeem_farmer_plan_coupon_dto_1.RedeemFarmerPlanCouponDto]),
    __metadata("design:returntype", void 0)
], FarmerPlansController.prototype, "redeemCoupon", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER),
    (0, common_1.Post)('choose-advisor'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, choose_advisor_dto_1.ChooseAdvisorDto]),
    __metadata("design:returntype", void 0)
], FarmerPlansController.prototype, "chooseAdvisor", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('coupons'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_farmer_plan_coupon_dto_1.CreateFarmerPlanCouponDto]),
    __metadata("design:returntype", void 0)
], FarmerPlansController.prototype, "createCoupon", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR, client_1.Role.BUSINESS_PARTNER),
    (0, common_1.Post)('coupons/generate'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generate_advisor_coupon_dto_1.GenerateAdvisorCouponDto]),
    __metadata("design:returntype", void 0)
], FarmerPlansController.prototype, "generateOwnCoupon", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)('coupons/:id/deactivate'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FarmerPlansController.prototype, "deactivateCoupon", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Get)('coupons/mine'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FarmerPlansController.prototype, "listMineForAdvisor", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.BUSINESS_PARTNER),
    (0, common_1.Get)('coupons/mine-partner'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FarmerPlansController.prototype, "listMineForBusinessPartner", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR, client_1.Role.BUSINESS_PARTNER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.OPERATOR),
    (0, common_1.Get)('pricing'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FarmerPlansController.prototype, "getPricing", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)('pricing/:plan'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('plan')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_farmer_plan_pricing_dto_1.UpdateFarmerPlanPricingDto]),
    __metadata("design:returntype", void 0)
], FarmerPlansController.prototype, "updatePricing", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Delete)('pricing/item/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FarmerPlansController.prototype, "deletePricing", null);
__decorate([
    (0, common_1.UseGuards)(operator_permission_guard_1.OperatorPermissionGuard),
    (0, operator_permission_decorator_1.RequireOperatorPermission)(client_1.OperatorPermission.VIEW_FARMER_PLANS),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.OPERATOR),
    (0, common_1.Get)('coupons'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FarmerPlansController.prototype, "listAllCoupons", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN),
    (0, common_1.Get)('financial-summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FarmerPlansController.prototype, "getCouponFinancialSummary", null);
__decorate([
    (0, common_1.UseGuards)(operator_permission_guard_1.OperatorPermissionGuard),
    (0, operator_permission_decorator_1.RequireOperatorPermission)(client_1.OperatorPermission.VIEW_FARMER_PLANS),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.OPERATOR),
    (0, common_1.Get)('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FarmerPlansController.prototype, "listAllFarmerPlans", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.BUSINESS_PARTNER),
    (0, common_1.Post)('apply-direct'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, apply_coupon_to_farmer_dto_1.ApplyCouponToFarmerDto]),
    __metadata("design:returntype", void 0)
], FarmerPlansController.prototype, "applyCouponToFarmerDirectly", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('grant-days'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [grant_farmer_plan_days_dto_1.GrantFarmerPlanDaysDto]),
    __metadata("design:returntype", void 0)
], FarmerPlansController.prototype, "grantDaysDirectly", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR, client_1.Role.BUSINESS_PARTNER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.OPERATOR),
    (0, common_1.Get)('admin/docs/list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FarmerPlansController.prototype, "getAdminDocsList", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR, client_1.Role.BUSINESS_PARTNER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.OPERATOR),
    (0, common_1.Get)('admin/docs/download/:docKey'),
    __param(0, (0, common_1.Param)('docKey')),
    __param(1, (0, common_1.Query)('lang')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FarmerPlansController.prototype, "downloadAdminDocContent", null);
exports.FarmerPlansController = FarmerPlansController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('farmer-plans'),
    __metadata("design:paramtypes", [farmer_plans_service_1.FarmerPlansService])
], FarmerPlansController);
//# sourceMappingURL=farmer-plans.controller.js.map