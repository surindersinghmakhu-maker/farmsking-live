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
exports.VoiceAIController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const voice_ai_service_1 = require("./voice-ai.service");
let VoiceAIController = class VoiceAIController {
    voiceAIService;
    constructor(voiceAIService) {
        this.voiceAIService = voiceAIService;
    }
    processVoiceCommand(user, dto) {
        return this.voiceAIService.processVoiceCommand(user, dto);
    }
    getVoiceHistory(user) {
        return this.voiceAIService.getVoiceHistory(user);
    }
};
exports.VoiceAIController = VoiceAIController;
__decorate([
    (0, common_1.Post)('command'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, voice_ai_service_1.ProcessVoiceDto]),
    __metadata("design:returntype", void 0)
], VoiceAIController.prototype, "processVoiceCommand", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VoiceAIController.prototype, "getVoiceHistory", null);
exports.VoiceAIController = VoiceAIController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('ai/voice'),
    __metadata("design:paramtypes", [voice_ai_service_1.VoiceAIService])
], VoiceAIController);
//# sourceMappingURL=voice-ai.controller.js.map