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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappBotController = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_service_1 = require("./whatsapp.service");
const whatsapp_group_sync_service_1 = require("./whatsapp-group-sync.service");
let WhatsappBotController = class WhatsappBotController {
    constructor(whatsappService, groupSyncService) {
        this.whatsappService = whatsappService;
        this.groupSyncService = groupSyncService;
    }
    async getAllGroups() {
        return [];
    }
    async resetQr() {
        return { success: true };
    }
    async getStatus() {
        return { isConnected: false, message: 'Disabled' };
    }
    async sendOtp(body) {
        return { success: true };
    }
    async logout() {
        return { success: true };
    }
    async syncAdvisorGroup() {
        return { success: true };
    }
    async getSyncStatus() {
        return { enabled: false, groupId: null };
    }
};
exports.WhatsappBotController = WhatsappBotController;
__decorate([
    (0, common_1.Get)('groups'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WhatsappBotController.prototype, "getAllGroups", null);
__decorate([
    (0, common_1.Post)('reset-qr'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WhatsappBotController.prototype, "resetQr", null);
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WhatsappBotController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('send-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WhatsappBotController.prototype, "sendOtp", null);
__decorate([
    (0, common_1.Post)('logout'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WhatsappBotController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('sync-advisor-group'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WhatsappBotController.prototype, "syncAdvisorGroup", null);
__decorate([
    (0, common_1.Get)('group-sync-status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WhatsappBotController.prototype, "getSyncStatus", null);
exports.WhatsappBotController = WhatsappBotController = __decorate([
    (0, common_1.Controller)('whatsapp'),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsappBotService,
        whatsapp_group_sync_service_1.WhatsAppGroupSyncService])
], WhatsappBotController);
//# sourceMappingURL=whatsapp.controller.js.map