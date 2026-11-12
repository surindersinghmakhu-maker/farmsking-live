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
exports.UpdateVerifiedLeadNotesDto = exports.ConvertVerifiedLeadDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const ALLOWED_TANK_SIZES = [15, 20, 25];
class ConvertVerifiedLeadDto {
}
exports.ConvertVerifiedLeadDto = ConvertVerifiedLeadDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Full name for the new FarmsKing account' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Full name is required to activate the user account.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], ConvertVerifiedLeadDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Account role', enum: ['CUSTOMER', 'FARMER', 'GARDENER'] }),
    (0, class_validator_1.IsIn)(['CUSTOMER', 'FARMER', 'GARDENER'], { message: 'Role must be CUSTOMER, FARMER, or GARDENER.' }),
    __metadata("design:type", String)
], ConvertVerifiedLeadDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '6-digit Indian PIN code' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v !== undefined && v !== null && String(v).trim() !== ''),
    (0, class_validator_1.Matches)(/^\d{6}$/, { message: 'PIN code must be exactly 6 digits.' }),
    __metadata("design:type", String)
], ConvertVerifiedLeadDto.prototype, "pincode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Post office name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConvertVerifiedLeadDto.prototype, "postOffice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Village / Town name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConvertVerifiedLeadDto.prototype, "village", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'District name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConvertVerifiedLeadDto.prototype, "district", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'State name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConvertVerifiedLeadDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Optional email address' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v !== undefined && v !== null && String(v).trim() !== ''),
    (0, class_validator_1.IsEmail)({}, { message: 'Please enter a valid email address.' }),
    __metadata("design:type", String)
], ConvertVerifiedLeadDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Farmer spray tank size in Liters (15, 20, or 25)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsIn)(ALLOWED_TANK_SIZES),
    __metadata("design:type", Number)
], ConvertVerifiedLeadDto.prototype, "sprayTankSizeL", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.SoilType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SoilType),
    __metadata("design:type", String)
], ConvertVerifiedLeadDto.prototype, "soilType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.WaterType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.WaterType),
    __metadata("design:type", String)
], ConvertVerifiedLeadDto.prototype, "waterType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Optional referral code or King ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConvertVerifiedLeadDto.prototype, "referralCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Admin follow-up call notes' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], ConvertVerifiedLeadDto.prototype, "adminNotes", void 0);
class UpdateVerifiedLeadNotesDto {
}
exports.UpdateVerifiedLeadNotesDto = UpdateVerifiedLeadNotesDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Follow-up notes recorded by Admin' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], UpdateVerifiedLeadNotesDto.prototype, "adminNotes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Caller / user full name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateVerifiedLeadNotesDto.prototype, "capturedName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Email address' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v !== undefined && v !== null && String(v).trim() !== ''),
    (0, class_validator_1.IsEmail)({}, { message: 'Please enter a valid email address.' }),
    __metadata("design:type", String)
], UpdateVerifiedLeadNotesDto.prototype, "capturedEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '6-digit Indian PIN code' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v !== undefined && v !== null && String(v).trim() !== ''),
    (0, class_validator_1.Matches)(/^\d{6}$/, { message: 'PIN code must be exactly 6 digits.' }),
    __metadata("design:type", String)
], UpdateVerifiedLeadNotesDto.prototype, "pincode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVerifiedLeadNotesDto.prototype, "district", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVerifiedLeadNotesDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVerifiedLeadNotesDto.prototype, "village", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['CUSTOMER', 'FARMER', 'GARDENER', 'ADVISOR', 'AGENT', 'SELLER', 'TRADER'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['CUSTOMER', 'FARMER', 'GARDENER', 'ADVISOR', 'AGENT', 'SELLER', 'TRADER']),
    __metadata("design:type", String)
], UpdateVerifiedLeadNotesDto.prototype, "intendedRole", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['OTP_CONFIRMED', 'DISMISSED'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['OTP_CONFIRMED', 'DISMISSED']),
    __metadata("design:type", String)
], UpdateVerifiedLeadNotesDto.prototype, "status", void 0);
//# sourceMappingURL=convert-verified-lead.dto.js.map