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
exports.SendMobileLinkOtpDto = exports.SendEmailOtpDto = exports.SendWhatsAppOtpDto = exports.VerifyLoginOtpDto = exports.SendLoginOtpDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class SendLoginOtpDto {
}
exports.SendLoginOtpDto = SendLoginOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '10-digit mobile number' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendLoginOtpDto.prototype, "mobile", void 0);
class VerifyLoginOtpDto {
}
exports.VerifyLoginOtpDto = VerifyLoginOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '10-digit mobile number' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyLoginOtpDto.prototype, "mobile", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '6-digit OTP code' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyLoginOtpDto.prototype, "otp", void 0);
class SendWhatsAppOtpDto {
}
exports.SendWhatsAppOtpDto = SendWhatsAppOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '10-digit mobile number' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendWhatsAppOtpDto.prototype, "mobile", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'OTP code' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendWhatsAppOtpDto.prototype, "otp", void 0);
class SendEmailOtpDto {
}
exports.SendEmailOtpDto = SendEmailOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Email address' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendEmailOtpDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'OTP code' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendEmailOtpDto.prototype, "otp", void 0);
class SendMobileLinkOtpDto {
}
exports.SendMobileLinkOtpDto = SendMobileLinkOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '10-digit mobile number' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendMobileLinkOtpDto.prototype, "mobile", void 0);
//# sourceMappingURL=otp.dto.js.map