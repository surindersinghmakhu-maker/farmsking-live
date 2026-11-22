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
exports.DoctorConsultationNoteDto = exports.PrescribePlantCareDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class PrescribePlantCareDto {
}
exports.PrescribePlantCareDto = PrescribePlantCareDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PrescribePlantCareDto.prototype, "gardenerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PrescribePlantCareDto.prototype, "plantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PrescribePlantCareDto.prototype, "gardenId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.PlantCareType),
    __metadata("design:type", String)
], PrescribePlantCareDto.prototype, "careType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], PrescribePlantCareDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PrescribePlantCareDto.prototype, "instructions", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PrescribePlantCareDto.prototype, "intervalDays", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PrescribePlantCareDto.prototype, "nextDueDate", void 0);
class DoctorConsultationNoteDto {
}
exports.DoctorConsultationNoteDto = DoctorConsultationNoteDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DoctorConsultationNoteDto.prototype, "gardenerId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DoctorConsultationNoteDto.prototype, "plantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], DoctorConsultationNoteDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DoctorConsultationNoteDto.prototype, "conditionStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DoctorConsultationNoteDto.prototype, "photoUrl", void 0);
//# sourceMappingURL=prescribe-plant-care.dto.js.map