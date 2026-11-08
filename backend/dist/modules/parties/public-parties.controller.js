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
exports.PublicPartiesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const parties_service_1 = require("./parties.service");
const lookup_buyer_statement_dto_1 = require("./dto/lookup-buyer-statement.dto");
let PublicPartiesController = class PublicPartiesController {
    constructor(partiesService) {
        this.partiesService = partiesService;
    }
    lookupStatement(dto) {
        return this.partiesService.lookupBuyerStatement(dto.buyerMobile, dto.farmerMobileOrKingId);
    }
};
exports.PublicPartiesController = PublicPartiesController;
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'Lookup buyer statement with a specific farmer',
        description: 'Allows a crop buyer or shopkeeper to view their khata ledger and bills recorded by a farmer by providing their own mobile number and the farmer mobile/King ID.',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Statement successfully retrieved or clean empty report returned.',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Invalid input parameters or malformed mobile number.',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Farmer account not found with the provided mobile number or King ID.',
    }),
    (0, throttler_1.Throttle)({ default: { limit: 60, ttl: 60_000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('lookup-statement'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [lookup_buyer_statement_dto_1.LookupBuyerStatementDto]),
    __metadata("design:returntype", void 0)
], PublicPartiesController.prototype, "lookupStatement", null);
exports.PublicPartiesController = PublicPartiesController = __decorate([
    (0, swagger_1.ApiTags)('Public - Parties & Khata'),
    (0, common_1.Controller)('parties/public'),
    __metadata("design:paramtypes", [parties_service_1.PartiesService])
], PublicPartiesController);
//# sourceMappingURL=public-parties.controller.js.map