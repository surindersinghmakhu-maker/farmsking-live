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
exports.CreateNurseryBatchDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateNurseryBatchDto {
}
exports.CreateNurseryBatchDto = CreateNurseryBatchDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Optional Plot ID if linked to on-farm plot' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNurseryBatchDto.prototype, "plotId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.NurseryCategoryType, default: client_1.NurseryCategoryType.FLOWER_PLUG_EXPRESS }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(client_1.NurseryCategoryType),
    __metadata("design:type", String)
], CreateNurseryBatchDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Plant variety name e.g. Marigold Calcutta, Seminis Tomato, PR-126' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNurseryBatchDto.prototype, "varietyName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Date seed was sown (ISO format, optional for ready stock)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateNurseryBatchDto.prototype, "sowingDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Date seedlings become ready for transplanting (ISO format, optional)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateNurseryBatchDto.prototype, "readyDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Latest safe uprooting/dispatch date (ISO format, optional)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateNurseryBatchDto.prototype, "uprootingDeadline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Photo URL of certified seed tag / bill' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNurseryBatchDto.prototype, "seedTagPhotoUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateNurseryBatchDto.prototype, "isSeedCertified", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Batch sowing verification photo URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNurseryBatchDto.prototype, "sowingPhotoUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Batch uprooting readiness photo URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNurseryBatchDto.prototype, "uprootingPhotoUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tray cavities count (50, 104, 128) for flower/veg plugs', default: 104 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateNurseryBatchDto.prototype, "trayCavityCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Guaranteed bundles per acre for paddy', default: 300 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateNurseryBatchDto.prototype, "guaranteedBundlesPerAcre", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Price per unit (per Tray for plugs, or per Acre for paddy)' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateNurseryBatchDto.prototype, "pricePerUnit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Estimated batch capacity (in Trays or Acres)' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateNurseryBatchDto.prototype, "estimatedCapacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Minimum order amount guard in INR', default: 2000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(2000),
    __metadata("design:type", Number)
], CreateNurseryBatchDto.prototype, "minOrderAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.DeliveryPricingType, default: client_1.DeliveryPricingType.INCLUDED }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.DeliveryPricingType),
    __metadata("design:type", String)
], CreateNurseryBatchDto.prototype, "deliveryPricingType", void 0);
//# sourceMappingURL=create-nursery-batch.dto.js.map