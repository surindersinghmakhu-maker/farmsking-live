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
exports.GardensController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const gardens_service_1 = require("./gardens.service");
const create_garden_dto_1 = require("./dto/create-garden.dto");
const create_plant_dto_1 = require("./dto/create-plant.dto");
const create_garden_expense_dto_1 = require("./dto/create-garden-expense.dto");
const create_plant_care_schedule_dto_1 = require("./dto/create-plant-care-schedule.dto");
const log_plant_health_dto_1 = require("./dto/log-plant-health.dto");
const diagnose_plant_dto_1 = require("./dto/diagnose-plant.dto");
const prescribe_plant_care_dto_1 = require("./dto/prescribe-plant-care.dto");
let GardensController = class GardensController {
    constructor(gardensService) {
        this.gardensService = gardensService;
    }
    getDoctorGardenDashboard(user) {
        return this.gardensService.getDoctorGardenDashboard(user);
    }
    getBotanicalProfileForDoctor(user, gardenerId) {
        return this.gardensService.getBotanicalProfileForDoctor(user, gardenerId);
    }
    prescribeCareSchedule(user, dto) {
        return this.gardensService.prescribeCareSchedule(user, dto);
    }
    recordDoctorConsultationNote(user, dto) {
        return this.gardensService.recordDoctorConsultationNote(user, dto);
    }
    create(user, dto) {
        return this.gardensService.create(user, dto);
    }
    findAll(user) {
        return this.gardensService.findAll(user);
    }
    listAllPlants(user) {
        return this.gardensService.listAllPlants(user);
    }
    addStandalonePlant(user, dto) {
        return this.gardensService.addPlant(user, dto.gardenId || null, dto);
    }
    getPlantDetails(user, id) {
        return this.gardensService.getPlantOrThrow(user, id);
    }
    listCareTasks(user, dueToday) {
        return this.gardensService.listCareTasks(user, { dueToday: dueToday === 'true' });
    }
    addCareSchedule(user, dto) {
        return this.gardensService.addCareSchedule(user, dto);
    }
    completeCareTask(user, id) {
        return this.gardensService.completeCareTask(user, id);
    }
    logPlantHealth(user, dto) {
        return this.gardensService.logPlantHealth(user, dto);
    }
    getAiCreditStatus(user) {
        return this.gardensService.getAiCreditStatus(user);
    }
    diagnosePlant(user, dto) {
        return this.gardensService.diagnoseAndRecord(user, dto);
    }
    listDiagnoses(user, plantId) {
        return this.gardensService.listDiagnoses(user, plantId);
    }
    addExpense(user, dto) {
        return this.gardensService.addExpense(user, dto);
    }
    listExpenses(user) {
        return this.gardensService.listExpenses(user);
    }
    deleteExpense(user, id) {
        return this.gardensService.deleteExpense(user, id);
    }
    findOne(user, id) {
        return this.gardensService.findOneOrThrow(user, id);
    }
    addPlantToGarden(user, id, dto) {
        return this.gardensService.addPlant(user, id, dto);
    }
    listGardenPlants(user, id) {
        return this.gardensService.listPlants(user, id);
    }
};
exports.GardensController = GardensController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('doctor/dashboard'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "getDoctorGardenDashboard", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('doctor/patient/:gardenerId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('gardenerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "getBotanicalProfileForDoctor", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('doctor/prescriptions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, prescribe_plant_care_dto_1.PrescribePlantCareDto]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "prescribeCareSchedule", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('doctor/consultation-note'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, prescribe_plant_care_dto_1.DoctorConsultationNoteDto]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "recordDoctorConsultationNote", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_garden_dto_1.CreateGardenDto]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('mine'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('plants'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "listAllPlants", null);
__decorate([
    (0, common_1.Post)('plants'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_plant_dto_1.CreatePlantDto]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "addStandalonePlant", null);
__decorate([
    (0, common_1.Get)('plants/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "getPlantDetails", null);
__decorate([
    (0, common_1.Get)('care-tasks'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('dueToday')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "listCareTasks", null);
__decorate([
    (0, common_1.Post)('care-tasks'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_plant_care_schedule_dto_1.CreatePlantCareScheduleDto]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "addCareSchedule", null);
__decorate([
    (0, common_1.Patch)('care-tasks/:id/complete'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "completeCareTask", null);
__decorate([
    (0, common_1.Post)('plants/health-log'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, log_plant_health_dto_1.LogPlantHealthDto]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "logPlantHealth", null);
__decorate([
    (0, common_1.Get)('ai-credits'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "getAiCreditStatus", null);
__decorate([
    (0, common_1.Post)('diagnose'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, diagnose_plant_dto_1.DiagnosePlantDto]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "diagnosePlant", null);
__decorate([
    (0, common_1.Get)('diagnoses'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('plantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "listDiagnoses", null);
__decorate([
    (0, common_1.Post)('expenses'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_garden_expense_dto_1.CreateGardenExpenseDto]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "addExpense", null);
__decorate([
    (0, common_1.Get)('expenses'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "listExpenses", null);
__decorate([
    (0, common_1.Delete)('expenses/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "deleteExpense", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/plants'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_plant_dto_1.CreatePlantDto]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "addPlantToGarden", null);
__decorate([
    (0, common_1.Get)(':id/plants'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GardensController.prototype, "listGardenPlants", null);
exports.GardensController = GardensController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.GARDENER, client_1.Role.ADVISOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Controller)('gardens'),
    __metadata("design:paramtypes", [gardens_service_1.GardensService])
], GardensController);
//# sourceMappingURL=gardens.controller.js.map