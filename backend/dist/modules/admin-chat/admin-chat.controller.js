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
exports.AdminChatController = void 0;
const common_1 = require("@nestjs/common");
const admin_chat_service_1 = require("./admin-chat.service");
const send_chat_message_dto_1 = require("./dto/send-chat-message.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let AdminChatController = class AdminChatController {
    adminChatService;
    constructor(adminChatService) {
        this.adminChatService = adminChatService;
    }
    async sendMessage(req, dto) {
        return this.adminChatService.sendMessage(req.user.id, req.user.role, dto);
    }
    async getFarmerMessages(req) {
        return this.adminChatService.getFarmerMessages(req.user.id);
    }
    async getAdminConversations() {
        return this.adminChatService.getAdminConversations();
    }
    async getAdminFarmerThread(farmerId) {
        return this.adminChatService.getAdminFarmerThread(farmerId);
    }
    async resolveFarmerThread(req, farmerId, notes) {
        return this.adminChatService.resolveFarmerThread(req.user.id, farmerId, notes);
    }
};
exports.AdminChatController = AdminChatController;
__decorate([
    (0, common_1.Post)('send'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, send_chat_message_dto_1.SendChatMessageDto]),
    __metadata("design:returntype", Promise)
], AdminChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)('my-messages'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminChatController.prototype, "getFarmerMessages", null);
__decorate([
    (0, common_1.Get)('admin/conversations'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminChatController.prototype, "getAdminConversations", null);
__decorate([
    (0, common_1.Get)('admin/conversations/:farmerId'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('farmerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminChatController.prototype, "getAdminFarmerThread", null);
__decorate([
    (0, common_1.Post)('admin/conversations/:farmerId/resolve'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('farmerId')),
    __param(2, (0, common_1.Body)('notes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AdminChatController.prototype, "resolveFarmerThread", null);
exports.AdminChatController = AdminChatController = __decorate([
    (0, common_1.Controller)('admin-chat'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [admin_chat_service_1.AdminChatService])
], AdminChatController);
//# sourceMappingURL=admin-chat.controller.js.map