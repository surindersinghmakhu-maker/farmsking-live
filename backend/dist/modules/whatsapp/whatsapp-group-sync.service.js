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
var WhatsAppGroupSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppGroupSyncService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const whatsapp_service_1 = require("./whatsapp.service");
let WhatsAppGroupSyncService = WhatsAppGroupSyncService_1 = class WhatsAppGroupSyncService {
    constructor(prisma, whatsappBotService) {
        this.prisma = prisma;
        this.whatsappBotService = whatsappBotService;
        this.logger = new common_1.Logger(WhatsAppGroupSyncService_1.name);
    }
    async onModuleInit() {
        this.logger.log('WhatsApp Group Sync disabled.');
    }
    async testConnection() {
        return { success: false, message: 'Disabled' };
    }
    async triggerGlobalSync() {
        return { success: true, message: 'Disabled' };
    }
    async syncSingleFarmerGroupStatus(userId) {
    }
    async autoAddNewUser(userId, mobile, name) {
    }
    async autoRemoveUser(userId, mobile, name) {
    }
    async syncEligibleUsersToCommunityGroup(users) {
    }
};
exports.WhatsAppGroupSyncService = WhatsAppGroupSyncService;
exports.WhatsAppGroupSyncService = WhatsAppGroupSyncService = WhatsAppGroupSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        whatsapp_service_1.WhatsappBotService])
], WhatsAppGroupSyncService);
//# sourceMappingURL=whatsapp-group-sync.service.js.map