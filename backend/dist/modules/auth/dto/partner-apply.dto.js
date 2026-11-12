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
exports.PartnerApplyDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class PartnerApplyDto {
}
exports.PartnerApplyDto = PartnerApplyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '10-digit Indian mobile number' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\+?\d{10,15}$/, { message: 'Valid 10-digit mobile number is required.' }),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "mobile", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['AGENT', 'ADVISOR', 'SELLER'] }),
    (0, class_validator_1.IsIn)(['AGENT', 'ADVISOR', 'SELLER']),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "requestedRole", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.AdvisorType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.AdvisorType),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "advisorType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Applicant full legal name' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'Please enter a valid email address.' }),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Partner portal password (minimum 8 characters)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "pincode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "postOffice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "village", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "district", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "qualification", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "specialization", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PartnerApplyDto.prototype, "yearsExperience", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '10-character PAN number' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "panNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Uploaded PAN card document URL' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "panDocUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last 4 digits of Aadhaar' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "aadhaarLast4", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Uploaded Aadhaar front document URL' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "aadhaarDocUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Uploaded Aadhaar back document URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "aadhaarBackUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '15-character GSTIN (mandatory for Commercial Sellers)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "gstin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'GST Certificate document URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "gstDocUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Bank account holder legal name' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "bankAccountHolderName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Bank account number' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "bankAccountNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '11-character bank IFSC code' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "bankIfsc", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "upiId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cancelled cheque or bank passbook copy URL' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "chequeDocUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Passport-size profile photo URL' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "photoUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Store display name (for SELLER applications)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "storeName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Legal business/firm name (for SELLER applications)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "legalName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.SellerType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SellerType),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "sellerType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Warehouse / shop pickup address (for SELLER applications)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "pickupAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Acceptance of FarmsKing Partner & TDS statutory terms' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PartnerApplyDto.prototype, "termsAccepted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Optional Firebase phone verification ID token' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerApplyDto.prototype, "firebaseIdToken", void 0);
//# sourceMappingURL=partner-apply.dto.js.map