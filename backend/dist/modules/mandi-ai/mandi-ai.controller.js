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
exports.MandiAIController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const mandi_ai_service_1 = require("./mandi-ai.service");
let MandiAIController = class MandiAIController {
    mandiAIService;
    constructor(mandiAIService) {
        this.mandiAIService = mandiAIService;
    }
    get30DayPricePrediction(cropName, mandiName) {
        return this.mandiAIService.get30DayPricePrediction(cropName, mandiName);
    }
    createPriceLockContract(user, dto) {
        return this.mandiAIService.createPriceLockContract(user, dto);
    }
    getMyPriceLockContracts(user) {
        return this.mandiAIService.getMyPriceLockContracts(user);
    }
};
exports.MandiAIController = MandiAIController;
__decorate([
    (0, common_1.Get)('predictions'),
    __param(0, (0, common_1.Query)('cropName')),
    __param(1, (0, common_1.Query)('mandiName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], MandiAIController.prototype, "get30DayPricePrediction", null);
__decorate([
    (0, common_1.Post)('price-lock'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mandi_ai_service_1.CreatePriceLockDto]),
    __metadata("design:returntype", void 0)
], MandiAIController.prototype, "createPriceLockContract", null);
__decorate([
    (0, common_1.Get)('price-locks'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MandiAIController.prototype, "getMyPriceLockContracts", null);
exports.MandiAIController = MandiAIController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('mandi-ai'),
    __metadata("design:paramtypes", [mandi_ai_service_1.MandiAIService])
], MandiAIController);
//# sourceMappingURL=mandi-ai.controller.js.map