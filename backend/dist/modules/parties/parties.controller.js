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
exports.PartiesController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const parties_service_1 = require("./parties.service");
const create_party_dto_1 = require("./dto/create-party.dto");
const record_sale_ledger_dto_1 = require("./dto/record-sale-ledger.dto");
const record_payment_dto_1 = require("./dto/record-payment.dto");
const create_unified_party_dto_1 = require("./dto/create-unified-party.dto");
const record_arhtiya_advance_dto_1 = require("./dto/record-arhtiya-advance.dto");
const record_arhtiya_crop_sale_dto_1 = require("./dto/record-arhtiya-crop-sale.dto");
let PartiesController = class PartiesController {
    partiesService;
    constructor(partiesService) {
        this.partiesService = partiesService;
    }
    create(user, dto) {
        return this.partiesService.create(user, dto.name, dto.address, dto.mobile);
    }
    update(user, id, dto) {
        return this.partiesService.update(user, id, dto);
    }
    listMine(user) {
        return this.partiesService.listMine(user);
    }
    getStatement(user, id) {
        return this.partiesService.getStatement(user, id);
    }
    recordSaleLedger(user, id, dto) {
        return this.partiesService.recordSaleLedger(user, id, dto);
    }
    recordPaymentReceived(user, id, dto) {
        return this.partiesService.recordPaymentReceived(user, id, dto);
    }
    recordPaymentMade(user, id, dto) {
        return this.partiesService.recordPaymentMade(user, id, dto);
    }
    createUnifiedParty(user, dto) {
        return this.partiesService.createUnifiedParty(user, dto);
    }
    listUnifiedParties(user, role) {
        return this.partiesService.listUnifiedParties(user, role);
    }
    recordArhtiyaAdvance(user, dto) {
        return this.partiesService.recordArhtiyaAdvance(user, dto);
    }
    recordArhtiyaCropSale(user, dto) {
        return this.partiesService.recordArhtiyaCropSale(user, dto);
    }
    getArhtiyaLedgerHisab(user, id) {
        return this.partiesService.getArhtiyaLedgerHisab(user, id);
    }
};
exports.PartiesController = PartiesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_party_dto_1.CreatePartyDto]),
    __metadata("design:returntype", void 0)
], PartiesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], PartiesController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PartiesController.prototype, "listMine", null);
__decorate([
    (0, common_1.Get)(':id/statement'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PartiesController.prototype, "getStatement", null);
__decorate([
    (0, common_1.Post)(':id/ledger/sale'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, record_sale_ledger_dto_1.RecordSaleLedgerDto]),
    __metadata("design:returntype", void 0)
], PartiesController.prototype, "recordSaleLedger", null);
__decorate([
    (0, common_1.Post)(':id/ledger/payment-received'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, record_payment_dto_1.RecordPaymentDto]),
    __metadata("design:returntype", void 0)
], PartiesController.prototype, "recordPaymentReceived", null);
__decorate([
    (0, common_1.Post)(':id/ledger/payment-made'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, record_payment_dto_1.RecordPaymentDto]),
    __metadata("design:returntype", void 0)
], PartiesController.prototype, "recordPaymentMade", null);
__decorate([
    (0, common_1.Post)('unified'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_unified_party_dto_1.CreateUnifiedPartyDto]),
    __metadata("design:returntype", void 0)
], PartiesController.prototype, "createUnifiedParty", null);
__decorate([
    (0, common_1.Get)('unified'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PartiesController.prototype, "listUnifiedParties", null);
__decorate([
    (0, common_1.Post)('arhtiya/advance'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, record_arhtiya_advance_dto_1.RecordArhtiyaAdvanceDto]),
    __metadata("design:returntype", void 0)
], PartiesController.prototype, "recordArhtiyaAdvance", null);
__decorate([
    (0, common_1.Post)('arhtiya/crop-sale'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, record_arhtiya_crop_sale_dto_1.RecordArhtiyaCropSaleDto]),
    __metadata("design:returntype", void 0)
], PartiesController.prototype, "recordArhtiyaCropSale", null);
__decorate([
    (0, common_1.Get)('arhtiya/:id/hisab'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PartiesController.prototype, "getArhtiyaLedgerHisab", null);
exports.PartiesController = PartiesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.LABOUR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Controller)('parties'),
    __metadata("design:paramtypes", [parties_service_1.PartiesService])
], PartiesController);
//# sourceMappingURL=parties.controller.js.map