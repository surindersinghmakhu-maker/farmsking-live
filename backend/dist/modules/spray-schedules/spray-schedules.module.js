"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SprayScheduleModule = void 0;
const common_1 = require("@nestjs/common");
const advisor_assignment_module_1 = require("../advisor-assignment/advisor-assignment.module");
const notifications_module_1 = require("../notifications/notifications.module");
const spray_schedules_controller_1 = require("./spray-schedules.controller");
const spray_schedules_service_1 = require("./spray-schedules.service");
let SprayScheduleModule = class SprayScheduleModule {
};
exports.SprayScheduleModule = SprayScheduleModule;
exports.SprayScheduleModule = SprayScheduleModule = __decorate([
    (0, common_1.Module)({
        imports: [advisor_assignment_module_1.AdvisorAssignmentModule, notifications_module_1.NotificationsModule],
        controllers: [spray_schedules_controller_1.SprayScheduleController],
        providers: [spray_schedules_service_1.SprayScheduleService],
        exports: [spray_schedules_service_1.SprayScheduleService],
    })
], SprayScheduleModule);
//# sourceMappingURL=spray-schedules.module.js.map