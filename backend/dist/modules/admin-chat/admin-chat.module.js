"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminChatModule = void 0;
const common_1 = require("@nestjs/common");
const admin_chat_controller_1 = require("./admin-chat.controller");
const admin_chat_service_1 = require("./admin-chat.service");
const prisma_module_1 = require("../prisma/prisma.module");
const chat_module_1 = require("../chat/chat.module");
const notifications_module_1 = require("../notifications/notifications.module");
let AdminChatModule = class AdminChatModule {
};
exports.AdminChatModule = AdminChatModule;
exports.AdminChatModule = AdminChatModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, (0, common_1.forwardRef)(() => chat_module_1.ChatModule), notifications_module_1.NotificationsModule],
        controllers: [admin_chat_controller_1.AdminChatController],
        providers: [admin_chat_service_1.AdminChatService],
        exports: [admin_chat_service_1.AdminChatService],
    })
], AdminChatModule);
//# sourceMappingURL=admin-chat.module.js.map