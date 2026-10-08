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
const shiprocket_service_1 = require("../shiprocket/shiprocket.service");
const cashfree_service_1 = require("../cashfree/cashfree.service");
const upi_util_1 = require("../../common/utils/upi.util");
const billing_service_1 = require("./billing.service");
const DETAIL_INCLUDE = {
    items: { include: { product: { select: { id: true, name: true, imageUrl: true, categorySlug: true, weightKg: true, isCodAllowed: true, gstPercentage: true } }, sellerStore: true } },
    subOrders: { include: { sellerStore: { select: { id: true, storeName: true, slug: true, sellerType: true, rtoBearer: true, rtoSharedVendorRatio: true, gstin: true, commissionRate: true } } } },
    customer: { select: { id: true, name: true, mobile: true, state: true } },
    packedBy: { select: { id: true, name: true } },
    dispatchedBy: { select: { id: true, name: true } },
};
function generateOrderNumber() {
    return `ORD-${Date.now().toString(36).toUpperCase()}-${(0, crypto_1.randomBytes)(2).toString('hex').toUpperCase()}`;
}
let OrdersService = class OrdersService {
    constructor(prisma, notificationsService, couponsService, walletService, appSettingsService, phonePeService, shiprocketService, cashfreeService, billingService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.couponsService = couponsService;
        this.walletService = walletService;
        this.appSettingsService = appSettingsService;
        this.phonePeService = phonePeService;
        this.shiprocketService = shiprocketService;
        this.cashfreeService = cashfreeService;
        this.billingService = billingService;
    }
    async create(customer, dto) {
        const productIds = dto.items.map((i) => i.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds }, isActive: true },
            include: { sellerStore: true },
        });
        const productMap = new Map(products.map((p) => [p.id, p]));
        let totalWeightKg = 0;
        let anyCodDisabled = false;
        const deliveryAddressStr = dto.deliveryAddress || '';
        const customerUser = await this.prisma.user.findUnique({ where: { id: customer.id } });
        const customerState = customerUser?.state?.trim().toLowerCase() || '';
        for (const item of dto.items) {
            const product = productMap.get(item.productId);
            if (!product) {
                throw new common_1.NotFoundException(`Product ${item.productId} not found or unavailable.`);
            }
            if (product.stockQty < item.quantity) {
                throw new common_1.BadRequestException(`Not enough stock for "${product.name}" (available: ${product.stockQty}).`);
            }
            const itemWeight = (product.weightKg || 0.5) * item.quantity;
            totalWeightKg += itemWeight;
            if (!product.isCodAllowed) {
                anyCodDisabled = true;
            }
        }
        const isCodRequested = dto.paymentMode === 'COD';
        if (isCodRequested && (totalWeightKg >= 25 || anyCodDisabled)) {
            throw new common_1.BadRequestException('Cash on Delivery is disabled for this order due to package weight (>= 25kg) or restricted items like Khad/Spray. Please choose online payment.');
        }
        const subtotal = dto.items.reduce((sum, item) => {
            const p = productMap.get(item.productId);
            const unitPrice = Number(p.price);
            const isWholesale = p.bulkDiscountMinQty && p.bulkDiscountPercentage && item.quantity >= p.bulkDiscountMinQty;
            const effectivePrice = isWholesale
                ? unitPrice * (1 - Number(p.bulkDiscountPercentage) / 100)
                : unitPrice;
            return sum + effectivePrice * item.quantity;
        }, 0);
        const couponResult = dto.couponCode ? await this.couponsService.getActiveForOrder(dto.couponCode, subtotal) : null;
        const discountAmount = couponResult?.discountAmount ?? 0;
        let totalAmount = subtotal - discountAmount;
        let walletDeduction = 0;
        let walletPlatformFee = 0;
        let walletGstAmount = 0;
        let platformExpense = false;
        let totalWalletDeduction = 0;
        if (dto.useWalletBalance) {
            const walletBalance = await this.walletService.getBalance(customer.id);
            if (walletBalance > 0) {
                const settings = await this.appSettingsService.get();
                const taxEnabled = settings.walletTaxEnabled ?? true;
                let feeRate = 0;
                let gstRate = 0;
                if (taxEnabled) {
                    feeRate = (settings.walletUsagePlatformFeePercent ?? 2.0) / 100;
                    gstRate = (settings.walletUsageGstPercent ?? 18.0) / 100;
                    platformExpense = true;
                }
                const costMultiplier = 1 + feeRate + feeRate * gstRate;
                const maxUsableForOrder = walletBalance / costMultiplier;
                walletDeduction = Math.min(totalAmount, maxUsableForOrder);
                walletPlatformFee = parseFloat((walletDeduction * feeRate).toFixed(2));
                walletGstAmount = parseFloat((walletPlatformFee * gstRate).toFixed(2));
                totalWalletDeduction = parseFloat((walletDeduction + walletPlatformFee + walletGstAmount).toFixed(2));
                totalAmount = parseFloat((totalAmount - walletDeduction).toFixed(2));
            }
        }
        const order = await this.prisma.$transaction(async (tx) => {
            const created = await tx.customerOrder.create({
                data: {
                    customerId: customer.id,
                    orderNumber: generateOrderNumber(),
                    totalAmount,
                    deliveryAddress: dto.deliveryAddress,
                    paymentMode: dto.paymentMode ?? client_1.OrderPaymentMode.COD,
                    couponId: couponResult?.coupon.id,
                    discountAmount: couponResult ? discountAmount : undefined,
                    walletUsedAmount: walletDeduction > 0 ? walletDeduction : undefined,
                    walletPlatformFee: walletPlatformFee > 0 ? walletPlatformFee : undefined,
                    walletGstAmount: walletGstAmount > 0 ? walletGstAmount : undefined,
                    platformExpense,
                    items: {
                        create: dto.items.map((item) => {
                            const product = productMap.get(item.productId);
                            const itemSubtotal = Number(product.price) * item.quantity;
                            const itemTcs = itemSubtotal * 0.01;
                            return {
                                productId: product.id,
                                productName: product.name,
                                quantity: item.quantity,
                                price: product.price,
                                sellerStoreId: product.sellerStoreId,
                                subtotal: itemSubtotal,
                                tcsAmount: itemTcs,
                            };
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
            if (walletDeduction > 0) {
                await this.walletService.debit(customer.id, walletDeduction, `Paid for Order #${created.orderNumber}`);
            }
            const vendorGroupMap = new Map();
            for (const item of dto.items) {
                const product = productMap.get(item.productId);
                const storeId = product.sellerStoreId || 'PLATFORM';
                const existing = vendorGroupMap.get(storeId) || [];
                existing.push(item);
                vendorGroupMap.set(storeId, existing);
            }
            for (const [storeId, groupItems] of vendorGroupMap.entries()) {
                if (storeId === 'PLATFORM')
                    continue;
                const store = await tx.sellerStore.findUnique({ where: { id: storeId } });
                if (!store)
                    continue;
                let groupSubtotal = 0;
                let groupCommissionAmount = 0;
                groupItems.forEach((item) => {
                    const product = productMap.get(item.productId);
                    const itemSub = Number(product.price) * item.quantity;
                    const commRate = Number(product.commissionOverridePercentage ?? store.commissionRate ?? 8.0);
                    const commAmt = (itemSub * commRate) / 100;
                    groupSubtotal += itemSub;
                    groupCommissionAmount += commAmt;
                });
                const vendorNetPayout = groupSubtotal - groupCommissionAmount;
                await tx.subOrder.create({
                    data: {
                        orderId: created.id,
                        sellerStoreId: storeId,
                        subtotal: groupSubtotal,
                        commissionAmount: groupCommissionAmount,
                        vendorNetPayout,
                        orderStatus: client_1.SubOrderStatus.PLACED,
                    },
                });
            }
            return created;
        });
        this.billingService.createInvoicesForOrder(order.id).catch((err) => console.warn('Billing & GST Invoice auto-generation notice:', err));
        this.notifyCustomer(customer.id, '🛒 Order Booked Successfully', `Your FarmsKing Order #${order.orderNumber} of ₹${order.totalAmount} has been booked successfully.`, order.id, 'ORDER_PLACED_SMS').catch((err) => console.warn('Order booking SMS notification notice:', err));
        return order;
    }
    async triggerShiprocketSubOrders(orderId) {
        const order = await this.prisma.customerOrder.findUnique({
            where: { id: orderId },
            include: {
                items: { include: { product: true, sellerStore: true } },
                subOrders: { include: { sellerStore: true } },
                customer: true,
            },
        });
        if (!order)
            return;
        for (const subOrder of order.subOrders) {
            const store = subOrder.sellerStore;
            const pickupNickname = store.shiprocketPickupNickname || `HUB_${store.slug.substring(0, 10).toUpperCase()}`;
            const vendorItems = order.items.filter((i) => i.sellerStoreId === store.id);
            if (vendorItems.length === 0)
                continue;
            const subOrderItems = vendorItems.map((i) => ({
                name: i.productName,
                sku: i.product?.sku || 'FK-PROD',
                units: i.quantity,
                sellingPrice: Number(i.price),
                hsn: i.product?.hsnCode || '120991',
            }));
            try {
                const totalWeight = vendorItems.reduce((acc, curr) => acc + (curr.product?.weightKg || 0.5) * curr.quantity, 0);
                const srRes = await this.shiprocketService.createShipmentOrder({
                    orderId: `${order.orderNumber}-${store.id.substring(0, 4)}`,
                    orderDate: new Date().toISOString().split('T')[0],
                    pickupLocation: pickupNickname,
                    billingCustomerName: order.customer.name,
                    billingAddress: order.deliveryAddress || 'Customer Address',
                    billingCity: order.customer.district || 'Ludhiana',
                    billingPincode: order.customer.pincode || '141001',
                    billingState: order.customer.state || 'Punjab',
                    billingCountry: 'India',
                    billingPhone: order.customer.mobile,
                    weight: totalWeight || 0.5,
                    orderItems: subOrderItems,
                }, store.id);
                if (srRes?.order_id) {
                    await this.prisma.subOrder.update({
                        where: { id: subOrder.id },
                        data: {
                            shiprocketOrderId: srRes.order_id.toString(),
                            shiprocketShipmentId: srRes.shipment_id?.toString(),
                        },
                    });
                }
            }
            catch (err) {
                console.warn(`Shiprocket shipment creation failed for store ${store.storeName}:`, err);
            }
        }
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
    async initiateCashfreePayment(user, id) {
        const order = await this.findOneOrThrow(user, id);
        if (order.customerId !== user.id) {
            throw new common_1.ForbiddenException('You cannot pay for this order.');
        }
        if (order.paymentStatus === client_1.OrderPaymentStatus.PAID) {
            throw new common_1.ConflictException('This order has already been paid for.');
        }
        const splits = order.subOrders.map(subOrder => ({
            cashfreeVendorId: subOrder.sellerStore?.cashfreeVendorId,
            itemSubtotal: Number(subOrder.subtotal),
            commissionRate: Number(subOrder.sellerStore.commissionRate || 8.0)
        })).filter(s => s.cashfreeVendorId);
        const result = await this.cashfreeService.createSplitOrder({
            orderId: order.orderNumber,
            amount: Number(order.totalAmount),
            customerId: order.customerId,
            customerPhone: order.customer.mobile,
            customerName: order.customer.name,
            splits: splits,
        });
        await this.prisma.customerOrder.update({
            where: { id },
            data: { phonepeMerchantOrderId: result.orderId, phonepePaymentState: result.orderStatus, paymentStatus: client_1.OrderPaymentStatus.PENDING },
        });
        return { paymentSessionId: result.paymentSessionId, orderId: result.orderId };
    }
    async getCashfreePaymentStatus(user, id) {
        const order = await this.findOneOrThrow(user, id);
        const result = await this.cashfreeService.verifyPayment(order.orderNumber);
        const paymentStatus = result.order_status === 'PAID' ? client_1.OrderPaymentStatus.PAID : result.order_status === 'FAILED' ? client_1.OrderPaymentStatus.FAILED : client_1.OrderPaymentStatus.PENDING;
        if (order.paymentStatus !== paymentStatus) {
            await this.prisma.customerOrder.update({
                where: { id },
                data: { paymentStatus, phonepePaymentState: result.order_status },
            });
        }
        return { paymentStatus };
    }
    async notifyCustomer(customerId, title, body, orderId, eventType) {
        await this.notificationsService.create(customerId, client_1.NotificationType.SYSTEM, title, body, { orderId, eventType });
        console.log(`[Firebase Text SMS Service] Sent ${eventType || 'ORDER_ALERT'} to User ${customerId}: "${title} - ${body}"`);
    }
    async confirm(user, id) {
        const order = await this.findOneOrThrow(user, id);
        if (order.status !== client_1.OrderStatus.PLACED) {
            throw new common_1.ConflictException('Only newly placed orders can be confirmed.');
        }
        const updated = await this.prisma.customerOrder.update({ where: { id }, data: { status: client_1.OrderStatus.CONFIRMED }, include: DETAIL_INCLUDE });
        await this.prisma.subOrder.updateMany({
            where: { orderId: id },
            data: { orderStatus: client_1.SubOrderStatus.ACCEPTED },
        });
        await this.notifyCustomer(order.customerId, '✅ Order Confirmed', `Your FarmsKing Order #${order.orderNumber} has been confirmed by seller. Packing in progress.`, id, 'ORDER_CONFIRMED_SMS');
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
            await tx.subOrder.updateMany({
                where: { orderId: id },
                data: { orderStatus: client_1.SubOrderStatus.CANCELLED },
            });
            await Promise.all(order.items
                .filter((item) => item.productId)
                .map((item) => tx.product.update({ where: { id: item.productId }, data: { stockQty: { increment: item.quantity } } })));
            return result;
        });
        await this.notifyCustomer(order.customerId, '❌ Order Cancelled', `Your FarmsKing Order #${order.orderNumber} has been cancelled.`, id, 'ORDER_CANCELLED_SMS');
        return updated;
    }
    async startPacking(operator, id) {
        const order = await this.findOneOrThrow(operator, id);
        if (order.status !== client_1.OrderStatus.CONFIRMED) {
            throw new common_1.ConflictException('Only confirmed orders can start packing.');
        }
        await this.prisma.subOrder.updateMany({ where: { orderId: id }, data: { orderStatus: client_1.SubOrderStatus.ACCEPTED } });
        return this.prisma.customerOrder.update({ where: { id }, data: { status: client_1.OrderStatus.PACKING }, include: DETAIL_INCLUDE });
    }
    async markPacked(operator, id) {
        const order = await this.findOneOrThrow(operator, id);
        if (order.status !== client_1.OrderStatus.PACKING && order.status !== client_1.OrderStatus.CONFIRMED) {
            throw new common_1.ConflictException('This order is not ready to be marked as packed.');
        }
        await this.prisma.subOrder.updateMany({ where: { orderId: id }, data: { orderStatus: client_1.SubOrderStatus.PACKED } });
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
        await this.prisma.subOrder.updateMany({ where: { orderId: id }, data: { orderStatus: client_1.SubOrderStatus.SHIPPED } });
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
        await this.notifyCustomer(order.customerId, '🚚 Order Dispatched', `Your FarmsKing Order #${order.orderNumber} has been dispatched via ${dto.courierName}${dto.trackingId ? ` (Tracking ID: ${dto.trackingId})` : ''}.`, id, 'ORDER_DISPATCHED_SMS');
        return updated;
    }
    async markDelivered(user, id) {
        const order = await this.findOneOrThrow(user, id);
        if (order.status !== client_1.OrderStatus.DISPATCHED) {
            throw new common_1.ConflictException('Only dispatched orders can be marked delivered.');
        }
        const updated = await this.prisma.customerOrder.update({
            where: { id },
            data: { status: client_1.OrderStatus.DELIVERED, deliveryDate: new Date() },
            include: DETAIL_INCLUDE,
        });
        await this.prisma.subOrder.updateMany({
            where: { orderId: id },
            data: { orderStatus: client_1.SubOrderStatus.DELIVERED },
        });
        await this.notifyCustomer(order.customerId, '📦 Order Delivered', `Your FarmsKing Order #${order.orderNumber} has been delivered successfully. Thank you for shopping with FarmsKing!`, id, 'ORDER_DELIVERED_SMS');
        return updated;
    }
    async processRtoSubOrder(subOrderId, rtoShippingFee) {
        const subOrder = await this.prisma.subOrder.findUnique({
            where: { id: subOrderId },
            include: { sellerStore: true },
        });
        if (!subOrder) {
            throw new common_1.NotFoundException('SubOrder not found.');
        }
        const rtoBearer = subOrder.sellerStore.rtoBearer || client_1.RtoBearer.VENDOR;
        const sharedRatio = Number(subOrder.sellerStore.rtoSharedVendorRatio || 50.0);
        let vendorRtoFee = 0;
        if (rtoBearer === client_1.RtoBearer.VENDOR) {
            vendorRtoFee = rtoShippingFee;
        }
        else if (rtoBearer === client_1.RtoBearer.SHARED) {
            vendorRtoFee = (rtoShippingFee * sharedRatio) / 100;
        }
        const newNetPayout = Number(subOrder.vendorNetPayout) - vendorRtoFee;
        return this.prisma.subOrder.update({
            where: { id: subOrderId },
            data: {
                orderStatus: client_1.SubOrderStatus.RTO_DELIVERED,
                rtoFee: rtoShippingFee,
                vendorNetPayout: newNetPayout,
                settlementStatus: 'DEDUCTED',
            },
        });
    }
    async generateFarmerBillOfSupply(user, orderId) {
        const order = await this.findOneOrThrow(user, orderId);
        const farmerItems = order.items.filter((item) => item.sellerStore?.sellerType === client_1.SellerType.FARMER || !item.sellerStore?.gstin);
        const items = farmerItems.length > 0 ? farmerItems : order.items;
        const invoices = items.map((item) => {
            const store = item.sellerStore;
            const unitPrice = Number(item.price || 0);
            const totalPrice = unitPrice * item.quantity;
            return {
                invoiceNumber: `FARM-BOS-${order.orderNumber}-${item.id.substring(0, 4)}`,
                invoiceDate: order.createdAt || order.created_at,
                taxType: 'Tax Exempt (0% GST under Section 23 of CGST Act 2017)',
                seller: {
                    storeName: store?.storeName || 'Registered Farmer Producer',
                    farmerName: store?.legalName || store?.bankBeneficiaryName || store?.storeName || 'Farmer Producer',
                    kingId: store?.sellerId ? `KING-${store.sellerId.substring(0, 8).toUpperCase()}` : 'FARMER-DIRECT',
                    pickupAddress: store?.pickupAddress || 'Farm Direct Pickup',
                    pickupCity: store?.pickupCity || '',
                    pickupState: store?.pickupState || '',
                    pickupPincode: store?.pickupPincode || '',
                    panNumber: store?.panNumber || 'EXEMPT_FARMER_PAN',
                    fssaiNo: store?.fssaiNo || undefined,
                    agriLicenseNo: store?.agriLicenseNo || undefined,
                },
                buyer: {
                    name: order.customer?.name || 'Valued Customer',
                    mobile: order.customer?.mobile || '',
                    deliveryAddress: order.deliveryAddress,
                },
                product: {
                    id: item.productId,
                    name: item.product?.name || item.productName || 'Farm Product',
                    hsnCode: item.product?.categorySlug === 'pesticides' ? '380899' : '120991',
                    quantity: item.quantity,
                    unitPrice,
                    totalPrice,
                },
                statutoryDeclaration: 'Self-certified agricultural produce / farm seed cultivated by registered farmer. Exempt from GST registration under Section 23(1)(b) of Central Goods and Services Tax (CGST) Act 2017. Shipped via Pan-India Courier Network.',
            };
        });
        return {
            orderNumber: order.orderNumber,
            orderStatus: order.status,
            paymentMode: order.paymentMode,
            paymentStatus: order.paymentStatus,
            invoices,
        };
    }
    async getOrderInvoices(user, orderId) {
        await this.findOneOrThrow(user, orderId);
        return this.prisma.orderInvoice.findMany({
            where: { orderId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async getInvoiceHtml(invoiceId) {
        const invoice = await this.prisma.orderInvoice.findUnique({
            where: { id: invoiceId },
        });
        if (!invoice) {
            throw new common_1.NotFoundException('Invoice not found.');
        }
        return this.billingService.renderInvoiceHtml(invoice);
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
        phonepe_service_1.PhonePeService,
        shiprocket_service_1.ShiprocketService,
        cashfree_service_1.CashfreeService,
        billing_service_1.BillingService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map