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
exports.CropsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const crops_service_1 = require("./crops.service");
const create_crop_dto_1 = require("./dto/create-crop.dto");
const update_crop_dto_1 = require("./dto/update-crop.dto");
const reject_crop_dto_1 = require("./dto/reject-crop.dto");
const update_crop_schedule_dto_1 = require("./dto/update-crop-schedule.dto");
let CropsController = class CropsController {
    cropsService;
    constructor(cropsService) {
        this.cropsService = cropsService;
    }
    create(user, dto) {
        return this.cropsService.create(user, dto);
    }
    listPendingForAdvisor(user) {
        return this.cropsService.listPendingForAdvisor(user);
    }
    listAcceptedForAdvisor(user) {
        return this.cropsService.listAcceptedForAdvisor(user);
    }
    submitToAdvisor(user, id) {
        return this.cropsService.submitToAdvisor(user, id);
    }
    cancelSubmission(user, id) {
        return this.cropsService.cancelSubmission(user, id);
    }
    acceptByAdvisor(user, id) {
        return this.cropsService.acceptByAdvisor(user, id);
    }
    rejectByAdvisor(user, id, dto) {
        return this.cropsService.rejectByAdvisor(user, id, dto.reason);
    }
    updateAssignedSchedule(user, id, dto) {
        return this.cropsService.updateAssignedSchedule(user, id, dto.assignedSchedule);
    }
    listMineForFarmer(user) {
        return this.cropsService.listMineForFarmer(user);
    }
    findAllForPlot(user, plotId) {
        return this.cropsService.findAllForPlot(user, plotId);
    }
    lookupByCropId(cropId) {
        return this.cropsService.lookupByCropId(cropId);
    }
    findOne(user, id) {
        return this.cropsService.findOneOrThrow(user, id);
    }
    update(user, id, dto) {
        return this.cropsService.update(user, id, dto);
    }
    remove(user, id) {
        return this.cropsService.remove(user, id);
    }
};
exports.CropsController = CropsController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR, client_1.Role.BUSINESS_PARTNER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.OPERATOR),
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_crop_dto_1.CreateCropDto]),
    __metadata("design:returntype", void 0)
], CropsController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Get)('advisor/pending'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CropsController.prototype, "listPendingForAdvisor", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Get)('advisor/accepted'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CropsController.prototype, "listAcceptedForAdvisor", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER),
    (0, common_1.Post)(':id/submit-to-advisor'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CropsController.prototype, "submitToAdvisor", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER),
    (0, common_1.Post)(':id/cancel-submission'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CropsController.prototype, "cancelSubmission", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Post)(':id/accept'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CropsController.prototype, "acceptByAdvisor", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Post)(':id/reject'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, reject_crop_dto_1.RejectCropDto]),
    __metadata("design:returntype", void 0)
], CropsController.prototype, "rejectByAdvisor", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADVISOR),
    (0, common_1.Patch)(':id/schedule'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_crop_schedule_dto_1.UpdateCropScheduleDto]),
    __metadata("design:returntype", void 0)
], CropsController.prototype, "updateAssignedSchedule", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR, client_1.Role.BUSINESS_PARTNER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.OPERATOR),
    (0, common_1.Get)('mine'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CropsController.prototype, "listMineForFarmer", null);
__decorate([
    (0, common_1.Get)('plot/:plotId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('plotId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CropsController.prototype, "findAllForPlot", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('lookup/:cropId'),
    __param(0, (0, common_1.Param)('cropId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CropsController.prototype, "lookupByCropId", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CropsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_crop_dto_1.UpdateCropDto]),
    __metadata("design:returntype", void 0)
], CropsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CropsController.prototype, "remove", null);
exports.CropsController = CropsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR, client_1.Role.BUSINESS_PARTNER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.OPERATOR),
    (0, common_1.Controller)('crops'),
    __metadata("design:paramtypes", [crops_service_1.CropsService])
], CropsController);
//# sourceMappingURL=crops.controller.js.map