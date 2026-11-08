"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanRenewalModule = void 0;
const common_1 = require("@nestjs/common");
const advisor_assignment_module_1 = require("../advisor-assignment/advisor-assignment.module");
const app_settings_module_1 = require("../app-settings/app-settings.module");
const plan_renewal_controller_1 = require("./plan-renewal.controller");
const plan_renewal_service_1 = require("./plan-renewal.service");
let PlanRenewalModule = class PlanRenewalModule {
};
exports.PlanRenewalModule = PlanRenewalModule;
exports.PlanRenewalModule = PlanRenewalModule = __decorate([
    (0, common_1.Module)({
        imports: [advisor_assignment_module_1.AdvisorAssignmentModule, app_settings_module_1.AppSettingsModule],
        controllers: [plan_renewal_controller_1.PlanRenewalController],
        providers: [plan_renewal_service_1.PlanRenewalService],
        exports: [plan_renewal_service_1.PlanRenewalService],
    })
], PlanRenewalModule);
//# sourceMappingURL=plan-renewal.module.js.map