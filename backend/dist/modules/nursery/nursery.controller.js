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
exports.NurseryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const nursery_service_1 = require("./nursery.service");
const create_nursery_batch_dto_1 = require("./dto/create-nursery-batch.dto");
const create_nursery_order_dto_1 = require("./dto/create-nursery-order.dto");
const confirm_delivery_dto_1 = require("./dto/confirm-delivery.dto");
const extend_date_dto_1 = require("./dto/extend-date.dto");
const cancel_nursery_order_dto_1 = require("./dto/cancel-nursery-order.dto");
const log_enquiry_dto_1 = require("./dto/log-enquiry.dto");
const update_dispatch_dto_1 = require("./dto/update-dispatch.dto");
const client_1 = require("@prisma/client");
let NurseryController = class NurseryController {
    constructor(nurseryService) {
        this.nurseryService = nurseryService;
    }
    async listBatches(category, search, isFlashSaleOnly, page, limit) {
        return this.nurseryService.listBatches({
            category,
            search,
            isFlashSaleOnly: isFlashSaleOnly === 'true',
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
        });
    }
    async getBatchById(id) {
        return this.nurseryService.getBatchById(id);
    }
    async createOrder(user, dto) {
        return this.nurseryService.createOrder(user.id, dto);
    }
    async getMyOrders(user) {
        return this.nurseryService.getMyOrders(user.id);
    }
    async getOrderById(user, id) {
        return this.nurseryService.getOrderById(user.id, id);
    }
    async confirmDeliveryReceived(user, id, dto) {
        return this.nurseryService.confirmDeliveryReceived(user.id, id, dto);
    }
    async extendOrderDate(user, id, dto) {
        return this.nurseryService.extendOrderDate(user.id, id, dto);
    }
    async cancelOrder(user, id, dto) {
        return this.nurseryService.cancelOrder(user.id, id, dto);
    }
    async createBatch(user, dto) {
        return this.nurseryService.createBatch(user.id, dto);
    }
    async getMyGrowerBatches(user) {
        return this.nurseryService.getMyGrowerBatches(user.id);
    }
    async getMyGrowerOrders(user) {
        return this.nurseryService.getMyGrowerOrders(user.id);
    }
    async updateDispatchDetails(user, id, dto) {
        return this.nurseryService.updateDispatchDetails(user.id, id, dto);
    }
    async logEnquiryTicket(user, dto) {
        return this.nurseryService.logEnquiryTicket(user.id, dto);
    }
    async getAgentOrders(user) {
        return this.nurseryService.getAgentOrders(user.id);
    }
};
exports.NurseryController = NurseryController;
__decorate([
    (0, common_1.Get)('batches'),
    (0, swagger_1.ApiOperation)({ summary: 'List ready-for-sale nursery seedling batches' }),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('isFlashSaleOnly')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], NurseryController.prototype, "listBatches", null);
__decorate([
    (0, common_1.Get)('batches/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get details of a specific nursery batch' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NurseryController.prototype, "getBatchById", null);
__decorate([
    (0, common_1.Post)('orders'),
    (0, swagger_1.ApiOperation)({ summary: 'Book nursery seedlings with central escrow protection' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_nursery_order_dto_1.CreateNurseryOrderDto]),
    __metadata("design:returntype", Promise)
], NurseryController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Get)('my-orders'),
    (0, swagger_1.ApiOperation)({ summary: 'List orders placed by the current logged-in buyer' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NurseryController.prototype, "getMyOrders", null);
__decorate([
    (0, common_1.Get)('orders/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get detailed order tracking and delivery details' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NurseryController.prototype, "getOrderById", null);
__decorate([
    (0, common_1.Post)('orders/:id/confirm-delivery'),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm delivery via 4-digit OTP and trigger escrow payout release' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, confirm_delivery_dto_1.ConfirmDeliveryDto]),
    __metadata("design:returntype", Promise)
], NurseryController.prototype, "confirmDeliveryReceived", null);
__decorate([
    (0, common_1.Post)('orders/:id/extend-date'),
    (0, swagger_1.ApiOperation)({ summary: 'Extend delivery date for free (>48h notice required)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, extend_date_dto_1.ExtendDateDto]),
    __metadata("design:returntype", Promise)
], NurseryController.prototype, "extendOrderDate", null);
__decorate([
    (0, common_1.Post)('orders/:id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel order subject to 3-tier cancellation fine schedule' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, cancel_nursery_order_dto_1.CancelNurseryOrderDto]),
    __metadata("design:returntype", Promise)
], NurseryController.prototype, "cancelOrder", null);
__decorate([
    (0, common_1.Post)('grower/batches'),
    (0, swagger_1.ApiOperation)({ summary: 'List a new seedling/plug batch for sale' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_nursery_batch_dto_1.CreateNurseryBatchDto]),
    __metadata("design:returntype", Promise)
], NurseryController.prototype, "createBatch", null);
__decorate([
    (0, common_1.Get)('grower/batches'),
    (0, swagger_1.ApiOperation)({ summary: 'List all batches owned by the logged-in grower' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NurseryController.prototype, "getMyGrowerBatches", null);
__decorate([
    (0, common_1.Get)('grower/orders'),
    (0, swagger_1.ApiOperation)({ summary: 'List incoming orders for the logged-in grower' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NurseryController.prototype, "getMyGrowerOrders", null);
__decorate([
    (0, common_1.Patch)('grower/orders/:id/dispatch'),
    (0, swagger_1.ApiOperation)({ summary: 'Update bus/railway parcel tracking info and mark dispatched' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_dispatch_dto_1.UpdateDispatchDto]),
    __metadata("design:returntype", Promise)
], NurseryController.prototype, "updateDispatchDetails", null);
__decorate([
    (0, common_1.Post)('agent/enquiry'),
    (0, swagger_1.ApiOperation)({ summary: 'Agent logs enquiry/issue on behalf of farmer' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, log_enquiry_dto_1.LogEnquiryDto]),
    __metadata("design:returntype", Promise)
], NurseryController.prototype, "logEnquiryTicket", null);
__decorate([
    (0, common_1.Get)('agent/orders'),
    (0, swagger_1.ApiOperation)({ summary: 'Get assigned orders for field agent coordination' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NurseryController.prototype, "getAgentOrders", null);
exports.NurseryController = NurseryController = __decorate([
    (0, swagger_1.ApiTags)('Nursery Marketplace'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('nursery'),
    __metadata("design:paramtypes", [nursery_service_1.NurseryService])
], NurseryController);
//# sourceMappingURL=nursery.controller.js.map