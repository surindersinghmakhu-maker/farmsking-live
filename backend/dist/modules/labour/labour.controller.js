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
exports.LabourController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const labour_service_1 = require("./labour.service");
const create_labour_worker_dto_1 = require("./dto/create-labour-worker.dto");
const create_work_entry_dto_1 = require("./dto/create-work-entry.dto");
const create_labour_payment_dto_1 = require("./dto/create-labour-payment.dto");
let LabourController = class LabourController {
    labourService;
    constructor(labourService) {
        this.labourService = labourService;
    }
    getLabourDashboard(user) {
        return this.labourService.getLabourDashboard(user.id);
    }
    createWorker(user, dto) {
        return this.labourService.createWorker(user.id, dto);
    }
    getWorkers(user) {
        return this.labourService.getWorkersForFarmer(user.id);
    }
    updateWorker(user, id, dto) {
        return this.labourService.updateWorker(user.id, id, dto);
    }
    deleteWorker(user, id) {
        return this.labourService.deleteWorker(user.id, id);
    }
    createWorkEntry(user, dto) {
        return this.labourService.createWorkEntry(user.id, user.id, dto);
    }
    getWorkEntries(user, workerId) {
        return this.labourService.getWorkEntries(user.id, workerId);
    }
    createPayment(user, dto) {
        return this.labourService.createPayment(user.id, user.id, dto);
    }
    getPayments(user, workerId) {
        return this.labourService.getPayments(user.id, workerId);
    }
    getWorkerStatement(user, workerId) {
        return this.labourService.getWorkerStatement(user.id, workerId);
    }
};
exports.LabourController = LabourController;
__decorate([
    (0, common_1.Get)('my-dashboard'),
    (0, roles_decorator_1.Roles)(client_1.Role.LABOUR, client_1.Role.FARMER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LabourController.prototype, "getLabourDashboard", null);
__decorate([
    (0, common_1.Post)('workers'),
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_labour_worker_dto_1.CreateLabourWorkerDto]),
    __metadata("design:returntype", void 0)
], LabourController.prototype, "createWorker", null);
__decorate([
    (0, common_1.Get)('workers'),
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LabourController.prototype, "getWorkers", null);
__decorate([
    (0, common_1.Put)('workers/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_labour_worker_dto_1.UpdateLabourWorkerDto]),
    __metadata("design:returntype", void 0)
], LabourController.prototype, "updateWorker", null);
__decorate([
    (0, common_1.Delete)('workers/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LabourController.prototype, "deleteWorker", null);
__decorate([
    (0, common_1.Post)('work-entries'),
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_work_entry_dto_1.CreateWorkEntryDto]),
    __metadata("design:returntype", void 0)
], LabourController.prototype, "createWorkEntry", null);
__decorate([
    (0, common_1.Get)('work-entries'),
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('workerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LabourController.prototype, "getWorkEntries", null);
__decorate([
    (0, common_1.Post)('payments'),
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_labour_payment_dto_1.CreateLabourPaymentDto]),
    __metadata("design:returntype", void 0)
], LabourController.prototype, "createPayment", null);
__decorate([
    (0, common_1.Get)('payments'),
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('workerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LabourController.prototype, "getPayments", null);
__decorate([
    (0, common_1.Get)('statement/:workerId'),
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LabourController.prototype, "getWorkerStatement", null);
exports.LabourController = LabourController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('labour'),
    __metadata("design:paramtypes", [labour_service_1.LabourService])
], LabourController);
//# sourceMappingURL=labour.controller.js.map