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
exports.RegisterTraderDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const is_indian_mobile_validator_1 = require("../../../common/validators/is-indian-mobile.validator");
class RegisterTraderDto {
}
exports.RegisterTraderDto = RegisterTraderDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '10-digit Indian mobile number of the trader/shopkeeper',
        example: '9876543210',
        required: true,
    }),
    (0, is_indian_mobile_validator_1.IsIndianMobile)(),
    __metadata("design:type", String)
], RegisterTraderDto.prototype, "mobile", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account password (minimum 6 characters)',
        example: 'StrongPass@2026',
        minLength: 6,
        required: true,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], RegisterTraderDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Full name of the trader or shop proprietor',
        example: 'Gurpreet Singh',
        minLength: 2,
        required: true,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], RegisterTraderDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Name of the trading shop or grain enterprise',
        example: 'Singh Grain Traders',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterTraderDto.prototype, "shopName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Associated APMC Mandi or grain market name',
        example: 'Makhu Grain Market',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterTraderDto.prototype, "mandiName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'District of operation',
        example: 'Ferozepur',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterTraderDto.prototype, "district", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'State of operation',
        example: 'Punjab',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterTraderDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Firebase ID Token from phone auth OTP verification',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterTraderDto.prototype, "firebaseIdToken", void 0);
//# sourceMappingURL=register-trader.dto.js.map