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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const coupons_service_1 = require("../coupons/coupons.service");
const wallet_service_1 = require("../wallet/wallet.service");
const app_settings_service_1 = require("../app-settings/app-settings.service");
const phonepe_service_1 = require("../phonepe/phonepe.service");
const upi_util_1 = require("../../common/utils/upi.util");
const DETAIL_INCLUDE = {
    items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
    customer: { select: { id: true, name: true, mobile: true } },
    packedBy: { select: { id: true, name: true } },
    dispatchedBy: { select: { id: true, name: true } },
};
function generateOrderNumber() {
    return `ORD-${Date.now().toString(36).toUpperCase()}-${(0, crypto_1.randomBytes)(2).toString('hex').toUpperCase()}`;
}
let OrdersService = class OrdersService {
    prisma;
    notificationsService;
    couponsService;
    walletService;
    appSettingsService;
    phonePeService;
    constructor(prisma, notificationsService, couponsService, walletService, appSettingsService, phonePeService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.couponsService = couponsService;
        this.walletService = walletService;
        this.appSettingsService = appSettingsService;
        this.phonePeService = phonePeService;
    }
    async create(customer, dto) {
        const productIds = dto.items.map((i) => i.productId);
        const products = await this.prisma.product.findMany({ where: { id: { in: productIds }, isActive: true } });
        const productMap = new Map(products.map((p) => [p.id, p]));
        for (const item of dto.items) {
            const product = productMap.get(item.productId);
            if (!product) {
                throw new common_1.NotFoundException(`Product ${item.productId} not found or unavailable.`);
            }
            if (product.stockQty < item.quantity) {
                throw new common_1.BadRequestException(`Not enough stock for "${product.name}" (available: ${product.stockQty}).`);
            }
        }
        const subtotal = dto.items.reduce((sum, item) => sum + Number(productMap.get(item.productId).price) * item.quantity, 0);
        const couponResult = dto.couponCode ? await this.couponsService.getActiveForOrder(dto.couponCode, subtotal) : null;
        const discountAmount = couponResult?.discountAmount ?? 0;
        const totalAmount = subtotal - discountAmount;
        const order = await this.prisma.$transaction(async (tx) => {
            const created = await tx.customerOrder.create({
                data: {
                    customerId: customer.id,
                    orderNumber: generateOrderNumber(),
                    totalAmount,
                    deliveryAddress: dto.deliveryAddress,
                    paymentMode: dto.paymentMode ?? 'COD',
                    couponId: couponResult?.coupon.id,
                    discountAmount: couponResult ? discountAmount : undefined,
                    items: {
                        create: dto.items.map((item) => {
                            const product = productMap.get(item.productId);
                            return { productId: product.id, productName: product.name, quantity: item.quantity, price: product.price };
                        }),
                    },
                },
                include: DETAIL_INCLUDE,
            });
            await Promise.all(dto.items.map((item) => tx.product.update({ where: { id: item.productId }, data: { stockQty: { decrement: item.quantity } } })));
            if (couponResult) {
                await tx.coupon.update({ where: { id: couponResult.coupon.id }, data: { usedCount: { increment: 1 } } });
                await tx.couponRedemption.create({
                    data: {
                        couponId: couponResult.coupon.id,
                        customerId: customer.id,
                        orderId: created.id,
                        orderAmount: subtotal,
                        discountAmount,
                        commissionAmount: couponResult.commissionAmount,
                    },
                });
            }
            return created;
        });
        return order;
    }
    findMine(user) {
        return this.prisma.customerOrder.findMany({
            where: { customerId: user.id },
            include: DETAIL_INCLUDE,
            orderBy: { orderDate: 'desc' },
        });
    }
    findAll(status) {
        return this.prisma.customerOrder.findMany({
            where: status ? { status } : {},
            include: DETAIL_INCLUDE,
            orderBy: { orderDate: 'desc' },
        });
    }
    findFulfillmentQueue() {
        return this.prisma.customerOrder.findMany({
            where: {
                status: { in: [client_1.OrderStatus.PLACED, client_1.OrderStatus.CONFIRMED, client_1.OrderStatus.PACKING, client_1.OrderStatus.PACKED, client_1.OrderStatus.DISPATCHED] },
            },
            include: DETAIL_INCLUDE,
            orderBy: { orderDate: 'asc' },
        });
    }
    async findOneOrThrow(user, id) {
        const order = await this.prisma.customerOrder.findUnique({ where: { id }, include: DETAIL_INCLUDE });
        if (!order) {
            throw new common_1.NotFoundException('Order not found.');
        }
        const staffRoles = [client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.OPERATOR];
        if (order.customerId !== user.id && !staffRoles.includes(user.role)) {
            throw new common_1.ForbiddenException('You do not have access to this order.');
        }
        return order;
    }
    async getUpiLink(user, id) {
        const order = await this.findOneOrThrow(user, id);
        const settings = await this.appSettingsService.get();
        if (!settings.upiId) {
            throw new common_1.BadRequestException('UPI payment is not configured yet. Please contact support.');
        }
        const upiLink = (0, upi_util_1.buildUpiPaymentLink)({
            amount: Number(order.totalAmount),
            note: order.orderNumber,
            transactionRef: order.orderNumber,
            payeeVpa: settings.upiId,
            payeeName: settings.upiPayeeName ?? undefined,
        });
        return { upiLink, amount: Number(order.totalAmount), orderNumber: order.orderNumber };
    }
    async initiatePhonePePayment(user, id, redirectUrl) {
        const order = await this.findOneOrThrow(user, id);
        if (order.customerId !== user.id) {
            throw new common_1.ForbiddenException('You cannot pay for this order.');
        }
        if (order.paymentStatus === 'PAID') {
            throw new common_1.ConflictException('This order has already been paid for.');
        }
        const merchantOrderId = `${order.orderNumber}-${Date.now().toString(36).toUpperCase()}`;
        const result = await this.phonePeService.createPayment(merchantOrderId, Number(order.totalAmount), redirectUrl);
        await this.prisma.customerOrder.update({
            where: { id },
            data: { phonepeMerchantOrderId: merchantOrderId, phonepePaymentState: result.state, paymentStatus: 'PENDING' },
        });
        return { redirectUrl: result.redirectUrl, merchantOrderId };
    }
    async getPhonePePaymentStatus(user, id) {
        const order = await this.findOneOrThrow(user, id);
        if (!order.phonepeMerchantOrderId) {
            return { paymentStatus: order.paymentStatus };
        }
        const result = await this.phonePeService.checkStatus(order.phonepeMerchantOrderId);
        const paymentStatus = result.state === 'COMPLETED' ? 'PAID' : result.state === 'FAILED' ? 'FAILED' : 'PENDING';
        if (order.paymentStatus !== paymentStatus) {
            await this.prisma.customerOrder.update({
                where: { id },
                data: { paymentStatus, phonepePaymentState: result.state },
            });
        }
        return { paymentStatus };
    }
    async notifyCustomer(customerId, title, body, orderId) {
        await this.notificationsService.create(customerId, client_1.NotificationType.SYSTEM, title, body, { orderId });
    }
    async confirm(user, id) {
        const order = await this.findOneOrThrow(user, id);
        if (order.status !== client_1.OrderStatus.PLACED) {
            throw new common_1.ConflictException('Only newly placed orders can be confirmed.');
        }
        const updated = await this.prisma.customerOrder.update({ where: { id }, data: { status: client_1.OrderStatus.CONFIRMED }, include: DETAIL_INCLUDE });
        await this.notifyCustomer(order.customerId, 'Order confirmed', `Your order ${order.orderNumber} has been confirmed.`, id);
        await this.creditCouponCommission(id);
        return updated;
    }
    async creditCouponCommission(orderId) {
        const redemption = await this.prisma.couponRedemption.findFirst({
            where: { orderId, creditedAt: null },
            include: { coupon: true },
        });
        if (!redemption) {
            return;
        }
        await this.walletService.credit(redemption.coupon.businessPartnerId, Number(redemption.commissionAmount), `Commission from coupon ${redemption.coupon.code}`, { couponRedemptionId: redemption.id });
        await this.prisma.couponRedemption.update({ where: { id: redemption.id }, data: { creditedAt: new Date() } });
    }
    async cancel(user, id) {
        const order = await this.findOneOrThrow(user, id);
        const isStaff = user.role === client_1.Role.ADMIN || user.role === client_1.Role.SUPER_ADMIN || user.role === client_1.Role.OPERATOR;
        if (order.customerId !== user.id && !isStaff) {
            throw new common_1.ForbiddenException('You cannot cancel this order.');
        }
        if (order.status === client_1.OrderStatus.DISPATCHED || order.status === client_1.OrderStatus.DELIVERED || order.status === client_1.OrderStatus.CANCELLED) {
            throw new common_1.ConflictException(`An order that is ${order.status.toLowerCase()} cannot be cancelled.`);
        }
        if (!isStaff && order.status !== client_1.OrderStatus.PLACED) {
            throw new common_1.ConflictException('This order has already been confirmed and can no longer be cancelled. Please contact support.');
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const result = await tx.customerOrder.update({
                where: { id },
                data: { status: client_1.OrderStatus.CANCELLED, cancelledAt: new Date() },
                include: DETAIL_INCLUDE,
            });
            await Promise.all(order.items
                .filter((item) => item.productId)
                .map((item) => tx.product.update({ where: { id: item.productId }, data: { stockQty: { increment: item.quantity } } })));
            return result;
        });
        await this.notifyCustomer(order.customerId, 'Order cancelled', `Your order ${order.orderNumber} has been cancelled.`, id);
        return updated;
    }
    async startPacking(operator, id) {
        const order = await this.findOneOrThrow(operator, id);
        if (order.status !== client_1.OrderStatus.CONFIRMED) {
            throw new common_1.ConflictException('Only confirmed orders can start packing.');
        }
        return this.prisma.customerOrder.update({ where: { id }, data: { status: client_1.OrderStatus.PACKING }, include: DETAIL_INCLUDE });
    }
    async markPacked(operator, id) {
        const order = await this.findOneOrThrow(operator, id);
        if (order.status !== client_1.OrderStatus.PACKING && order.status !== client_1.OrderStatus.CONFIRMED) {
            throw new common_1.ConflictException('This order is not ready to be marked as packed.');
        }
        return this.prisma.customerOrder.update({
            where: { id },
            data: { status: client_1.OrderStatus.PACKED, packedById: operator.id, packedAt: new Date() },
            include: DETAIL_INCLUDE,
        });
    }
    async dispatch(operator, id, dto) {
        const order = await this.findOneOrThrow(operator, id);
        if (order.status !== client_1.OrderStatus.PACKED) {
            throw new common_1.ConflictException('Only packed orders can be dispatched.');
        }
        const updated = await this.prisma.customerOrder.update({
            where: { id },
            data: {
                status: client_1.OrderStatus.DISPATCHED,
                dispatchedById: operator.id,
                dispatchedAt: new Date(),
                courierName: dto.courierName,
                trackingId: dto.trackingId,
            },
            include: DETAIL_INCLUDE,
        });
        await this.notifyCustomer(order.customerId, 'Order dispatched', `Your order ${order.orderNumber} has been dispatched via ${dto.courierName}${dto.trackingId ? ` (Tracking: ${dto.trackingId})` : ''}.`, id);
        return updated;
    }
    async markDelivered(user, id) {
        const order = await this.findOneOrThrow(user, id);
        if (order.status !== client_1.OrderStatus.DISPATCHED) {
            throw new common_1.ConflictException('Only dispatched orders can be marked delivered.');
        }
        return this.prisma.customerOrder.update({
            where: { id },
            data: { status: client_1.OrderStatus.DELIVERED, deliveryDate: new Date() },
            include: DETAIL_INCLUDE,
        });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        coupons_service_1.CouponsService,
        wallet_service_1.WalletService,
        app_settings_service_1.AppSettingsService,
        phonepe_service_1.PhonePeService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map