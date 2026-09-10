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
exports.KingConnectController = void 0;
const common_1 = require("@nestjs/common");
const king_connect_service_1 = require("./king-connect.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const send_connect_request_dto_1 = require("./dto/send-connect-request.dto");
const respond_connect_dto_1 = require("./dto/respond-connect.dto");
const create_sync_request_dto_1 = require("./dto/create-sync-request.dto");
const respond_sync_request_dto_1 = require("./dto/respond-sync-request.dto");
const create_demand_request_dto_1 = require("./dto/create-demand-request.dto");
const respond_demand_request_dto_1 = require("./dto/respond-demand-request.dto");
const create_payment_request_dto_1 = require("./dto/create-payment-request.dto");
const respond_payment_request_dto_1 = require("./dto/respond-payment-request.dto");
let KingConnectController = class KingConnectController {
    service;
    constructor(service) {
        this.service = service;
    }
    sendConnectRequest(user, dto) {
        return this.service.sendConnectRequest(user, dto);
    }
    listPendingConnections(user) {
        return this.service.listPendingConnectionRequests(user);
    }
    respondToConnect(user, id, dto) {
        return this.service.respondToConnect(user, id, dto);
    }
    listConnections(user) {
        return this.service.listMyConnections(user);
    }
    toggleAutoAccept(user, id) {
        return this.service.toggleAutoAccept(user, id);
    }
    createSyncRequest(user, dto) {
        return this.service.createSyncRequest(user, dto);
    }
    listPendingSync(user) {
        return this.service.listPendingSyncRequests(user);
    }
    listSyncHistory(user) {
        return this.service.listSyncHistory(user);
    }
    respondToSync(user, id, dto) {
        return this.service.respondToSyncRequest(user, id, dto);
    }
    createDemand(user, dto) {
        return this.service.createDemandRequest(user, dto);
    }
    listDemands(user, type = 'incoming') {
        return this.service.listDemands(user, type);
    }
    respondToDemand(user, id, dto) {
        return this.service.respondToDemand(user, id, dto);
    }
    createPaymentRequest(user, dto) {
        return this.service.createPaymentRequest(user, dto);
    }
    listPaymentRequests(user, type = 'incoming') {
        return this.service.listPaymentRequests(user, type);
    }
    respondToPaymentRequest(user, id, dto) {
        return this.service.respondToPaymentRequest(user, id, dto);
    }
    getActivity(user) {
        return this.service.getActivityFeed(user);
    }
    getSharedLedger(user, linkId) {
        return this.service.getSharedLedger(user, linkId);
    }
    expireStale() {
        return this.service.expireStaleRequests();
    }
};
exports.KingConnectController = KingConnectController;
__decorate([
    (0, common_1.Post)('connect'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, send_connect_request_dto_1.SendConnectRequestDto]),
    __metadata("design:returntype", void 0)
], KingConnectController.prototype, "sendConnectRequest", null);
__decorate([
    (0, common_1.Get)('connect/pending'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KingConnectController.prototype, "listPendingConnections", null);
__decorate([
    (0, common_1.Patch)('connect/:id/respond'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, respond_connect_dto_1.RespondConnectDto]),
    __metadata("design:returntype", void 0)
], KingConnectController.prototype, "respondToConnect", null);
__decorate([
    (0, common_1.Get)('connections'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KingConnectController.prototype, "listConnections", null);
__decorate([
    (0, common_1.Patch)('connections/:id/auto-accept'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], KingConnectController.prototype, "toggleAutoAccept", null);
__decorate([
    (0, common_1.Post)('sync'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_sync_request_dto_1.CreateSyncRequestDto]),
    __metadata("design:returntype", void 0)
], KingConnectController.prototype, "createSyncRequest", null);
__decorate([
    (0, common_1.Get)('sync/pending'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KingConnectController.prototype, "listPendingSync", null);
__decorate([
    (0, common_1.Get)('sync/history'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KingConnectController.prototype, "listSyncHistory", null);
__decorate([
    (0, common_1.Patch)('sync/:id/respond'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, respond_sync_request_dto_1.RespondSyncRequestDto]),
    __metadata("design:returntype", void 0)
], KingConnectController.prototype, "respondToSync", null);
__decorate([
    (0, common_1.Post)('demands'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_demand_request_dto_1.CreateDemandRequestDto]),
    __metadata("design:returntype", void 0)
], KingConnectController.prototype, "createDemand", null);
__decorate([
    (0, common_1.Get)('demands'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], KingConnectController.prototype, "listDemands", null);
__decorate([
    (0, common_1.Patch)('demands/:id/respond'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, respond_demand_request_dto_1.RespondDemandRequestDto]),
    __metadata("design:returntype", void 0)
], KingConnectController.prototype, "respondToDemand", null);
__decorate([
    (0, common_1.Post)('payment-requests'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_payment_request_dto_1.CreatePaymentRequestDto]),
    __metadata("design:returntype", void 0)
], KingConnectController.prototype, "createPaymentRequest", null);
__decorate([
    (0, common_1.Get)('payment-requests'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], KingConnectController.prototype, "listPaymentRequests", null);
__decorate([
    (0, common_1.Patch)('payment-requests/:id/respond'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, respond_payment_request_dto_1.RespondPaymentRequestDto]),
    __metadata("design:returntype", void 0)
], KingConnectController.prototype, "respondToPaymentRequest", null);
__decorate([
    (0, common_1.Get)('activity'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KingConnectController.prototype, "getActivity", null);
__decorate([
    (0, common_1.Get)('shared-ledger/:linkId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('linkId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], KingConnectController.prototype, "getSharedLedger", null);
__decorate([
    (0, common_1.Post)('admin/expire-stale'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], KingConnectController.prototype, "expireStale", null);
exports.KingConnectController = KingConnectController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('king-connect'),
    __metadata("design:paramtypes", [king_connect_service_1.KingConnectService])
], KingConnectController);
//# sourceMappingURL=king-connect.controller.js.map