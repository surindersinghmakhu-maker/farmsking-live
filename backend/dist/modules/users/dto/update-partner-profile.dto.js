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
exports.UpdatePartnerProfileDto = void 0;
const class_validator_1 = require("class-validator");
const is_indian_mobile_validator_1 = require("../../../common/validators/is-indian-mobile.validator");
class UpdatePartnerProfileDto {
    email;
    alternativeMobile;
    panNumber;
    upiId;
    bankAccountNumber;
    bankIfsc;
    bankAccountHolderName;
}
exports.UpdatePartnerProfileDto = UpdatePartnerProfileDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdatePartnerProfileDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, is_indian_mobile_validator_1.IsIndianMobile)(),
    __metadata("design:type", String)
], UpdatePartnerProfileDto.prototype, "alternativeMobile", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^[A-Z]{5}[0-9]{4}[A-Z]$/, { message: 'PAN must be a valid 10-character PAN (e.g. ABCDE1234F).' }),
    __metadata("design:type", String)
], UpdatePartnerProfileDto.prototype, "panNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^[\w.\-]+@[\w.\-]+$/, { message: 'Enter a valid UPI ID (e.g. name@bank).' }),
    __metadata("design:type", String)
], UpdatePartnerProfileDto.prototype, "upiId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePartnerProfileDto.prototype, "bankAccountNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Enter a valid 11-character IFSC code.' }),
    __metadata("design:type", String)
], UpdatePartnerProfileDto.prototype, "bankIfsc", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePartnerProfileDto.prototype, "bankAccountHolderName", void 0);
//# sourceMappingURL=update-partner-profile.dto.js.map