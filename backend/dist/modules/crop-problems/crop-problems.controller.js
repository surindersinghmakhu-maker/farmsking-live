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
exports.CropProblemsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const crop_problems_service_1 = require("./crop-problems.service");
const create_crop_problem_dto_1 = require("./dto/create-crop-problem.dto");
const respond_crop_problem_dto_1 = require("./dto/respond-crop-problem.dto");
const update_crop_problem_status_dto_1 = require("./dto/update-crop-problem-status.dto");
let CropProblemsController = class CropProblemsController {
    cropProblemsService;
    constructor(cropProblemsService) {
        this.cropProblemsService = cropProblemsService;
    }
    create(user, dto) {
        return this.cropProblemsService.create(user, dto);
    }
    findMine(user) {
        return this.cropProblemsService.findAllForFarmer(user);
    }
    findAssigned(user) {
        return this.cropProblemsService.findAllForAdvisor(user);
    }
    findOne(user, id) {
        return this.cropProblemsService.findOneOrThrow(user, id);
    }
    respond(user, id, dto) {
        return this.cropProblemsService.respond(user, id, dto);
    }
    updateStatus(user, id, dto) {
        return this.cropProblemsService.updateStatus(user, id, dto);
    }
    rate(user, id, dto) {
        return this.cropProblemsService.rate(user, id, dto);
    }
};
exports.CropProblemsController = CropProblemsController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER),
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_crop_problem_dto_1.CreateCropProblemDto]),
    __metadata("design:returntype", void 0)
], CropProblemsController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER),
    (0, common_1.Get)('mine'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CropProblemsController.prototype, "findMine", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Get)('assigned'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CropProblemsController.prototype, "findAssigned", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADVISOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CropProblemsController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Patch)(':id/respond'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, respond_crop_problem_dto_1.RespondCropProblemDto]),
    __metadata("design:returntype", void 0)
], CropProblemsController.prototype, "respond", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADVISOR),
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_crop_problem_status_dto_1.UpdateCropProblemStatusDto]),
    __metadata("design:returntype", void 0)
], CropProblemsController.prototype, "updateStatus", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER),
    (0, common_1.Patch)(':id/rate'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], CropProblemsController.prototype, "rate", null);
exports.CropProblemsController = CropProblemsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('crop-problems'),
    __metadata("design:paramtypes", [crop_problems_service_1.CropProblemsService])
], CropProblemsController);
//# sourceMappingURL=crop-problems.controller.js.map