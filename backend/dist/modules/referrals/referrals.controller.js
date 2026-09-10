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
exports.ReferralsController = exports.LinkReferralDto = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const referrals_service_1 = require("./referrals.service");
class LinkReferralDto {
    referrerKingId;
}
exports.LinkReferralDto = LinkReferralDto;
let ReferralsController = class ReferralsController {
    referralsService;
    constructor(referralsService) {
        this.referralsService = referralsService;
    }
    getMyReferralNetwork(user) {
        return this.referralsService.getMyReferralNetwork(user);
    }
    linkReferralOnSignUp(user, dto) {
        return this.referralsService.linkReferralOnSignUp(user.id, dto.referrerKingId);
    }
};
exports.ReferralsController = ReferralsController;
__decorate([
    (0, common_1.Get)('my-network'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReferralsController.prototype, "getMyReferralNetwork", null);
__decorate([
    (0, common_1.Post)('link'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, LinkReferralDto]),
    __metadata("design:returntype", void 0)
], ReferralsController.prototype, "linkReferralOnSignUp", null);
exports.ReferralsController = ReferralsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('referrals'),
    __metadata("design:paramtypes", [referrals_service_1.ReferralsService])
], ReferralsController);
//# sourceMappingURL=referrals.controller.js.map