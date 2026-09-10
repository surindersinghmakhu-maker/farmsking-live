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
exports.FarmerPlanPaymentsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const farmer_plan_payments_service_1 = require("./farmer-plan-payments.service");
const initiate_farmer_plan_payment_dto_1 = require("./dto/initiate-farmer-plan-payment.dto");
const submit_farmer_plan_payment_dto_1 = require("./dto/submit-farmer-plan-payment.dto");
const reject_farmer_plan_payment_dto_1 = require("./dto/reject-farmer-plan-payment.dto");
let FarmerPlanPaymentsController = class FarmerPlanPaymentsController {
    farmerPlanPaymentsService;
    constructor(farmerPlanPaymentsService) {
        this.farmerPlanPaymentsService = farmerPlanPaymentsService;
    }
    initiate(user, dto, farmerId) {
        return this.farmerPlanPaymentsService.initiate(user, dto, farmerId);
    }
    listMine(user) {
        return this.farmerPlanPaymentsService.listMine(user);
    }
    listPending() {
        return this.farmerPlanPaymentsService.listPending();
    }
    submit(user, id, dto) {
        return this.farmerPlanPaymentsService.submit(user, id, dto);
    }
    confirm(user, id) {
        return this.farmerPlanPaymentsService.confirm(user, id);
    }
    reject(user, id, dto) {
        return this.farmerPlanPaymentsService.reject(user, id, dto);
    }
};
exports.FarmerPlanPaymentsController = FarmerPlanPaymentsController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADVISOR),
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)('farmerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, initiate_farmer_plan_payment_dto_1.InitiateFarmerPlanPaymentDto, String]),
    __metadata("design:returntype", void 0)
], FarmerPlanPaymentsController.prototype, "initiate", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADVISOR),
    (0, common_1.Get)('mine'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FarmerPlanPaymentsController.prototype, "listMine", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FarmerPlanPaymentsController.prototype, "listPending", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADVISOR),
    (0, common_1.Post)(':id/submit'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, submit_farmer_plan_payment_dto_1.SubmitFarmerPlanPaymentDto]),
    __metadata("design:returntype", void 0)
], FarmerPlanPaymentsController.prototype, "submit", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)(':id/confirm'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FarmerPlanPaymentsController.prototype, "confirm", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)(':id/reject'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, reject_farmer_plan_payment_dto_1.RejectFarmerPlanPaymentDto]),
    __metadata("design:returntype", void 0)
], FarmerPlanPaymentsController.prototype, "reject", null);
exports.FarmerPlanPaymentsController = FarmerPlanPaymentsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('farmer-plan-payments'),
    __metadata("design:paramtypes", [farmer_plan_payments_service_1.FarmerPlanPaymentsService])
], FarmerPlanPaymentsController);
//# sourceMappingURL=farmer-plan-payments.controller.js.map