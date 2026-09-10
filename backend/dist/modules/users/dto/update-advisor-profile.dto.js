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
exports.UpdateAdvisorProfileDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const is_indian_mobile_validator_1 = require("../../../common/validators/is-indian-mobile.validator");
class UpdateAdvisorProfileDto {
    photoUrl;
    pincode;
    postOffice;
    specialization;
    bio;
    yearsExperience;
    email;
    village;
    district;
    state;
    advisorType;
    notificationsEnabled;
    qualification;
    profileTitle;
    alternativeMobile;
    panNumber;
    upiId;
    bankAccountNumber;
    bankIfsc;
    bankAccountHolderName;
}
exports.UpdateAdvisorProfileDto = UpdateAdvisorProfileDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdvisorProfileDto.prototype, "photoUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^\d{6}$/, { message: 'PIN code must be exactly 6 digits.' }),
    __metadata("design:type", String)
], UpdateAdvisorProfileDto.prototype, "pincode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdvisorProfileDto.prototype, "postOffice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdvisorProfileDto.prototype, "specialization", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdvisorProfileDto.prototype, "bio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateAdvisorProfileDto.prototype, "yearsExperience", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateAdvisorProfileDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdvisorProfileDto.prototype, "village", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdvisorProfileDto.prototype, "district", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdvisorProfileDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['FARM', 'GARDEN']),
    __metadata("design:type", String)
], UpdateAdvisorProfileDto.prototype, "advisorType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateAdvisorProfileDto.prototype, "notificationsEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdvisorProfileDto.prototype, "qualification", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdvisorProfileDto.prototype, "profileTitle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, is_indian_mobile_validator_1.IsIndianMobile)(),
    __metadata("design:type", String)
], UpdateAdvisorProfileDto.prototype, "alternativeMobile", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^[A-Z]{5}[0-9]{4}[A-Z]$/, { message: 'PAN must be a valid 10-character PAN (e.g. ABCDE1234F).' }),
    __metadata("design:type", String)
], UpdateAdvisorProfileDto.prototype, "panNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^[\w.\-]+@[\w.\-]+$/, { message: 'Enter a valid UPI ID (e.g. name@bank).' }),
    __metadata("design:type", String)
], UpdateAdvisorProfileDto.prototype, "upiId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdvisorProfileDto.prototype, "bankAccountNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Enter a valid 11-character IFSC code.' }),
    __metadata("design:type", String)
], UpdateAdvisorProfileDto.prototype, "bankIfsc", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdvisorProfileDto.prototype, "bankAccountHolderName", void 0);
//# sourceMappingURL=update-advisor-profile.dto.js.map