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
exports.RespondSupervisorRequestDto = exports.AppointSupervisorRequestDto = exports.SupervisorFeaturesConfigDto = exports.FeaturePermissionDto = void 0;
const class_validator_1 = require("class-validator");
class FeaturePermissionDto {
}
exports.FeaturePermissionDto = FeaturePermissionDto;
class SupervisorFeaturesConfigDto {
}
exports.SupervisorFeaturesConfigDto = SupervisorFeaturesConfigDto;
class AppointSupervisorRequestDto {
}
exports.AppointSupervisorRequestDto = AppointSupervisorRequestDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AppointSupervisorRequestDto.prototype, "supervisorKingId", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", SupervisorFeaturesConfigDto)
], AppointSupervisorRequestDto.prototype, "featuresConfig", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AppointSupervisorRequestDto.prototype, "note", void 0);
class RespondSupervisorRequestDto {
}
exports.RespondSupervisorRequestDto = RespondSupervisorRequestDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RespondSupervisorRequestDto.prototype, "action", void 0);
//# sourceMappingURL=appoint-supervisor-request.dto.js.map