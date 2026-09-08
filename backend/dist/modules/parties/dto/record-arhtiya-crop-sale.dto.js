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
exports.RecordArhtiyaCropSaleDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class RecordArhtiyaCropSaleDto {
    partyId;
    cropName;
    cropCycleId;
    inputUnit;
    inputQuantity;
    ratePerQuintal;
    transactionDate;
    commissionPercent;
    otherCharges;
    jFormNumber;
    jFormDate;
    jFormPhotoUrl;
    notes;
}
exports.RecordArhtiyaCropSaleDto = RecordArhtiyaCropSaleDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordArhtiyaCropSaleDto.prototype, "partyId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordArhtiyaCropSaleDto.prototype, "cropName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RecordArhtiyaCropSaleDto.prototype, "cropCycleId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.MandiUnit),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RecordArhtiyaCropSaleDto.prototype, "inputUnit", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], RecordArhtiyaCropSaleDto.prototype, "inputQuantity", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RecordArhtiyaCropSaleDto.prototype, "ratePerQuintal", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], RecordArhtiyaCropSaleDto.prototype, "transactionDate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RecordArhtiyaCropSaleDto.prototype, "commissionPercent", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RecordArhtiyaCropSaleDto.prototype, "otherCharges", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RecordArhtiyaCropSaleDto.prototype, "jFormNumber", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RecordArhtiyaCropSaleDto.prototype, "jFormDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RecordArhtiyaCropSaleDto.prototype, "jFormPhotoUrl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RecordArhtiyaCropSaleDto.prototype, "notes", void 0);
//# sourceMappingURL=record-arhtiya-crop-sale.dto.js.map