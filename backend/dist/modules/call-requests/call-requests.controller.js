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
exports.CallRequestsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const call_requests_service_1 = require("./call-requests.service");
const resolve_call_request_dto_1 = require("./dto/resolve-call-request.dto");
let CallRequestsController = class CallRequestsController {
    callRequestsService;
    constructor(callRequestsService) {
        this.callRequestsService = callRequestsService;
    }
    create(user) {
        return this.callRequestsService.create(user);
    }
    getMyPending(user) {
        return this.callRequestsService.getMyPending(user);
    }
    listMine(user) {
        return this.callRequestsService.listMine(user);
    }
    resolve(user, id, dto) {
        return this.callRequestsService.resolve(user, id, dto);
    }
};
exports.CallRequestsController = CallRequestsController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.GARDENER),
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CallRequestsController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.GARDENER),
    (0, common_1.Get)('mine/pending'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CallRequestsController.prototype, "getMyPending", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Get)('mine'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CallRequestsController.prototype, "listMine", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Patch)(':id/resolve'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, resolve_call_request_dto_1.ResolveCallRequestDto]),
    __metadata("design:returntype", void 0)
], CallRequestsController.prototype, "resolve", null);
exports.CallRequestsController = CallRequestsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('call-requests'),
    __metadata("design:paramtypes", [call_requests_service_1.CallRequestsService])
], CallRequestsController);
//# sourceMappingURL=call-requests.controller.js.map