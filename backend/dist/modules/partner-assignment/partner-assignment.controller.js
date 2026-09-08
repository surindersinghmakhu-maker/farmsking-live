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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerAssignmentController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const partner_assignment_service_1 = require("./partner-assignment.service");
let PartnerAssignmentController = class PartnerAssignmentController {
    partnerAssignmentService;
    constructor(partnerAssignmentService) {
        this.partnerAssignmentService = partnerAssignmentService;
    }
    findMyPartner(user) {
        return this.partnerAssignmentService.findMyPartner(user);
    }
    findMyCustomers(user) {
        return this.partnerAssignmentService.findMyCustomers(user);
    }
};
exports.PartnerAssignmentController = PartnerAssignmentController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER),
    (0, common_1.Get)('my-partner'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PartnerAssignmentController.prototype, "findMyPartner", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.BUSINESS_PARTNER),
    (0, common_1.Get)('customers'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PartnerAssignmentController.prototype, "findMyCustomers", null);
exports.PartnerAssignmentController = PartnerAssignmentController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('partner-assignments'),
    __metadata("design:paramtypes", [partner_assignment_service_1.PartnerAssignmentService])
], PartnerAssignmentController);
//# sourceMappingURL=partner-assignment.controller.js.map