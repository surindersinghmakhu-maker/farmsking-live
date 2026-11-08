"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappBotModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("../prisma/prisma.module");
const whatsapp_service_1 = require("./whatsapp.service");
const whatsapp_controller_1 = require("./whatsapp.controller");
const whatsapp_group_sync_service_1 = require("./whatsapp-group-sync.service");
let WhatsappBotModule = class WhatsappBotModule {
};
exports.WhatsappBotModule = WhatsappBotModule;
exports.WhatsappBotModule = WhatsappBotModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, config_1.ConfigModule],
        controllers: [whatsapp_controller_1.WhatsappBotController],
        providers: [whatsapp_service_1.WhatsappBotService, whatsapp_group_sync_service_1.WhatsAppGroupSyncService],
        exports: [whatsapp_service_1.WhatsappBotService, whatsapp_group_sync_service_1.WhatsAppGroupSyncService],
    })
], WhatsappBotModule);
//# sourceMappingURL=whatsapp.module.js.map