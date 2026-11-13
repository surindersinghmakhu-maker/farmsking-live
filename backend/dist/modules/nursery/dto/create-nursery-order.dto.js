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
exports.CreateNurseryOrderDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateNurseryOrderDto {
}
exports.CreateNurseryOrderDto = CreateNurseryOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID of the nursery batch to book' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNurseryOrderDto.prototype, "batchId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Quantity of units (Trays or Acres)' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateNurseryOrderDto.prototype, "quantityUnits", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target delivery date requested by the buyer (ISO)' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateNurseryOrderDto.prototype, "requestedDeliveryDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.TransportMode, default: client_1.TransportMode.ROADWAYS_BUS_PARCEL }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(client_1.TransportMode),
    __metadata("design:type", String)
], CreateNurseryOrderDto.prototype, "transportMode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.InterStateDeliveryMode, default: client_1.InterStateDeliveryMode.BUS_STAND_SELF_PICKUP }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(client_1.InterStateDeliveryMode),
    __metadata("design:type", String)
], CreateNurseryOrderDto.prototype, "deliveryMode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Optional Local Field Partner (Agent) ID assisting the booking' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNurseryOrderDto.prototype, "agentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Delivery location notes, farm coordinates, or bus stand name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNurseryOrderDto.prototype, "notes", void 0);
//# sourceMappingURL=create-nursery-order.dto.js.map