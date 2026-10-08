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
exports.CashfreeController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const cashfree_service_1 = require("./cashfree.service");
const cashfree_dto_1 = require("./dto/cashfree.dto");
let CashfreeController = class CashfreeController {
    constructor(cashfreeService) {
        this.cashfreeService = cashfreeService;
    }
    createVendor(dto) {
        return this.cashfreeService.createVendorOnCashfree(dto);
    }
    createSplitOrder(dto) {
        return this.cashfreeService.createSplitOrder(dto);
    }
    createOrder(user, dto) {
        return this.cashfreeService.createStandardOrder({
            orderId: dto.orderId,
            amount: dto.amount,
            customerId: user.id,
            customerPhone: dto.customerPhone || user.mobile,
            customerName: dto.customerName || user.name,
        });
    }
    verifyPayment(orderId) {
        return this.cashfreeService.verifyPayment(orderId);
    }
    handleWebhook(body) {
        return this.cashfreeService.handleWebhook(body);
    }
};
exports.CashfreeController = CashfreeController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('vendors'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cashfree_dto_1.CreateCashfreeVendorDto]),
    __metadata("design:returntype", void 0)
], CashfreeController.prototype, "createVendor", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('orders/split'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cashfree_dto_1.CreateSplitOrderDto]),
    __metadata("design:returntype", void 0)
], CashfreeController.prototype, "createSplitOrder", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('orders/create'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CashfreeController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Get)('orders/:orderId/verify'),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CashfreeController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CashfreeController.prototype, "handleWebhook", null);
exports.CashfreeController = CashfreeController = __decorate([
    (0, common_1.Controller)('cashfree'),
    __metadata("design:paramtypes", [cashfree_service_1.CashfreeService])
], CashfreeController);
//# sourceMappingURL=cashfree.controller.js.map