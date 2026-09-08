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
exports.CropActivitySchedulesController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const crop_activity_schedules_service_1 = require("./crop-activity-schedules.service");
const create_activity_schedule_dto_1 = require("./dto/create-activity-schedule.dto");
const update_activity_schedule_dto_1 = require("./dto/update-activity-schedule.dto");
const bulk_create_activity_schedule_dto_1 = require("./dto/bulk-create-activity-schedule.dto");
const complete_activity_dto_1 = require("./dto/complete-activity.dto");
let CropActivitySchedulesController = class CropActivitySchedulesController {
    cropActivitySchedulesService;
    constructor(cropActivitySchedulesService) {
        this.cropActivitySchedulesService = cropActivitySchedulesService;
    }
    create(user, dto) {
        return this.cropActivitySchedulesService.create(user, dto);
    }
    bulkCreate(user, dto) {
        return this.cropActivitySchedulesService.bulkCreate(user, dto);
    }
    findToday(user) {
        return this.cropActivitySchedulesService.findTodayForFarmer(user);
    }
    findTodayForAdvisor(user) {
        return this.cropActivitySchedulesService.findTodayForAdvisor(user);
    }
    findUpcomingForAdvisor(user) {
        return this.cropActivitySchedulesService.findUpcomingForAdvisor(user);
    }
    findDelayedForAdvisor(user) {
        return this.cropActivitySchedulesService.findDelayedForAdvisor(user);
    }
    findAllForCropCycle(user, cropCycleId) {
        return this.cropActivitySchedulesService.findAllForCropCycle(user, cropCycleId);
    }
    update(user, id, dto) {
        return this.cropActivitySchedulesService.update(user, id, dto);
    }
    complete(user, id, dto) {
        return this.cropActivitySchedulesService.complete(user, id, dto);
    }
    remove(user, id) {
        return this.cropActivitySchedulesService.remove(user, id);
    }
    remind(user, id) {
        return this.cropActivitySchedulesService.remind(user, id);
    }
};
exports.CropActivitySchedulesController = CropActivitySchedulesController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_activity_schedule_dto_1.CreateActivityScheduleDto]),
    __metadata("design:returntype", void 0)
], CropActivitySchedulesController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Post)('bulk'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, bulk_create_activity_schedule_dto_1.BulkCreateActivityScheduleDto]),
    __metadata("design:returntype", void 0)
], CropActivitySchedulesController.prototype, "bulkCreate", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER),
    (0, common_1.Get)('today'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CropActivitySchedulesController.prototype, "findToday", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Get)('advisor/today'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CropActivitySchedulesController.prototype, "findTodayForAdvisor", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Get)('advisor/upcoming'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CropActivitySchedulesController.prototype, "findUpcomingForAdvisor", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Get)('advisor/delayed'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CropActivitySchedulesController.prototype, "findDelayedForAdvisor", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADVISOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('crop/:cropCycleId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('cropCycleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CropActivitySchedulesController.prototype, "findAllForCropCycle", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_activity_schedule_dto_1.UpdateActivityScheduleDto]),
    __metadata("design:returntype", void 0)
], CropActivitySchedulesController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER),
    (0, common_1.Patch)(':id/complete'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, complete_activity_dto_1.CompleteActivityDto]),
    __metadata("design:returntype", void 0)
], CropActivitySchedulesController.prototype, "complete", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CropActivitySchedulesController.prototype, "remove", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Post)(':id/remind'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CropActivitySchedulesController.prototype, "remind", null);
exports.CropActivitySchedulesController = CropActivitySchedulesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('crop-activity-schedules'),
    __metadata("design:paramtypes", [crop_activity_schedules_service_1.CropActivitySchedulesService])
], CropActivitySchedulesController);
//# sourceMappingURL=crop-activity-schedules.controller.js.map