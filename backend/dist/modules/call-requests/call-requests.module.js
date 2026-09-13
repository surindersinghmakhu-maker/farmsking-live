"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallRequestsModule = void 0;
const common_1 = require("@nestjs/common");
const notifications_module_1 = require("../notifications/notifications.module");
const call_requests_controller_1 = require("./call-requests.controller");
const call_requests_service_1 = require("./call-requests.service");
const chat_module_1 = require("../chat/chat.module");
let CallRequestsModule = class CallRequestsModule {
};
exports.CallRequestsModule = CallRequestsModule;
exports.CallRequestsModule = CallRequestsModule = __decorate([
    (0, common_1.Module)({
        imports: [notifications_module_1.NotificationsModule, (0, common_1.forwardRef)(() => chat_module_1.ChatModule)],
        controllers: [call_requests_controller_1.CallRequestsController],
        providers: [call_requests_service_1.CallRequestsService],
        exports: [call_requests_service_1.CallRequestsService],
    })
], CallRequestsModule);
//# sourceMappingURL=call-requests.module.js.map