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
exports.ConfirmDeliveryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class ConfirmDeliveryDto {
}
exports.ConfirmDeliveryDto = ConfirmDeliveryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '4-digit delivery verification OTP' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(4, 4, { message: 'Delivery OTP must be exactly 4 digits.' }),
    __metadata("design:type", String)
], ConfirmDeliveryDto.prototype, "deliveryOtp", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Delivery service star rating (1-5)', default: 5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], ConfirmDeliveryDto.prototype, "deliveryRating", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Plant & root quality star rating (1-5)', default: 5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], ConfirmDeliveryDto.prototype, "plantQualityRating", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Review feedback comments' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmDeliveryDto.prototype, "reviewText", void 0);
//# sourceMappingURL=confirm-delivery.dto.js.map