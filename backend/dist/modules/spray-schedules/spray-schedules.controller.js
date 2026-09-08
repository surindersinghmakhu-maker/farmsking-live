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
exports.SprayScheduleController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const spray_schedules_service_1 = require("./spray-schedules.service");
const create_spray_schedule_dto_1 = require("./dto/create-spray-schedule.dto");
const update_spray_schedule_dto_1 = require("./dto/update-spray-schedule.dto");
let SprayScheduleController = class SprayScheduleController {
    sprayScheduleService;
    constructor(sprayScheduleService) {
        this.sprayScheduleService = sprayScheduleService;
    }
    create(user, dto) {
        return this.sprayScheduleService.create(user, dto);
    }
    searchCatalog(q) {
        return this.sprayScheduleService.searchCatalog(q ?? '');
    }
    listForCrop(user, cropCycleId) {
        return this.sprayScheduleService.listForCrop(user, cropCycleId);
    }
    update(user, id, dto) {
        return this.sprayScheduleService.update(user, id, dto);
    }
    remove(user, id) {
        return this.sprayScheduleService.remove(user, id);
    }
};
exports.SprayScheduleController = SprayScheduleController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_spray_schedule_dto_1.CreateSprayScheduleDto]),
    __metadata("design:returntype", void 0)
], SprayScheduleController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('catalog/search'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SprayScheduleController.prototype, "searchCatalog", null);
__decorate([
    (0, common_1.Get)('crop/:cropCycleId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('cropCycleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SprayScheduleController.prototype, "listForCrop", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_spray_schedule_dto_1.UpdateSprayScheduleDto]),
    __metadata("design:returntype", void 0)
], SprayScheduleController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SprayScheduleController.prototype, "remove", null);
exports.SprayScheduleController = SprayScheduleController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADVISOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Controller)('spray-schedules'),
    __metadata("design:paramtypes", [spray_schedules_service_1.SprayScheduleService])
], SprayScheduleController);
//# sourceMappingURL=spray-schedules.controller.js.map