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
exports.UpdateComplianceRecordDto = exports.CreateComplianceRecordDto = exports.COMPLIANCE_STATUSES = exports.COMPLIANCE_CATEGORIES = void 0;
const class_validator_1 = require("class-validator");
exports.COMPLIANCE_CATEGORIES = [
    'MCA_ROC',
    'GST',
    'INCOME_TAX_TDS',
    'AGRI_LICENSE',
    'PAYMENT_GATEWAY',
    'LEGAL_NOTICE',
    'AGREEMENT',
];
exports.COMPLIANCE_STATUSES = [
    'PENDING',
    'IN_PROGRESS',
    'COMPLIANT',
    'OVERDUE',
];
class CreateComplianceRecordDto {
}
exports.CreateComplianceRecordDto = CreateComplianceRecordDto;
__decorate([
    (0, class_validator_1.IsIn)(exports.COMPLIANCE_CATEGORIES),
    __metadata("design:type", Object)
], CreateComplianceRecordDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], CreateComplianceRecordDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateComplianceRecordDto.prototype, "authority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateComplianceRecordDto.prototype, "referenceNo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateComplianceRecordDto.prototype, "dueDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateComplianceRecordDto.prototype, "filedDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(exports.COMPLIANCE_STATUSES),
    __metadata("design:type", Object)
], CreateComplianceRecordDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['ADVOCATE', 'CA', 'ACCOUNTANT', 'DIRECTOR']),
    __metadata("design:type", String)
], CreateComplianceRecordDto.prototype, "assignedTo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateComplianceRecordDto.prototype, "documentUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateComplianceRecordDto.prototype, "notes", void 0);
class UpdateComplianceRecordDto {
}
exports.UpdateComplianceRecordDto = UpdateComplianceRecordDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(exports.COMPLIANCE_CATEGORIES),
    __metadata("design:type", Object)
], UpdateComplianceRecordDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], UpdateComplianceRecordDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateComplianceRecordDto.prototype, "authority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateComplianceRecordDto.prototype, "referenceNo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateComplianceRecordDto.prototype, "dueDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateComplianceRecordDto.prototype, "filedDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(exports.COMPLIANCE_STATUSES),
    __metadata("design:type", Object)
], UpdateComplianceRecordDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['ADVOCATE', 'CA', 'ACCOUNTANT', 'DIRECTOR']),
    __metadata("design:type", String)
], UpdateComplianceRecordDto.prototype, "assignedTo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateComplianceRecordDto.prototype, "documentUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], UpdateComplianceRecordDto.prototype, "notes", void 0);
//# sourceMappingURL=compliance-record.dto.js.map