import { randomBytes } from 'crypto';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, OrderStatus, OrderPaymentMode, OrderPaymentStatus, Role, SellerType, SubOrderStatus, RtoBearer } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CouponsService } from '../coupons/coupons.service';
import { WalletService } from '../wallet/wallet.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { PhonePeService } from '../phonepe/phonepe.service';
import { ShiprocketService } from '../shiprocket/shiprocket.service';
import { CashfreeService } from '../cashfree/cashfree.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { buildUpiPaymentLink } from '../../common/utils/upi.util';
import { CreateOrderDto } from './dto/create-order.dto';
import { DispatchOrderDto } from './dto/dispatch-order.dto';

const DETAIL_INCLUDE = {
  items: { include: { product: { select: { id: true, name: true, imageUrl: true, categorySlug: true, weightKg: true, isCodAllowed: true } }, sellerStore: true } },
  subOrders: { include: { sellerStore: { select: { id: true, storeName: true, slug: true, sellerType: true, rtoBearer: true, rtoSharedVendorRatio: true } } } },
  customer: { select: { id: true, name: true, mobile: true, state: true } },
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
    private readonly shiprocketService: ShiprocketService,
    private readonly cashfreeService: CashfreeService,
  ) {}

  async create(customer: AuthUser, dto: CreateOrderDto) {
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { sellerStore: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalWeightKg = 0;
    let anyCodDisabled = false;

    // Detect delivery state from address string or customer user record
    const deliveryAddressStr = dto.deliveryAddress || '';
    const customerUser = await this.prisma.user.findUnique({ where: { id: customer.id } });
    const customerState = customerUser?.state?.trim().toLowerCase() || '';

    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found or unavailable.`);
      }
      if (product.stockQty < item.quantity) {
        throw new BadRequestException(`Not enough stock for "${product.name}" (available: ${product.stockQty}).`);
      }

      const itemWeight = (product.weightKg || 0.5) * item.quantity;
      totalWeightKg += itemWeight;

      if (!product.isCodAllowed) {
        anyCodDisabled = true;
      }

      // Intra-State Delivery Gate for Non-GST Farmer Sellers
      if (product.sellerStore && product.sellerStore.sellerType === SellerType.FARMER) {
        const pickupState = (product.sellerStore.pickupState || '').trim().toLowerCase();
        if (pickupState && customerState && !deliveryAddressStr.toLowerCase().includes(pickupState) && pickupState !== customerState) {
          throw new BadRequestException(
            `Non-GST Farmer products ("${product.name}") are restricted to intra-state delivery within ${product.sellerStore.pickupState}. Please update your delivery address.`,
          );
        }
      }
    }

    // COD Rule Engine Check
    const isCodRequested = dto.paymentMode === 'COD';
    if (isCodRequested && (totalWeightKg >= 25 || anyCodDisabled)) {
      throw new BadRequestException(
        'Cash on Delivery is disabled for this order due to package weight (>= 25kg) or restricted items like Khad/Spray. Please choose online payment.',
      );
    }

    const subtotal = dto.items.reduce((sum, item) => sum + Number(productMap.get(item.productId)!.price) * item.quantity, 0);

    const couponResult = dto.couponCode ? await this.couponsService.getActiveForOrder(dto.couponCode, subtotal) : null;
    const discountAmount = couponResult?.discountAmount ?? 0;
    const totalAmount = subtotal - discountAmount;

    // Master Order & Vendor Sub-Orders Splitting
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.customerOrder.create({
        data: {
          customerId: customer.id,
          orderNumber: generateOrderNumber(),
          totalAmount,
          deliveryAddress: dto.deliveryAddress,
          paymentMode: dto.paymentMode ?? OrderPaymentMode.COD,
          couponId: couponResult?.coupon.id,
          discountAmount: couponResult ? discountAmount : undefined,
          items: {
            create: dto.items.map((item) => {
              const product = productMap.get(item.productId)!;
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

      // Stock Decrement
      await Promise.all(
        dto.items.map((item) =>
          tx.product.update({ where: { id: item.productId }, data: { stockQty: { decrement: item.quantity } } }),
        ),
      );

      // Coupon redemption increment
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

      // Split order into Vendor SubOrders
      const vendorGroupMap = new Map<string, typeof dto.items>();
      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;
        const storeId = product.sellerStoreId || 'PLATFORM';
        const existing = vendorGroupMap.get(storeId) || [];
        existing.push(item);
        vendorGroupMap.set(storeId, existing);
      }

      for (const [storeId, groupItems] of vendorGroupMap.entries()) {
        if (storeId === 'PLATFORM') continue;

        const store = await tx.sellerStore.findUnique({ where: { id: storeId } });
        if (!store) continue;

        let groupSubtotal = 0;
        let groupCommissionAmount = 0;

        groupItems.forEach((item) => {
          const product = productMap.get(item.productId)!;
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
            orderStatus: SubOrderStatus.PLACED,
          },
        });
      }

      return created;
    });

    // Asynchronous Shiprocket Adhoc Order Dispatch per SubOrder
    this.triggerShiprocketSubOrders(order.id).catch((err) =>
      console.warn('Shiprocket background trigger notice:', err),
    );

    return order;
  }

  /** Background helper to create Shiprocket adhoc shipment for each vendor sub-order */
  private async triggerShiprocketSubOrders(orderId: string) {
    const order = await this.prisma.customerOrder.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true, sellerStore: true } },
        subOrders: { include: { sellerStore: true } },
        customer: true,
      },
    });

    if (!order) return;

    for (const subOrder of order.subOrders) {
      const store = subOrder.sellerStore;
      const pickupNickname = store.shiprocketPickupNickname || `HUB_${store.slug.substring(0, 10).toUpperCase()}`;

      const vendorItems = order.items.filter((i) => i.sellerStoreId === store.id);
      if (vendorItems.length === 0) continue;

      const subOrderItems = vendorItems.map((i) => ({
        name: i.productName,
        sku: i.product?.sku || 'FK-PROD',
        units: i.quantity,
        sellingPrice: Number(i.price),
        hsn: i.product?.hsnCode || '120991',
      }));

      try {
        const totalWeight = vendorItems.reduce((acc, curr) => acc + (curr.product?.weightKg || 0.5) * curr.quantity, 0);

        const srRes = await this.shiprocketService.createShipmentOrder(
          {
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
          },
          store.id,
        );

        if (srRes?.order_id) {
          await this.prisma.subOrder.update({
            where: { id: subOrder.id },
            data: {
              shiprocketOrderId: srRes.order_id.toString(),
              shiprocketShipmentId: srRes.shipment_id?.toString(),
            },
          });
        }
      } catch (err) {
        console.warn(`Shiprocket shipment creation failed for store ${store.storeName}:`, err);
      }
    }
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
    if (order.paymentStatus === OrderPaymentStatus.PAID) {
      throw new ConflictException('This order has already been paid for.');
    }

    const merchantOrderId = `${order.orderNumber}-${Date.now().toString(36).toUpperCase()}`;
    const result = await this.phonePeService.createPayment(merchantOrderId, Number(order.totalAmount), redirectUrl);

    await this.prisma.customerOrder.update({
      where: { id },
      data: { phonepeMerchantOrderId: merchantOrderId, phonepePaymentState: result.state, paymentStatus: OrderPaymentStatus.PENDING },
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
    const paymentStatus = result.state === 'COMPLETED' ? OrderPaymentStatus.PAID : result.state === 'FAILED' ? OrderPaymentStatus.FAILED : OrderPaymentStatus.PENDING;

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
    
    await this.prisma.subOrder.updateMany({
      where: { orderId: id },
      data: { orderStatus: SubOrderStatus.ACCEPTED },
    });

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
    if (!isStaff && order.status !== OrderStatus.PLACED) {
      throw new ConflictException('This order has already been confirmed and can no longer be cancelled. Please contact support.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.customerOrder.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
        include: DETAIL_INCLUDE,
      });

      await tx.subOrder.updateMany({
        where: { orderId: id },
        data: { orderStatus: SubOrderStatus.CANCELLED },
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
    await this.prisma.subOrder.updateMany({ where: { orderId: id }, data: { orderStatus: SubOrderStatus.ACCEPTED } });
    return this.prisma.customerOrder.update({ where: { id }, data: { status: OrderStatus.PACKING }, include: DETAIL_INCLUDE });
  }

  async markPacked(operator: AuthUser, id: string) {
    const order = await this.findOneOrThrow(operator, id);
    if (order.status !== OrderStatus.PACKING && order.status !== OrderStatus.CONFIRMED) {
      throw new ConflictException('This order is not ready to be marked as packed.');
    }
    await this.prisma.subOrder.updateMany({ where: { orderId: id }, data: { orderStatus: SubOrderStatus.PACKED } });
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
    await this.prisma.subOrder.updateMany({ where: { orderId: id }, data: { orderStatus: SubOrderStatus.SHIPPED } });
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

    const updated = await this.prisma.customerOrder.update({
      where: { id },
      data: { status: OrderStatus.DELIVERED, deliveryDate: new Date() },
      include: DETAIL_INCLUDE,
    });

    await this.prisma.subOrder.updateMany({
      where: { orderId: id },
      data: { orderStatus: SubOrderStatus.DELIVERED },
    });

    return updated;
  }

  /** Update RTO status for sub-order & apply RTO Bearer Fee Policy */
  async processRtoSubOrder(subOrderId: string, rtoShippingFee: number) {
    const subOrder = await this.prisma.subOrder.findUnique({
      where: { id: subOrderId },
      include: { sellerStore: true },
    });

    if (!subOrder) {
      throw new NotFoundException('SubOrder not found.');
    }

    const rtoBearer = subOrder.sellerStore.rtoBearer || RtoBearer.VENDOR;
    const sharedRatio = Number(subOrder.sellerStore.rtoSharedVendorRatio || 50.0);

    let vendorRtoFee = 0;
    if (rtoBearer === RtoBearer.VENDOR) {
      vendorRtoFee = rtoShippingFee;
    } else if (rtoBearer === RtoBearer.SHARED) {
      vendorRtoFee = (rtoShippingFee * sharedRatio) / 100;
    }

    const newNetPayout = Number(subOrder.vendorNetPayout) - vendorRtoFee;

    return this.prisma.subOrder.update({
      where: { id: subOrderId },
      data: {
        orderStatus: SubOrderStatus.RTO_DELIVERED,
        rtoFee: rtoShippingFee,
        vendorNetPayout: newNetPayout,
        settlementStatus: 'DEDUCTED',
      },
    });
  }
}

