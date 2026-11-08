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
exports.RazorpayController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const razorpay_service_1 = require("./razorpay.service");
const razorpay_dto_1 = require("./dto/razorpay.dto");
let RazorpayController = class RazorpayController {
    constructor(razorpayService) {
        this.razorpayService = razorpayService;
    }
    createOrder(user, dto) {
        return this.razorpayService.createStandardOrder({
            ...dto,
            customerId: dto.customerId || user.id,
            customerPhone: dto.customerPhone || user.mobile,
            customerName: dto.customerName || user.name,
        });
    }
    createSubscription(user, dto) {
        return this.razorpayService.createSubscription({
            ...dto,
            customerId: dto.customerId || user.id,
            customerPhone: dto.customerPhone || user.mobile,
            customerEmail: dto.customerEmail || user.email || undefined,
            customerName: dto.customerName || user.name,
        });
    }
    verifyPayment(dto) {
        return this.razorpayService.verifyPayment(dto);
    }
    handleWebhook(body, signature) {
        return this.razorpayService.handleWebhook(body, signature);
    }
};
exports.RazorpayController = RazorpayController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('orders/create'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, razorpay_dto_1.CreateRazorpayOrderDto]),
    __metadata("design:returntype", void 0)
], RazorpayController.prototype, "createOrder", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('subscriptions/create'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, razorpay_dto_1.CreateRazorpaySubscriptionDto]),
    __metadata("design:returntype", void 0)
], RazorpayController.prototype, "createSubscription", null);
__decorate([
    (0, common_1.Post)('verify'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [razorpay_dto_1.VerifyRazorpayPaymentDto]),
    __metadata("design:returntype", void 0)
], RazorpayController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-razorpay-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RazorpayController.prototype, "handleWebhook", null);
exports.RazorpayController = RazorpayController = __decorate([
    (0, common_1.Controller)('razorpay'),
    __metadata("design:paramtypes", [razorpay_service_1.RazorpayService])
], RazorpayController);
//# sourceMappingURL=razorpay.controller.js.map