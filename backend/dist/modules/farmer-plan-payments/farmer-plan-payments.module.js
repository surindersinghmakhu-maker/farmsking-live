"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FarmerPlanPaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const advisor_assignment_module_1 = require("../advisor-assignment/advisor-assignment.module");
const notifications_module_1 = require("../notifications/notifications.module");
const app_settings_module_1 = require("../app-settings/app-settings.module");
const farmer_plans_module_1 = require("../farmer-plans/farmer-plans.module");
const farmer_plan_payments_controller_1 = require("./farmer-plan-payments.controller");
const farmer_plan_payments_service_1 = require("./farmer-plan-payments.service");
let FarmerPlanPaymentsModule = class FarmerPlanPaymentsModule {
};
exports.FarmerPlanPaymentsModule = FarmerPlanPaymentsModule;
exports.FarmerPlanPaymentsModule = FarmerPlanPaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [advisor_assignment_module_1.AdvisorAssignmentModule, notifications_module_1.NotificationsModule, app_settings_module_1.AppSettingsModule, farmer_plans_module_1.FarmerPlansModule],
        controllers: [farmer_plan_payments_controller_1.FarmerPlanPaymentsController],
        providers: [farmer_plan_payments_service_1.FarmerPlanPaymentsService],
    })
], FarmerPlanPaymentsModule);
//# sourceMappingURL=farmer-plan-payments.module.js.map