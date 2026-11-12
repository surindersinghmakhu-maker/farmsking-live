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
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
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
    createSubscription(user, dto) {
        return this.cashfreeService.createSubscription({
            subscriptionId: dto.subscriptionId,
            planName: dto.planName,
            amount: dto.amount,
            intervalType: dto.intervalType || 'MONTH',
            customerId: user.id,
            customerPhone: dto.customerPhone || user.mobile,
            customerEmail: dto.customerEmail || user.email || undefined,
            customerName: dto.customerName || user.name,
        });
    }
    verifyPayment(user, orderId) {
        return this.cashfreeService.verifyPayment(orderId, user);
    }
    handleWebhook(req, body, signature, timestamp) {
        const rawBody = req.rawBody
            ? Buffer.isBuffer(req.rawBody)
                ? req.rawBody.toString('utf8')
                : String(req.rawBody)
            : undefined;
        return this.cashfreeService.handleWebhook(body, signature, timestamp, rawBody);
    }
};
exports.CashfreeController = CashfreeController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('vendors'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cashfree_dto_1.CreateCashfreeVendorDto]),
    __metadata("design:returntype", void 0)
], CashfreeController.prototype, "createVendor", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
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
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('subscriptions/create'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CashfreeController.prototype, "createSubscription", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('orders/:orderId/verify'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CashfreeController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-webhook-signature')),
    __param(3, (0, common_1.Headers)('x-webhook-timestamp')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", void 0)
], CashfreeController.prototype, "handleWebhook", null);
exports.CashfreeController = CashfreeController = __decorate([
    (0, common_1.Controller)('cashfree'),
    __metadata("design:paramtypes", [cashfree_service_1.CashfreeService])
], CashfreeController);
//# sourceMappingURL=cashfree.controller.js.map