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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyRazorpayPaymentDto = exports.CreateRazorpaySubscriptionDto = exports.CreateRazorpayOrderDto = void 0;
const class_validator_1 = require("class-validator");
class CreateRazorpayOrderDto {
}
exports.CreateRazorpayOrderDto = CreateRazorpayOrderDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRazorpayOrderDto.prototype, "orderId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRazorpayOrderDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRazorpayOrderDto.prototype, "customerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRazorpayOrderDto.prototype, "customerPhone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRazorpayOrderDto.prototype, "customerName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateRazorpayOrderDto.prototype, "notes", void 0);
class CreateRazorpaySubscriptionDto {
}
exports.CreateRazorpaySubscriptionDto = CreateRazorpaySubscriptionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRazorpaySubscriptionDto.prototype, "planName", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRazorpaySubscriptionDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRazorpaySubscriptionDto.prototype, "intervalType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRazorpaySubscriptionDto.prototype, "totalCount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRazorpaySubscriptionDto.prototype, "customerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRazorpaySubscriptionDto.prototype, "customerPhone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRazorpaySubscriptionDto.prototype, "customerEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRazorpaySubscriptionDto.prototype, "customerName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateRazorpaySubscriptionDto.prototype, "notes", void 0);
class VerifyRazorpayPaymentDto {
}
exports.VerifyRazorpayPaymentDto = VerifyRazorpayPaymentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyRazorpayPaymentDto.prototype, "razorpayOrderId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyRazorpayPaymentDto.prototype, "razorpayPaymentId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyRazorpayPaymentDto.prototype, "razorpaySignature", void 0);
//# sourceMappingURL=razorpay.dto.js.map