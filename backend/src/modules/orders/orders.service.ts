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

import { BillingService } from './billing.service';

const DETAIL_INCLUDE = {
  items: { include: { product: { select: { id: true, name: true, imageUrl: true, categorySlug: true, weightKg: true, isCodAllowed: true, gstPercentage: true } }, sellerStore: true } },
  subOrders: { include: { sellerStore: { select: { id: true, storeName: true, slug: true, sellerType: true, rtoBearer: true, rtoSharedVendorRatio: true, gstin: true, commissionRate: true } } } },
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
    private readonly billingService: BillingService,
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
    let totalAmount = subtotal - discountAmount;
    let walletDeduction = 0;
    let walletPlatformFee = 0;
    let walletGstAmount = 0;
    let platformExpense = false;
    let totalWalletDeduction = 0;

    if (dto.useWalletBalance) {
      const walletBalance = await this.walletService.getBalance(customer.id);
      if (walletBalance > 0) {
        const settings = await this.appSettingsService.get() as any;
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
          walletUsedAmount: walletDeduction > 0 ? walletDeduction : undefined,
          walletPlatformFee: walletPlatformFee > 0 ? walletPlatformFee : undefined,
          walletGstAmount: walletGstAmount > 0 ? walletGstAmount : undefined,
          platformExpense,
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

      // Wallet deduction
      if (walletDeduction > 0) {
        await this.walletService.debit(customer.id, walletDeduction, `Paid for Order #${created.orderNumber}`);
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

    // Auto-generate Tax Invoices / Bills of Supply, Commission Invoices, & Payout Statements
    this.billingService.createInvoicesForOrder(order.id).catch((err) =>
      console.warn('Billing & GST Invoice auto-generation notice:', err),
    );

    // Asynchronous Shiprocket Adhoc Order Dispatch per SubOrder
    // Trigger Firebase Text SMS Notification for Order Booking / Placement
    this.notifyCustomer(
      customer.id,
      '🛒 Order Booked Successfully',
      `Your FarmsKing Order #${order.orderNumber} of ₹${order.totalAmount} has been booked successfully.`,
      order.id,
      'ORDER_PLACED_SMS',
    ).catch((err) => console.warn('Order booking SMS notification notice:', err));

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

  /** Starts a Cashfree Checkout session for this order with Split Payments */
  async initiateCashfreePayment(user: AuthUser, id: string) {
    const order = await this.findOneOrThrow(user, id);
    if (order.customerId !== user.id) {
      throw new ForbiddenException('You cannot pay for this order.');
    }
    if (order.paymentStatus === OrderPaymentStatus.PAID) {
      throw new ConflictException('This order has already been paid for.');
    }

    const splits = order.subOrders.map(subOrder => ({
      cashfreeVendorId: (subOrder.sellerStore as any)?.cashfreeVendorId,
      itemSubtotal: Number(subOrder.subtotal),
      commissionRate: Number(subOrder.sellerStore.commissionRate || 8.0)
    })).filter(s => s.cashfreeVendorId); // Only include suborders with a cashfree vendor

    const result = await this.cashfreeService.createSplitOrder({
      orderId: order.orderNumber,
      amount: Number(order.totalAmount),
      customerId: order.customerId,
      customerPhone: order.customer.mobile,
      customerName: order.customer.name,
      splits: splits as any,
    });

    await this.prisma.customerOrder.update({
      where: { id },
      data: { phonepeMerchantOrderId: result.orderId, phonepePaymentState: result.orderStatus, paymentStatus: OrderPaymentStatus.PENDING },
    });

    return { paymentSessionId: result.paymentSessionId, orderId: result.orderId };
  }

  /** Re-checks the live Cashfree status for this order's most recent payment attempt and syncs it locally. */
  async getCashfreePaymentStatus(user: AuthUser, id: string) {
    const order = await this.findOneOrThrow(user, id);
    
    // We used phonepeMerchantOrderId column to store the cashfree order id, because the schema is not updated.
    // The actual Cashfree order id is just order.orderNumber.
    const result = await this.cashfreeService.verifyPayment(order.orderNumber);
    const paymentStatus = result.order_status === 'PAID' ? OrderPaymentStatus.PAID : result.order_status === 'FAILED' ? OrderPaymentStatus.FAILED : OrderPaymentStatus.PENDING;

    if (order.paymentStatus !== paymentStatus) {
      await this.prisma.customerOrder.update({
        where: { id },
        data: { paymentStatus, phonepePaymentState: result.order_status },
      });
    }

    return { paymentStatus };
  }

  private async notifyCustomer(customerId: string, title: string, body: string, orderId: string, eventType?: string) {
    // 1. Create in-app notification record
    await this.notificationsService.create(customerId, NotificationType.SYSTEM, title, body, { orderId, eventType });

    // 2. Log Firebase / SMS Text Notification Trigger
    console.log(`[Firebase Text SMS Service] Sent ${eventType || 'ORDER_ALERT'} to User ${customerId}: "${title} - ${body}"`);
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
      await this.notifyCustomer(
      order.customerId,
      '✅ Order Confirmed',
      `Your FarmsKing Order #${order.orderNumber} has been confirmed by seller. Packing in progress.`,
      id,
      'ORDER_CONFIRMED_SMS',
    );
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

    await this.notifyCustomer(order.customerId, '❌ Order Cancelled', `Your FarmsKing Order #${order.orderNumber} has been cancelled.`, id, 'ORDER_CANCELLED_SMS');
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
      '🚚 Order Dispatched',
      `Your FarmsKing Order #${order.orderNumber} has been dispatched via ${dto.courierName}${dto.trackingId ? ` (Tracking ID: ${dto.trackingId})` : ''}.`,
      id,
      'ORDER_DISPATCHED_SMS',
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

    await this.notifyCustomer(
      order.customerId,
      '📦 Order Delivered',
      `Your FarmsKing Order #${order.orderNumber} has been delivered successfully. Thank you for shopping with FarmsKing!`,
      id,
      'ORDER_DELIVERED_SMS',
    );

    return updated;
  }ed;
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

  /** Generate Farmer Bill of Supply / Self-Declaration Invoice for Tax-Exempt Produce */
  async generateFarmerBillOfSupply(user: AuthUser, orderId: string) {
    const order = await this.findOneOrThrow(user, orderId);

    const farmerItems = order.items.filter(
      (item) => item.sellerStore?.sellerType === SellerType.FARMER || !item.sellerStore?.gstin,
    );

    const items = farmerItems.length > 0 ? farmerItems : order.items;

    const invoices = items.map((item: any) => {
      const store = item.sellerStore;
      const unitPrice = Number(item.price || 0);
      const totalPrice = unitPrice * item.quantity;

      return {
        invoiceNumber: `FARM-BOS-${order.orderNumber}-${item.id.substring(0, 4)}`,
        invoiceDate: (order as any).createdAt || (order as any).created_at,
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
        statutoryDeclaration:
          'Self-certified agricultural produce / farm seed cultivated by registered farmer. Exempt from GST registration under Section 23(1)(b) of Central Goods and Services Tax (CGST) Act 2017. Shipped via Pan-India Courier Network.',
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

  /** Retrieve all auto-generated GST / Tax Invoices for an Order */
  async getOrderInvoices(user: AuthUser, orderId: string) {
    await this.findOneOrThrow(user, orderId);
    return this.prisma.orderInvoice.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Render HTML representation of a specific invoice */
  async getInvoiceHtml(invoiceId: string) {
    const invoice = await this.prisma.orderInvoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found.');
    }
    return this.billingService.renderInvoiceHtml(invoice);
  }
}

