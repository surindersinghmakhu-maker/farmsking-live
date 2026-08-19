import { randomBytes } from 'crypto';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, OrderStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CouponsService } from '../coupons/coupons.service';
import { WalletService } from '../wallet/wallet.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { PhonePeService } from '../phonepe/phonepe.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { buildUpiPaymentLink } from '../../common/utils/upi.util';
import { CreateOrderDto } from './dto/create-order.dto';
import { DispatchOrderDto } from './dto/dispatch-order.dto';

const DETAIL_INCLUDE = {
  items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
  customer: { select: { id: true, name: true, mobile: true } },
  packedBy: { select: { id: true, name: true } },
  dispatchedBy: { select: { id: true, name: true } },
} as const;

function generateOrderNumber(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly couponsService: CouponsService,
    private readonly walletService: WalletService,
    private readonly appSettingsService: AppSettingsService,
    private readonly phonePeService: PhonePeService,
  ) {}

  async create(customer: AuthUser, dto: CreateOrderDto) {
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds }, isActive: true } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found or unavailable.`);
      }
      if (product.stockQty < item.quantity) {
        throw new BadRequestException(`Not enough stock for "${product.name}" (available: ${product.stockQty}).`);
      }
    }

    const subtotal = dto.items.reduce((sum, item) => sum + Number(productMap.get(item.productId)!.price) * item.quantity, 0);

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
              const product = productMap.get(item.productId)!;
              return { productId: product.id, productName: product.name, quantity: item.quantity, price: product.price };
            }),
          },
        },
        include: DETAIL_INCLUDE,
      });

      await Promise.all(
        dto.items.map((item) =>
          tx.product.update({ where: { id: item.productId }, data: { stockQty: { decrement: item.quantity } } }),
        ),
      );

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

  findMine(user: AuthUser) {
    return this.prisma.customerOrder.findMany({
      where: { customerId: user.id },
      include: DETAIL_INCLUDE,
      orderBy: { orderDate: 'desc' },
    });
  }

  findAll(status?: OrderStatus) {
    return this.prisma.customerOrder.findMany({
      where: status ? { status } : {},
      include: DETAIL_INCLUDE,
      orderBy: { orderDate: 'desc' },
    });
  }

  /** Operator queue — everything from a fresh placed order through dispatch, oldest first. */
  findFulfillmentQueue() {
    return this.prisma.customerOrder.findMany({
      where: {
        status: { in: [OrderStatus.PLACED, OrderStatus.CONFIRMED, OrderStatus.PACKING, OrderStatus.PACKED, OrderStatus.DISPATCHED] },
      },
      include: DETAIL_INCLUDE,
      orderBy: { orderDate: 'asc' },
    });
  }

  async findOneOrThrow(user: AuthUser, id: string) {
    const order = await this.prisma.customerOrder.findUnique({ where: { id }, include: DETAIL_INCLUDE });
    if (!order) {
      throw new NotFoundException('Order not found.');
    }
    const staffRoles: Role[] = [Role.ADMIN, Role.SUPER_ADMIN, Role.OPERATOR];
    if (order.customerId !== user.id && !staffRoles.includes(user.role)) {
      throw new ForbiddenException('You do not have access to this order.');
    }
    return order;
  }

  /** UPI deep link with the order's fixed bill amount and the order number as the remark. */
  async getUpiLink(user: AuthUser, id: string) {
    const order = await this.findOneOrThrow(user, id);
    const settings = await this.appSettingsService.get();
    if (!settings.upiId) {
      throw new BadRequestException('UPI payment is not configured yet. Please contact support.');
    }
    const upiLink = buildUpiPaymentLink({
      amount: Number(order.totalAmount),
      note: order.orderNumber,
      transactionRef: order.orderNumber,
      payeeVpa: settings.upiId,
      payeeName: settings.upiPayeeName ?? undefined,
    });
    return { upiLink, amount: Number(order.totalAmount), orderNumber: order.orderNumber };
  }

  /** Starts a PhonePe Standard Checkout session for this order and returns the URL to redirect the customer to. */
  async initiatePhonePePayment(user: AuthUser, id: string, redirectUrl: string) {
    const order = await this.findOneOrThrow(user, id);
    if (order.customerId !== user.id) {
      throw new ForbiddenException('You cannot pay for this order.');
    }
    if (order.paymentStatus === 'PAID') {
      throw new ConflictException('This order has already been paid for.');
    }

    // Fresh merchantOrderId per attempt — PhonePe treats it as a unique idempotency key, and this column is unique.
    const merchantOrderId = `${order.orderNumber}-${Date.now().toString(36).toUpperCase()}`;
    const result = await this.phonePeService.createPayment(merchantOrderId, Number(order.totalAmount), redirectUrl);

    await this.prisma.customerOrder.update({
      where: { id },
      data: { phonepeMerchantOrderId: merchantOrderId, phonepePaymentState: result.state, paymentStatus: 'PENDING' },
    });

    return { redirectUrl: result.redirectUrl, merchantOrderId };
  }

  /** Re-checks the live PhonePe status for this order's most recent payment attempt and syncs it locally. */
  async getPhonePePaymentStatus(user: AuthUser, id: string) {
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

  private async notifyCustomer(customerId: string, title: string, body: string, orderId: string) {
    await this.notificationsService.create(customerId, NotificationType.SYSTEM, title, body, { orderId });
  }

  async confirm(user: AuthUser, id: string) {
    const order = await this.findOneOrThrow(user, id);
    if (order.status !== OrderStatus.PLACED) {
      throw new ConflictException('Only newly placed orders can be confirmed.');
    }
    const updated = await this.prisma.customerOrder.update({ where: { id }, data: { status: OrderStatus.CONFIRMED }, include: DETAIL_INCLUDE });
    await this.notifyCustomer(order.customerId, 'Order confirmed', `Your order ${order.orderNumber} has been confirmed.`, id);
    await this.creditCouponCommission(id);
    return updated;
  }

  /** Credits the partner's wallet with the coupon commission earned on this order, once, on order confirmation. */
  private async creditCouponCommission(orderId: string) {
    const redemption = await this.prisma.couponRedemption.findFirst({
      where: { orderId, creditedAt: null },
      include: { coupon: true },
    });
    if (!redemption) {
      return;
    }
    await this.walletService.credit(
      redemption.coupon.businessPartnerId,
      Number(redemption.commissionAmount),
      `Commission from coupon ${redemption.coupon.code}`,
      { couponRedemptionId: redemption.id },
    );
    await this.prisma.couponRedemption.update({ where: { id: redemption.id }, data: { creditedAt: new Date() } });
  }

  async cancel(user: AuthUser, id: string) {
    const order = await this.findOneOrThrow(user, id);
    const isStaff = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN || user.role === Role.OPERATOR;
    if (order.customerId !== user.id && !isStaff) {
      throw new ForbiddenException('You cannot cancel this order.');
    }
    if (order.status === OrderStatus.DISPATCHED || order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new ConflictException(`An order that is ${order.status.toLowerCase()} cannot be cancelled.`);
    }
    // A customer can only self-cancel before the seller confirms it — once confirmed, only staff can cancel
    // (e.g. for a stock issue), since packing/dispatch prep may already be underway.
    if (!isStaff && order.status !== OrderStatus.PLACED) {
      throw new ConflictException('This order has already been confirmed and can no longer be cancelled. Please contact support.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.customerOrder.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
        include: DETAIL_INCLUDE,
      });
      await Promise.all(
        order.items
          .filter((item) => item.productId)
          .map((item) =>
            tx.product.update({ where: { id: item.productId! }, data: { stockQty: { increment: item.quantity } } }),
          ),
      );
      return result;
    });

    await this.notifyCustomer(order.customerId, 'Order cancelled', `Your order ${order.orderNumber} has been cancelled.`, id);
    return updated;
  }

  async startPacking(operator: AuthUser, id: string) {
    const order = await this.findOneOrThrow(operator, id);
    if (order.status !== OrderStatus.CONFIRMED) {
      throw new ConflictException('Only confirmed orders can start packing.');
    }
    return this.prisma.customerOrder.update({ where: { id }, data: { status: OrderStatus.PACKING }, include: DETAIL_INCLUDE });
  }

  async markPacked(operator: AuthUser, id: string) {
    const order = await this.findOneOrThrow(operator, id);
    if (order.status !== OrderStatus.PACKING && order.status !== OrderStatus.CONFIRMED) {
      throw new ConflictException('This order is not ready to be marked as packed.');
    }
    return this.prisma.customerOrder.update({
      where: { id },
      data: { status: OrderStatus.PACKED, packedById: operator.id, packedAt: new Date() },
      include: DETAIL_INCLUDE,
    });
  }

  async dispatch(operator: AuthUser, id: string, dto: DispatchOrderDto) {
    const order = await this.findOneOrThrow(operator, id);
    if (order.status !== OrderStatus.PACKED) {
      throw new ConflictException('Only packed orders can be dispatched.');
    }
    const updated = await this.prisma.customerOrder.update({
      where: { id },
      data: {
        status: OrderStatus.DISPATCHED,
        dispatchedById: operator.id,
        dispatchedAt: new Date(),
        courierName: dto.courierName,
        trackingId: dto.trackingId,
      },
      include: DETAIL_INCLUDE,
    });
    await this.notifyCustomer(
      order.customerId,
      'Order dispatched',
      `Your order ${order.orderNumber} has been dispatched via ${dto.courierName}${dto.trackingId ? ` (Tracking: ${dto.trackingId})` : ''}.`,
      id,
    );
    return updated;
  }

  async markDelivered(user: AuthUser, id: string) {
    const order = await this.findOneOrThrow(user, id);
    if (order.status !== OrderStatus.DISPATCHED) {
      throw new ConflictException('Only dispatched orders can be marked delivered.');
    }
    return this.prisma.customerOrder.update({
      where: { id },
      data: { status: OrderStatus.DELIVERED, deliveryDate: new Date() },
      include: DETAIL_INCLUDE,
    });
  }
}
