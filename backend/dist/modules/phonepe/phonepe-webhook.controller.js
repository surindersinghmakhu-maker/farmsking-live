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
    constructor(prisma, phonePeService, notificationsService) {
        this.prisma = prisma;
        this.phonePeService = phonePeService;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(PhonePeWebhookController_1.name);
    }
    async getStatus(merchantOrderId) {
        try {
            const res = await this.phonePeService.checkStatus(merchantOrderId);
            if (res.state === 'COMPLETED') {
                await this.handleSuccessFulfillment(merchantOrderId, res.orderId, res.amount / 100);
            }
            return { success: true, ...res };
        }
        catch (err) {
            return { success: false, state: 'PENDING', message: err?.message || 'Status check failed' };
        }
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
        if (body.payload.state === 'COMPLETED') {
            await this.handleSuccessFulfillment(merchantOrderId, body.payload.orderId, body.payload.amount / 100);
            return { status: 'ok' };
        }
        if (merchantOrderId.startsWith('PLAN-')) {
            const requestId = merchantOrderId.replace('PLAN-', '');
            if (body.payload.state === 'FAILED') {
                await this.prisma.farmerPlanPaymentRequest.updateMany({
                    where: { id: requestId, status: client_1.PlanPaymentStatus.PENDING },
                    data: { status: client_1.PlanPaymentStatus.REJECTED, rejectionReason: 'PhonePe payment failed or cancelled.' },
                });
            }
            return { status: 'ok' };
        }
        const order = await this.prisma.customerOrder.findFirst({
            where: {
                OR: [
                    { phonepeMerchantOrderId: merchantOrderId },
                    { orderNumber: merchantOrderId },
                ],
            },
        });
        if (!order) {
            this.logger.warn(`PhonePe webhook for unknown merchantOrderId: ${merchantOrderId}`);
            return { status: 'ignored' };
        }
        const nextStatus = body.payload.state === 'FAILED' ? client_1.OrderPaymentStatus.FAILED : client_1.OrderPaymentStatus.PENDING;
        if (order.paymentStatus !== nextStatus) {
            await this.prisma.customerOrder.update({
                where: { id: order.id },
                data: { paymentStatus: nextStatus, phonepePaymentState: body.payload.state },
            });
            if (nextStatus === client_1.OrderPaymentStatus.FAILED) {
                await this.notificationsService.create(order.customerId, client_1.NotificationType.SYSTEM, 'Payment failed', `Payment for order ${order.orderNumber} could not be completed. You can retry from My Orders.`, { orderId: order.id });
            }
        }
        return { status: 'ok' };
    }
    async handleSuccessFulfillment(merchantOrderId, phonepeOrderId, amountRupees) {
        if (merchantOrderId.startsWith('PLAN-')) {
            const requestId = merchantOrderId.replace('PLAN-', '');
            const req = await this.prisma.farmerPlanPaymentRequest.findUnique({
                where: { id: requestId },
                include: { farmer: true },
            });
            if (req && req.status !== client_1.PlanPaymentStatus.CONFIRMED) {
                await this.prisma.farmerPlanPaymentRequest.update({
                    where: { id: requestId },
                    data: {
                        status: client_1.PlanPaymentStatus.CONFIRMED,
                        utr: `PHONEPE-${phonepeOrderId || 'PAID'}`,
                        submittedAt: new Date(),
                        confirmedAt: new Date(),
                    },
                });
                const prefix = req.targetPlan === client_1.FarmerSubscriptionPlan.PRO ? 'FB' : req.targetPlan === client_1.FarmerSubscriptionPlan.SMART ? 'FP' : 'FS';
                const code = `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;
                const isAdvisorPlan = req.targetPlan === client_1.FarmerSubscriptionPlan.SMART ||
                    req.targetPlan === client_1.FarmerSubscriptionPlan.SUPER ||
                    req.targetPlan === client_1.FarmerSubscriptionPlan.GOLD ||
                    req.targetPlan === client_1.FarmerSubscriptionPlan.ROYAL;
                await this.prisma.farmerPlanCoupon.create({
                    data: {
                        code,
                        category: isAdvisorPlan ? client_1.PlanCouponCategory.DOCTOR_CONSULTATION : client_1.PlanCouponCategory.FARMER_PLAN,
                        plan: req.targetPlan,
                        daysGranted: req.daysGranted,
                        assignedFarmerId: req.farmerId,
                        assignedAdvisorId: req.selectedAdvisorId ?? undefined,
                        doctorKingId: req.doctorKingId ?? null,
                        advisorKingId: req.advisorKingId ?? null,
                        createdById: req.farmerId,
                        createdByRole: client_1.Role.FARMER,
                        isUsed: true,
                        usedAt: new Date(),
                        usedByFarmerId: req.farmerId,
                        generationCostAmount: req.amount,
                    },
                });
                await this.notificationsService.create(req.farmerId, client_1.NotificationType.SYSTEM, 'VIP Plan Activated', `Payment of ₹${amountRupees || req.amount} verified via PhonePe. Your ${req.targetPlan} plan is active!`, { farmerPlanPaymentRequestId: requestId, couponCode: code });
                this.logger.log(`PhonePe plan payment ${requestId} confirmed for farmer ${req.farmer.name}`);
            }
            return;
        }
        const order = await this.prisma.customerOrder.findFirst({
            where: {
                OR: [
                    { phonepeMerchantOrderId: merchantOrderId },
                    { orderNumber: merchantOrderId },
                ],
            },
        });
        if (order && order.paymentStatus !== client_1.OrderPaymentStatus.PAID) {
            await this.prisma.customerOrder.update({
                where: { id: order.id },
                data: { paymentStatus: client_1.OrderPaymentStatus.PAID, phonepePaymentState: 'COMPLETED' },
            });
            await this.notificationsService.create(order.customerId, client_1.NotificationType.SYSTEM, 'Payment received', `Payment for order ${order.orderNumber} was successful.`, { orderId: order.id });
        }
    }
};
exports.PhonePeWebhookController = PhonePeWebhookController;
__decorate([
    (0, common_1.Get)('status/:merchantOrderId'),
    __param(0, (0, common_1.Param)('merchantOrderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PhonePeWebhookController.prototype, "getStatus", null);
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