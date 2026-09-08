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
var PhonePeWebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhonePeWebhookController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const phonepe_service_1 = require("./phonepe.service");
let PhonePeWebhookController = PhonePeWebhookController_1 = class PhonePeWebhookController {
    prisma;
    phonePeService;
    notificationsService;
    logger = new common_1.Logger(PhonePeWebhookController_1.name);
    constructor(prisma, phonePeService, notificationsService) {
        this.prisma = prisma;
        this.phonePeService = phonePeService;
        this.notificationsService = notificationsService;
    }
    async handleWebhook(authorization, body) {
        if (!this.phonePeService.verifyWebhookAuth(authorization)) {
            this.logger.warn('Rejected PhonePe webhook with invalid Authorization header.');
            return { status: 'ignored' };
        }
        const merchantOrderId = body.payload?.merchantOrderId;
        if (!merchantOrderId) {
            return { status: 'ignored' };
        }
        const order = await this.prisma.customerOrder.findUnique({ where: { phonepeMerchantOrderId: merchantOrderId } });
        if (!order) {
            this.logger.warn(`PhonePe webhook for unknown merchantOrderId: ${merchantOrderId}`);
            return { status: 'ignored' };
        }
        const nextStatus = body.payload.state === 'COMPLETED' ? 'PAID' : body.payload.state === 'FAILED' ? 'FAILED' : 'PENDING';
        if (order.paymentStatus !== nextStatus) {
            await this.prisma.customerOrder.update({
                where: { id: order.id },
                data: { paymentStatus: nextStatus, phonepePaymentState: body.payload.state },
            });
            if (nextStatus === 'PAID') {
                await this.notificationsService.create(order.customerId, client_1.NotificationType.SYSTEM, 'Payment received', `Payment for order ${order.orderNumber} was successful.`, { orderId: order.id });
            }
            else if (nextStatus === 'FAILED') {
                await this.notificationsService.create(order.customerId, client_1.NotificationType.SYSTEM, 'Payment failed', `Payment for order ${order.orderNumber} could not be completed. You can retry from My Orders.`, { orderId: order.id });
            }
        }
        return { status: 'ok' };
    }
};
exports.PhonePeWebhookController = PhonePeWebhookController;
__decorate([
    (0, common_1.Post)('webhook'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PhonePeWebhookController.prototype, "handleWebhook", null);
exports.PhonePeWebhookController = PhonePeWebhookController = PhonePeWebhookController_1 = __decorate([
    (0, common_1.Controller)('payments/phonepe'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        phonepe_service_1.PhonePeService,
        notifications_service_1.NotificationsService])
], PhonePeWebhookController);
//# sourceMappingURL=phonepe-webhook.controller.js.map