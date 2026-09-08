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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const orders_service_1 = require("./orders.service");
const create_order_dto_1 = require("./dto/create-order.dto");
const dispatch_order_dto_1 = require("./dto/dispatch-order.dto");
const initiate_phonepe_payment_dto_1 = require("./dto/initiate-phonepe-payment.dto");
const STAFF_ROLES = [client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.OPERATOR];
let OrdersController = class OrdersController {
    ordersService;
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    create(user, dto) {
        return this.ordersService.create(user, dto);
    }
    findMine(user) {
        return this.ordersService.findMine(user);
    }
    findFulfillmentQueue() {
        return this.ordersService.findFulfillmentQueue();
    }
    findAll(status) {
        return this.ordersService.findAll(status);
    }
    findOne(user, id) {
        return this.ordersService.findOneOrThrow(user, id);
    }
    getUpiLink(user, id) {
        return this.ordersService.getUpiLink(user, id);
    }
    initiatePhonePePayment(user, id, dto) {
        return this.ordersService.initiatePhonePePayment(user, id, dto.redirectUrl);
    }
    getPhonePePaymentStatus(user, id) {
        return this.ordersService.getPhonePePaymentStatus(user, id);
    }
    confirm(user, id) {
        return this.ordersService.confirm(user, id);
    }
    cancel(user, id) {
        return this.ordersService.cancel(user, id);
    }
    startPacking(user, id) {
        return this.ordersService.startPacking(user, id);
    }
    markPacked(user, id) {
        return this.ordersService.markPacked(user, id);
    }
    dispatch(user, id, dto) {
        return this.ordersService.dispatch(user, id, dto);
    }
    markDelivered(user, id) {
        return this.ordersService.markDelivered(user, id);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR),
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_order_dto_1.CreateOrderDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR),
    (0, common_1.Get)('mine'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findMine", null);
__decorate([
    (0, roles_decorator_1.Roles)(...STAFF_ROLES),
    (0, common_1.Get)('fulfillment-queue'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findFulfillmentQueue", null);
__decorate([
    (0, roles_decorator_1.Roles)(...STAFF_ROLES),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findAll", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR, ...STAFF_ROLES),
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR, ...STAFF_ROLES),
    (0, common_1.Get)(':id/upi-link'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getUpiLink", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR),
    (0, common_1.Post)(':id/phonepe/initiate'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, initiate_phonepe_payment_dto_1.InitiatePhonePePaymentDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "initiatePhonePePayment", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR, ...STAFF_ROLES),
    (0, common_1.Get)(':id/phonepe/status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getPhonePePaymentStatus", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.OPERATOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)(':id/confirm'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "confirm", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR, client_1.Role.OPERATOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)(':id/cancel'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "cancel", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.OPERATOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)(':id/start-packing'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "startPacking", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.OPERATOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)(':id/mark-packed'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "markPacked", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.OPERATOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)(':id/dispatch'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dispatch_order_dto_1.DispatchOrderDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "dispatch", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.OPERATOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)(':id/mark-delivered'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "markDelivered", null);
exports.OrdersController = OrdersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('orders'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map