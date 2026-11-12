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
const tax_compliance_util_1 = require("../../../common/utils/tax-compliance.util");
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
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '15-character GSTIN (if GST registered)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(tax_compliance_util_1.GSTIN_REGEX, { message: 'GSTIN must be a valid 15-character GSTIN.' }),
    __metadata("design:type", String)
], RegisterTraderDto.prototype, "gstin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '10-character PAN for TDS Sec 194H/194Q/194O compliance' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(tax_compliance_util_1.PAN_REGEX, { message: 'PAN must be a valid 10-character PAN.' }),
    __metadata("design:type", String)
], RegisterTraderDto.prototype, "panNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'APMC / State Mandi Trader License Number' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterTraderDto.prototype, "mandiLicenseNo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Last 4 digits of Aadhaar for KYC verification' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(tax_compliance_util_1.AADHAAR_LAST4_REGEX, { message: 'Aadhaar last 4 digits must be numeric.' }),
    __metadata("design:type", String)
], RegisterTraderDto.prototype, "aadhaarLast4", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Terms & Privacy acceptance consent' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RegisterTraderDto.prototype, "termsAccepted", void 0);
//# sourceMappingURL=register-trader.dto.js.map