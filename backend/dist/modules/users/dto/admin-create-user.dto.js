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
exports.AdminCreateUserDto = exports.AdminCreateVerifyOtpDto = exports.AdminCreateSendOtpDto = exports.ADMIN_CREATE_ROLES = exports.ADMIN_CREATE_CATEGORIES = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
exports.ADMIN_CREATE_CATEGORIES = ['STAFF', 'PARTNERS', 'CLIENTS'];
exports.ADMIN_CREATE_ROLES = [
    'ADMIN',
    'MANAGER',
    'OPERATOR',
    'TECHNICAL_TRAINER',
    'ACCOUNTANT',
    'AGENT',
    'SELLER',
    'FARM_ADVISOR',
    'GARDEN_ADVISOR',
    'TRADER',
    'FARMER',
    'GARDENER',
    'CUSTOMER',
    'SUPERVISOR',
];
class AdminCreateSendOtpDto {
}
exports.AdminCreateSendOtpDto = AdminCreateSendOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '10-digit Indian mobile number to verify before onboarding' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Mobile number is required.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCreateSendOtpDto.prototype, "mobile", void 0);
class AdminCreateVerifyOtpDto {
}
exports.AdminCreateVerifyOtpDto = AdminCreateVerifyOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '10-digit Indian mobile number' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Mobile number is required.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCreateVerifyOtpDto.prototype, "mobile", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '6-digit verification OTP' }),
    (0, class_validator_1.IsNotEmpty)({ message: '6-digit OTP is required.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCreateVerifyOtpDto.prototype, "otp", void 0);
class AdminCreateUserDto {
}
exports.AdminCreateUserDto = AdminCreateUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Signed server OTP verification token returned by verify-otp' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Mobile OTP verification is required before creating an account.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "otpVerificationToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: exports.ADMIN_CREATE_CATEGORIES }),
    (0, class_validator_1.IsIn)(exports.ADMIN_CREATE_CATEGORIES, { message: 'Category must be STAFF, PARTNERS, or CLIENTS.' }),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: exports.ADMIN_CREATE_ROLES }),
    (0, class_validator_1.IsIn)(exports.ADMIN_CREATE_ROLES, { message: 'Invalid role selected for user creation.' }),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '10-digit verified mobile number' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Mobile number is required.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "mobile", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Full name of the user' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Full name is required.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v !== undefined && v !== null && String(v).trim() !== ''),
    (0, class_validator_1.IsEmail)({}, { message: 'Please enter a valid email address.' }),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Optional initial password (auto-generated for Staff if omitted)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v !== undefined && v !== null && String(v).trim() !== ''),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6, { message: 'Password must be at least 6 characters.' }),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v !== undefined && v !== null && String(v).trim() !== ''),
    (0, class_validator_1.Matches)(/^\d{6}$/, { message: 'PIN code must be exactly 6 digits.' }),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "pincode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "postOffice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "village", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "district", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsIn)([15, 20, 25]),
    __metadata("design:type", Number)
], AdminCreateUserDto.prototype, "sprayTankSizeL", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.SoilType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SoilType),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "soilType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.WaterType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.WaterType),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "waterType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "farmName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "specialization", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "qualification", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(70),
    __metadata("design:type", Number)
], AdminCreateUserDto.prototype, "yearsExperience", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(25000),
    __metadata("design:type", Number)
], AdminCreateUserDto.prototype, "doctorConsultationFee", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v !== undefined && v !== null && String(v).trim() !== ''),
    (0, class_validator_1.Matches)(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, { message: 'Invalid PAN format (e.g. ABCDE1234F).' }),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "panNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "upiId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "alternativeMobile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "bankAccountHolderName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "bankAccountNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v !== undefined && v !== null && String(v).trim() !== ''),
    (0, class_validator_1.Matches)(/^[A-Z]{4}0[A-Z0-9]{6}$/i, { message: 'Invalid 11-character IFSC code.' }),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "bankIfsc", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "storeName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.SellerType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SellerType),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "sellerType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "gstin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Employer Farmer King ID or 10-digit mobile number' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "employerFarmerKingIdOrMobile", void 0);
//# sourceMappingURL=admin-create-user.dto.js.map