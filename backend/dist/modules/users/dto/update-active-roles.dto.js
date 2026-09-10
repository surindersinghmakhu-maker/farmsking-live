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
exports.UpdateActiveRolesDto = exports.ASSIGNABLE_CHECKBOX_ROLES = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
exports.ASSIGNABLE_CHECKBOX_ROLES = [client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR, client_1.Role.BUSINESS_PARTNER];
class UpdateActiveRolesDto {
    activeRoles;
}
exports.UpdateActiveRolesDto = UpdateActiveRolesDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsIn)(exports.ASSIGNABLE_CHECKBOX_ROLES, { each: true }),
    __metadata("design:type", Array)
], UpdateActiveRolesDto.prototype, "activeRoles", void 0);
//# sourceMappingURL=update-active-roles.dto.js.map