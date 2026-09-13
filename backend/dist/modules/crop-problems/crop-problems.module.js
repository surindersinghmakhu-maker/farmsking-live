"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CropProblemsModule = void 0;
const common_1 = require("@nestjs/common");
const crops_module_1 = require("../crops/crops.module");
const notifications_module_1 = require("../notifications/notifications.module");
const spray_schedules_module_1 = require("../spray-schedules/spray-schedules.module");
const chat_module_1 = require("../chat/chat.module");
const crop_problems_controller_1 = require("./crop-problems.controller");
const crop_problems_service_1 = require("./crop-problems.service");
let CropProblemsModule = class CropProblemsModule {
};
exports.CropProblemsModule = CropProblemsModule;
exports.CropProblemsModule = CropProblemsModule = __decorate([
    (0, common_1.Module)({
        imports: [crops_module_1.CropsModule, notifications_module_1.NotificationsModule, spray_schedules_module_1.SprayScheduleModule, chat_module_1.ChatModule],
        controllers: [crop_problems_controller_1.CropProblemsController],
        providers: [crop_problems_service_1.CropProblemsService],
        exports: [crop_problems_service_1.CropProblemsService],
    })
], CropProblemsModule);
//# sourceMappingURL=crop-problems.module.js.map