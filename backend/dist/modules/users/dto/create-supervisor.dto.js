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
exports.CreateSupervisorDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const is_indian_mobile_validator_1 = require("../../../common/validators/is-indian-mobile.validator");
class CreateSupervisorDto {
}
exports.CreateSupervisorDto = CreateSupervisorDto;
__decorate([
    (0, is_indian_mobile_validator_1.IsIndianMobile)(),
    __metadata("design:type", String)
], CreateSupervisorDto.prototype, "mobile", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateSupervisorDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupervisorDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(client_1.SupervisorPermission, { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateSupervisorDto.prototype, "permissions", void 0);
//# sourceMappingURL=create-supervisor.dto.js.map