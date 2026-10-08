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
exports.CreateGardenExpenseDto = exports.GardenExpenseCategory = void 0;
const class_validator_1 = require("class-validator");
var GardenExpenseCategory;
(function (GardenExpenseCategory) {
    GardenExpenseCategory["SEEDS"] = "SEEDS";
    GardenExpenseCategory["SOIL"] = "SOIL";
    GardenExpenseCategory["FERTILIZER"] = "FERTILIZER";
    GardenExpenseCategory["TOOLS"] = "TOOLS";
    GardenExpenseCategory["WATER"] = "WATER";
    GardenExpenseCategory["POTS"] = "POTS";
    GardenExpenseCategory["PESTICIDE"] = "PESTICIDE";
    GardenExpenseCategory["PLANTS"] = "PLANTS";
    GardenExpenseCategory["OTHER"] = "OTHER";
})(GardenExpenseCategory || (exports.GardenExpenseCategory = GardenExpenseCategory = {}));
class CreateGardenExpenseDto {
}
exports.CreateGardenExpenseDto = CreateGardenExpenseDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGardenExpenseDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsDecimal)(),
    __metadata("design:type", Number)
], CreateGardenExpenseDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(GardenExpenseCategory),
    __metadata("design:type", String)
], CreateGardenExpenseDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGardenExpenseDto.prototype, "note", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateGardenExpenseDto.prototype, "gardenId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateGardenExpenseDto.prototype, "plantId", void 0);
//# sourceMappingURL=create-garden-expense.dto.js.map