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
exports.TrainersController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const trainers_service_1 = require("./trainers.service");
let TrainersController = class TrainersController {
    constructor(trainersService) {
        this.trainersService = trainersService;
    }
    getMyAssignedFarmers(user) {
        return this.trainersService.getMyAssignedFarmers(user);
    }
    sendVerificationCode(user, body) {
        return this.trainersService.sendVerificationCode(user, body.farmerId);
    }
    verifyTrainingWithCode(user, body) {
        return this.trainersService.verifyTrainingWithCode(user, body.farmerId, body.code, body.notes);
    }
    getFarmerPendingTrainingBanner(user) {
        return this.trainersService.getFarmerPendingTrainingBanner(user);
    }
    farmerInAppVerify(user, body) {
        return this.trainersService.farmerInAppVerify(user, body.rating, body.notes);
    }
    assignTrainerState(user, body) {
        return this.trainersService.assignTrainerState(user, body.trainerId, body.state, body.district, body.commissionRate);
    }
    listTrainerAssignments() {
        return this.trainersService.listTrainerAssignments();
    }
    requestTrainerCall(user, body) {
        return this.trainersService.requestTrainerCall(user, body.preferredSlot);
    }
    forwardToUplineTrainer(user, body) {
        return this.trainersService.forwardToUplineTrainer(user, body.farmerId, body.forwardReason);
    }
    updateTrainerAvailability(user, body) {
        return this.trainersService.updateTrainerAvailability(user, body.isAvailable, body.availableFrom, body.availableTo, body.shiftType);
    }
    getAdminTrainerReports() {
        return this.trainersService.getAdminTrainerReports();
    }
};
exports.TrainersController = TrainersController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.TECHNICAL_TRAINER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('my-assigned-farmers'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TrainersController.prototype, "getMyAssignedFarmers", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.TECHNICAL_TRAINER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('send-verification-code'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TrainersController.prototype, "sendVerificationCode", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.TECHNICAL_TRAINER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('verify-code'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TrainersController.prototype, "verifyTrainingWithCode", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.CUSTOMER, client_1.Role.GARDENER, client_1.Role.TECHNICAL_TRAINER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('farmer-pending-banner'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TrainersController.prototype, "getFarmerPendingTrainingBanner", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.CUSTOMER, client_1.Role.GARDENER, client_1.Role.TECHNICAL_TRAINER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('farmer-verify'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TrainersController.prototype, "farmerInAppVerify", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('assignments'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TrainersController.prototype, "assignTrainerState", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('assignments'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TrainersController.prototype, "listTrainerAssignments", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.CUSTOMER, client_1.Role.GARDENER, client_1.Role.TECHNICAL_TRAINER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('request-call'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TrainersController.prototype, "requestTrainerCall", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.TECHNICAL_TRAINER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('forward-upline'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TrainersController.prototype, "forwardToUplineTrainer", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.TECHNICAL_TRAINER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('update-availability'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TrainersController.prototype, "updateTrainerAvailability", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('admin-reports'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TrainersController.prototype, "getAdminTrainerReports", null);
exports.TrainersController = TrainersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('trainers'),
    __metadata("design:paramtypes", [trainers_service_1.TrainersService])
], TrainersController);
//# sourceMappingURL=trainers.controller.js.map