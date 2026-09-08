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
exports.AdvisorAssignmentController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const advisor_assignment_service_1 = require("./advisor-assignment.service");
const create_advisor_assignment_dto_1 = require("./dto/create-advisor-assignment.dto");
const list_farmers_query_dto_1 = require("./dto/list-farmers-query.dto");
const reject_assignment_dto_1 = require("./dto/reject-assignment.dto");
let AdvisorAssignmentController = class AdvisorAssignmentController {
    advisorAssignmentService;
    constructor(advisorAssignmentService) {
        this.advisorAssignmentService = advisorAssignmentService;
    }
    getFarmerStats(user) {
        return this.advisorAssignmentService.getFarmerStats(user);
    }
    findFarmers(user, query) {
        return this.advisorAssignmentService.findFarmersByStatus(user, query.status ?? 'ALL');
    }
    findFarmerDetail(user, farmerId) {
        return this.advisorAssignmentService.findFarmerDetail(user, farmerId);
    }
    findMyAdvisor(user) {
        return this.advisorAssignmentService.findMyAdvisor(user);
    }
    findMyPendingRequest(user) {
        return this.advisorAssignmentService.findMyPendingRequest(user);
    }
    listAvailableAdvisors(user) {
        return this.advisorAssignmentService.listAvailableAdvisors(user);
    }
    requestSpecificAdvisor(user, advisorId) {
        return this.advisorAssignmentService.requestSpecificAdvisor(user.id, advisorId);
    }
    create(user, dto) {
        return this.advisorAssignmentService.create(user, dto);
    }
    revoke(user, id) {
        return this.advisorAssignmentService.revoke(user, id);
    }
    accept(user, id) {
        return this.advisorAssignmentService.accept(user, id);
    }
    reject(user, id, dto) {
        return this.advisorAssignmentService.reject(user, id, dto.reason);
    }
    sendRenewalReminder(user, farmerId) {
        return this.advisorAssignmentService.sendRenewalReminder(user, farmerId);
    }
};
exports.AdvisorAssignmentController = AdvisorAssignmentController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Get)('stats'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdvisorAssignmentController.prototype, "getFarmerStats", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Get)('farmers'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_farmers_query_dto_1.ListFarmersQueryDto]),
    __metadata("design:returntype", void 0)
], AdvisorAssignmentController.prototype, "findFarmers", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('farmers/:farmerId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('farmerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdvisorAssignmentController.prototype, "findFarmerDetail", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.GARDENER),
    (0, common_1.Get)('my-advisor'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdvisorAssignmentController.prototype, "findMyAdvisor", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.GARDENER),
    (0, common_1.Get)('my-pending-request'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdvisorAssignmentController.prototype, "findMyPendingRequest", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.GARDENER),
    (0, common_1.Get)('available'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdvisorAssignmentController.prototype, "listAvailableAdvisors", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.GARDENER),
    (0, common_1.Post)('choose-advisor/:advisorId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('advisorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdvisorAssignmentController.prototype, "requestSpecificAdvisor", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_advisor_assignment_dto_1.CreateAdvisorAssignmentDto]),
    __metadata("design:returntype", void 0)
], AdvisorAssignmentController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.ADVISOR),
    (0, common_1.Post)(':id/revoke'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdvisorAssignmentController.prototype, "revoke", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Post)(':id/accept'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdvisorAssignmentController.prototype, "accept", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Post)(':id/reject'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, reject_assignment_dto_1.RejectAssignmentDto]),
    __metadata("design:returntype", void 0)
], AdvisorAssignmentController.prototype, "reject", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Post)('farmers/:farmerId/renewal-reminder'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('farmerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdvisorAssignmentController.prototype, "sendRenewalReminder", null);
exports.AdvisorAssignmentController = AdvisorAssignmentController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('advisor-assignments'),
    __metadata("design:paramtypes", [advisor_assignment_service_1.AdvisorAssignmentService])
], AdvisorAssignmentController);
//# sourceMappingURL=advisor-assignment.controller.js.map