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
exports.UpdateDispatchDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateDispatchDto {
}
exports.UpdateDispatchDto = UpdateDispatchDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Bus number e.g. PB-11-XX-1234 PRTC' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDispatchDto.prototype, "busNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Bus route e.g. Ludhiana to Rohtak' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDispatchDto.prototype, "busDepotRoute", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Bus conductor mobile number' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDispatchDto.prototype, "busConductorMobile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Bus parcel bilty photo URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDispatchDto.prototype, "busBiltyPhotoUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Train number/name e.g. 12054 Jan Shatabdi' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDispatchDto.prototype, "trainNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Railway parcel receipt (RR) number' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDispatchDto.prototype, "railwayReceiptNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Destination railway station name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDispatchDto.prototype, "destinationStation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Railway bilty photo URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDispatchDto.prototype, "rrBiltyPhotoUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Local driver name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDispatchDto.prototype, "driverName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Local driver mobile' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDispatchDto.prototype, "driverMobile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tractor / vehicle number' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDispatchDto.prototype, "vehicleNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Estimated arrival timestamp at destination' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateDispatchDto.prototype, "expectedArrivalAt", void 0);
//# sourceMappingURL=update-dispatch.dto.js.map