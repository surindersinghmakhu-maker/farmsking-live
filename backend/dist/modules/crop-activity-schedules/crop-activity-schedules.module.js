"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CropActivitySchedulesModule = void 0;
const common_1 = require("@nestjs/common");
const crops_module_1 = require("../crops/crops.module");
const advisor_assignment_module_1 = require("../advisor-assignment/advisor-assignment.module");
const notifications_module_1 = require("../notifications/notifications.module");
const chat_module_1 = require("../chat/chat.module");
const crop_activity_schedules_controller_1 = require("./crop-activity-schedules.controller");
const crop_activity_schedules_service_1 = require("./crop-activity-schedules.service");
let CropActivitySchedulesModule = class CropActivitySchedulesModule {
};
exports.CropActivitySchedulesModule = CropActivitySchedulesModule;
exports.CropActivitySchedulesModule = CropActivitySchedulesModule = __decorate([
    (0, common_1.Module)({
        imports: [crops_module_1.CropsModule, advisor_assignment_module_1.AdvisorAssignmentModule, notifications_module_1.NotificationsModule, chat_module_1.ChatModule],
        controllers: [crop_activity_schedules_controller_1.CropActivitySchedulesController],
        providers: [crop_activity_schedules_service_1.CropActivitySchedulesService],
        exports: [crop_activity_schedules_service_1.CropActivitySchedulesService],
    })
], CropActivitySchedulesModule);
//# sourceMappingURL=crop-activity-schedules.module.js.map