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
exports.CouponsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const operator_permission_guard_1 = require("../../common/guards/operator-permission.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const operator_permission_decorator_1 = require("../../common/decorators/operator-permission.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const coupons_service_1 = require("./coupons.service");
const create_coupon_dto_1 = require("./dto/create-coupon.dto");
const update_coupon_dto_1 = require("./dto/update-coupon.dto");
const redeem_coupon_dto_1 = require("./dto/redeem-coupon.dto");
const issue_partner_coupon_dto_1 = require("./dto/issue-partner-coupon.dto");
let CouponsController = class CouponsController {
    couponsService;
    constructor(couponsService) {
        this.couponsService = couponsService;
    }
    create(user, dto) {
        return this.couponsService.create(user, dto);
    }
    issuePartnerCoupon(user, dto) {
        return this.couponsService.issuePartnerCoupon(user, dto);
    }
    listAll() {
        return this.couponsService.listAll();
    }
    listMine(user) {
        return this.couponsService.listMine(user);
    }
    update(id, dto) {
        return this.couponsService.update(id, dto);
    }
    remove(id) {
        return this.couponsService.remove(id);
    }
    getRedemptions(user, id) {
        return this.couponsService.getRedemptions(user, id);
    }
    redeem(user, code, dto) {
        return this.couponsService.redeem(user, code, dto);
    }
    preview(code, amount) {
        const orderAmount = Number(amount);
        if (!amount || Number.isNaN(orderAmount) || orderAmount <= 0) {
            throw new common_1.BadRequestException('A valid order amount is required.');
        }
        return this.couponsService.previewForOrder(code, orderAmount);
    }
};
exports.CouponsController = CouponsController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_coupon_dto_1.CreateCouponDto]),
    __metadata("design:returntype", void 0)
], CouponsController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('issue-partner-coupon'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, issue_partner_coupon_dto_1.IssuePartnerCouponDto]),
    __metadata("design:returntype", void 0)
], CouponsController.prototype, "issuePartnerCoupon", null);
__decorate([
    (0, common_1.UseGuards)(operator_permission_guard_1.OperatorPermissionGuard),
    (0, operator_permission_decorator_1.RequireOperatorPermission)(client_1.OperatorPermission.VIEW_COUPONS),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.OPERATOR),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CouponsController.prototype, "listAll", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.BUSINESS_PARTNER, client_1.Role.ADVISOR),
    (0, common_1.Get)('mine'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CouponsController.prototype, "listMine", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_coupon_dto_1.UpdateCouponDto]),
    __metadata("design:returntype", void 0)
], CouponsController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)(':id/remove'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CouponsController.prototype, "remove", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.BUSINESS_PARTNER, client_1.Role.ADVISOR),
    (0, common_1.Get)(':id/redemptions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CouponsController.prototype, "getRedemptions", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR),
    (0, common_1.Post)(':code/redeem'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('code')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, redeem_coupon_dto_1.RedeemCouponDto]),
    __metadata("design:returntype", void 0)
], CouponsController.prototype, "redeem", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR),
    (0, common_1.Get)(':code/preview'),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Query)('amount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CouponsController.prototype, "preview", null);
exports.CouponsController = CouponsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('coupons'),
    __metadata("design:paramtypes", [coupons_service_1.CouponsService])
], CouponsController);
//# sourceMappingURL=coupons.controller.js.map