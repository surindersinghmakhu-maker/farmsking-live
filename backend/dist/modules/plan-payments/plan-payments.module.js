"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanPaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const advisor_assignment_module_1 = require("../advisor-assignment/advisor-assignment.module");
const plan_renewal_module_1 = require("../plan-renewal/plan-renewal.module");
const notifications_module_1 = require("../notifications/notifications.module");
const app_settings_module_1 = require("../app-settings/app-settings.module");
const plan_payments_controller_1 = require("./plan-payments.controller");
const plan_payments_service_1 = require("./plan-payments.service");
let PlanPaymentsModule = class PlanPaymentsModule {
};
exports.PlanPaymentsModule = PlanPaymentsModule;
exports.PlanPaymentsModule = PlanPaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [advisor_assignment_module_1.AdvisorAssignmentModule, plan_renewal_module_1.PlanRenewalModule, notifications_module_1.NotificationsModule, app_settings_module_1.AppSettingsModule],
        controllers: [plan_payments_controller_1.PlanPaymentsController],
        providers: [plan_payments_service_1.PlanPaymentsService],
    })
], PlanPaymentsModule);
//# sourceMappingURL=plan-payments.module.js.map