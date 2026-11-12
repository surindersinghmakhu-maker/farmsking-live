import { EmailService } from '../email/email.service';
import { WhatsappBotService } from '../whatsapp/whatsapp.service';
import { SmsService } from '../sms/sms.service';
import { randomBytes } from 'crypto';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, OrderStatus, OrderPaymentMode, OrderPaymentStatus, Prisma, Role, SellerPayoutStatus, SellerType, SubOrderStatus, RtoBearer, WalletTransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CouponsService } from '../coupons/coupons.service';
import { WalletService } from '../wallet/wallet.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { PhonePeService } from '../phonepe/phonepe.service';
import { ShiprocketService } from '../shiprocket/shiprocket.service';
import { CashfreeService } from '../cashfree/cashfree.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { hasActiveRole } from '../../common/utils/auth-user.util';
import { buildUpiPaymentLink } from '../../common/utils/upi.util';
import {
  computeMarketplaceSettlement,
  detectInterStateSupply,
  isValidGstin,
} from '../../common/utils/tax-compliance.util';
import { CreateOrderDto } from './dto/create-order.dto';
import { DispatchOrderDto } from './dto/dispatch-order.dto';

import { BillingService } from './billing.service';

const DETAIL_INCLUDE = {
  items: { include: { product: { select: { id: true, name: true, imageUrl: true, categorySlug: true, weightKg: true, isCodAllowed: true, gstPercentage: true, hsnCode: true } }, sellerStore: true } },
  subOrders: { include: { sellerStore: { select: { id: true, storeName: true, slug: true, sellerType: true, rtoBearer: true, rtoSharedVendorRatio: true, gstin: true, commissionRate: true } } } },
  customer: { select: { id: true, name: true, mobile: true, state: true } },
  packedBy: { select: { id: true, name: true } },
  dispatchedBy: { select: { id: true, name: true } },
} as const;


export function extractOrderRecipient(deliveryAddress?: string | null, customerUser?: any) {
  let recipientName = customerUser?.name || 'Valued Customer';
  let recipientMobile = customerUser?.mobile || '';

  if (deliveryAddress) {
    const nameMatch = deliveryAddress.match(/Name:\s*([^,\n]+)/i);
    if (nameMatch && nameMatch[1].trim()) {
      recipientName = nameMatch[1].trim();
    }
    const mobileMatch = deliveryAddress.match(/Mobile:\s*([0-9]{10})/i);
    if (mobileMatch && mobileMatch[1].trim()) {
      recipientMobile = mobileMatch[1].trim();
    }
  }

  return { recipientName, recipientMobile };
}
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
    private readonly emailService: EmailService,
    private readonly whatsappBotService: WhatsappBotService,
    private readonly smsService: SmsService,
  ) {}

  private resolveEffectiveUnitPrice(product: any, quantity: number): number {
    const unitPrice = Number(product.price);
    const isWholesale =
      product.bulkDiscountMinQty &&
      product.bulkDiscountPercentage &&
      quantity >= product.bulkDiscountMinQty;
    const effective = isWholesale
      ? unitPrice * (1 - Number(product.bulkDiscountPercentage) / 100)
      : unitPrice;
    return Number(effective.toFixed(2));
  }

  private resolveStoreCommissionRate(
    product: any,
    store: any,
    categoryCommissions?: Record<string, any> | null,
  ): number {
    if (product?.commissionOverridePercentage != null) {
      return Number(product.commissionOverridePercentage);
    }
    const catSlug = String(product?.categorySlug || product?.category || '').toLowerCase();
    if (categoryCommissions && typeof categoryCommissions === 'object') {
      if ((catSlug.includes('fertilizer') || catSlug.includes('khad')) && categoryCommissions.fertilizer != null) {
        return Number(categoryCommissions.fertilizer);
      }
      if (catSlug.includes('seed') && categoryCommissions.seeds != null) {
        return Number(categoryCommissions.seeds);
      }
      if ((catSlug.includes('pesticide') || catSlug.includes('spray')) && categoryCommissions.spray != null) {
        return Number(categoryCommissions.spray);
      }
      if ((catSlug.includes('plant') || catSlug.includes('garden')) && categoryCommissions.livePlants != null) {
        return Number(categoryCommissions.livePlants);
      }
      if (catSlug.includes('feed') && categoryCommissions.feed != null) {
        return Number(categoryCommissions.feed);
      }
    }
    return Number(store?.commissionRate ?? 8.0);
  }

  private async getCategoryCommissionsMap(storeIds: string[]): Promise<Map<string, Record<string, any>>> {
    const map = new Map<string, Record<string, any>>();
    if (storeIds.length === 0) return map;
    try {
      const rows: Array<{ id: string; categoryCommissions: any }> = await this.prisma.$queryRaw(
        Prisma.sql`SELECT "id", "categoryCommissions" FROM "seller_stores" WHERE "id" IN (${Prisma.join(storeIds)})`,
      );
      for (const r of rows) {
        if (r.categoryCommissions && typeof r.categoryCommissions === 'object') {
          map.set(r.id, r.categoryCommissions);
        }
      }
    } catch {
      // Column optional in legacy environments
    }
    return map;
  }

  private isOrderStaff(user: AuthUser): boolean {
    return (
      hasActiveRole(user, Role.ADMIN) ||
      hasActiveRole(user, Role.SUPER_ADMIN) ||
      hasActiveRole(user, Role.MANAGER) ||
      hasActiveRole(user, Role.OPERATOR)
    );
  }

  async create(customer: AuthUser, dto: CreateOrderDto) {
    const isStaff = this.isOrderStaff(customer);
    const targetCustomerId = (isStaff && dto.customerId) ? dto.customerId : customer.id;

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { sellerStore: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalWeightKg = 0;
    let anyCodDisabled = false;

    const customerUser = await this.prisma.user.findUnique({ where: { id: targetCustomerId } });
    if (!customerUser) {
      throw new NotFoundException(`Customer account not found.`);
    }

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

    const subtotal = Number(
      dto.items
        .reduce((sum, item) => {
          const p = productMap.get(item.productId)!;
          return sum + this.resolveEffectiveUnitPrice(p, item.quantity) * item.quantity;
        }, 0)
        .toFixed(2),
    );

    const couponResult = dto.couponCode ? await this.couponsService.getActiveForOrder(dto.couponCode, subtotal) : null;
    const discountAmount = couponResult?.discountAmount ?? 0;
    const postCouponAmount = Number(Math.max(0, subtotal - discountAmount).toFixed(2));
    const settings = dto.useWalletBalance ? ((await this.appSettingsService.get()) as any) : null;

    const storeIds = Array.from(
      new Set(products.map((p) => p.sellerStoreId).filter((sid): sid is string => Boolean(sid))),
    );
    const categoryCommMap = await this.getCategoryCommissionsMap(storeIds);

    // Master Order & Vendor Sub-Orders Splitting (with atomic wallet check + debit)
    const order = await this.prisma.$transaction(async (tx) => {
      let totalAmount = postCouponAmount;
      let walletDeduction = 0;
      let walletPlatformFee = 0;
      let walletGstAmount = 0;
      let platformExpense = false;
      let totalWalletDeduction = 0;

      if (dto.useWalletBalance && postCouponAmount > 0) {
        // Lock customer row inside transaction so parallel checkouts cannot double-spend wallet balance
        await tx.$executeRaw`SELECT "id" FROM "users" WHERE "id" = ${targetCustomerId} FOR UPDATE`;

        const [credits, debits] = await Promise.all([
          tx.walletTransaction.aggregate({
            where: { userId: targetCustomerId, type: WalletTransactionType.CREDIT },
            _sum: { amount: true },
          }),
          tx.walletTransaction.aggregate({
            where: { userId: targetCustomerId, type: WalletTransactionType.DEBIT },
            _sum: { amount: true },
          }),
        ]);
        const walletBalance = Math.max(0, Number(credits._sum.amount ?? 0) - Number(debits._sum.amount ?? 0));

        if (walletBalance > 0) {
          const taxEnabled = settings?.walletTaxEnabled ?? true;
          let feeRate = 0;
          let gstRate = 0;

          if (taxEnabled) {
            feeRate = (settings?.walletUsagePlatformFeePercent ?? 2.0) / 100;
            gstRate = (settings?.walletUsageGstPercent ?? 18.0) / 100;
            platformExpense = true;
          }

          const costMultiplier = 1 + feeRate + feeRate * gstRate;
          const maxUsableForOrder = Math.floor((walletBalance / costMultiplier) * 100) / 100;

          walletDeduction = Number(Math.min(postCouponAmount, maxUsableForOrder).toFixed(2));
          walletPlatformFee = Number((walletDeduction * feeRate).toFixed(2));
          walletGstAmount = Number((walletPlatformFee * gstRate).toFixed(2));
          totalWalletDeduction = Number((walletDeduction + walletPlatformFee + walletGstAmount).toFixed(2));
          if (totalWalletDeduction > walletBalance) {
            const safeRatio = walletBalance / totalWalletDeduction;
            walletDeduction = Number((walletDeduction * safeRatio).toFixed(2));
            walletPlatformFee = Number((walletPlatformFee * safeRatio).toFixed(2));
            walletGstAmount = Number(Math.max(0, walletBalance - walletDeduction - walletPlatformFee).toFixed(2));
            totalWalletDeduction = Number((walletDeduction + walletPlatformFee + walletGstAmount).toFixed(2));
          }
          totalAmount = Number(Math.max(0, postCouponAmount - walletDeduction).toFixed(2));
        }
      }

      const created = await tx.customerOrder.create({
        data: {
          customerId: targetCustomerId,
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
              const effectivePrice = this.resolveEffectiveUnitPrice(product, item.quantity);
              const itemSubtotal = Number((effectivePrice * item.quantity).toFixed(2));
              const isGstRegistered = isValidGstin(product.sellerStore?.gstin);
              const settle = computeMarketplaceSettlement({
                grossAmount: itemSubtotal,
                gstPercentage: Number((product as any).gstPercentage || 0),
                commissionPercent: Number(product.sellerStore?.commissionRate ?? 8.0),
                isSellerGstRegistered: isGstRegistered,
              });
              return {
                productId: product.id,
                productName: product.name,
                quantity: item.quantity,
                price: effectivePrice,
                sellerStoreId: product.sellerStoreId,
                subtotal: itemSubtotal,
                tcsAmount: settle.tcsAmount,
              };
            }),
          },
        },
        include: DETAIL_INCLUDE,
      });

      // Atomic Stock Decrement (with oversell guard)
      for (const item of dto.items) {
        const res = await tx.product.updateMany({
          where: { id: item.productId, stockQty: { gte: item.quantity } },
          data: { stockQty: { decrement: item.quantity } },
        });
        if (res.count === 0) {
          const p = productMap.get(item.productId);
          throw new ConflictException(`Insufficient stock for "${p?.name || item.productId}". Please refresh cart.`);
        }
      }

      // Atomic coupon redemption increment (guards against race past usageLimit)
      if (couponResult) {
        const couponClaim = await tx.coupon.updateMany({
          where: {
            id: couponResult.coupon.id,
            isActive: true,
            usedCount: { lt: couponResult.coupon.usageLimit },
          },
          data: { usedCount: { increment: 1 } },
        });
        if (couponClaim.count === 0) {
          throw new ConflictException('This coupon has reached its usage limit.');
        }
        await tx.couponRedemption.create({
          data: {
            couponId: couponResult.coupon.id,
            customerId: targetCustomerId,
            orderId: created.id,
            orderAmount: subtotal,
            discountAmount,
            commissionAmount: couponResult.commissionAmount,
          },
        });
      }

      // Atomic Wallet deduction inside transaction (incl. fee + GST)
      if (totalWalletDeduction > 0) {
        await tx.walletTransaction.create({
          data: {
            userId: targetCustomerId,
            type: WalletTransactionType.DEBIT,
            amount: totalWalletDeduction,
            reason: `Paid for Order #${created.orderNumber}${walletPlatformFee > 0 ? ` (incl. ₹${(walletPlatformFee + walletGstAmount).toFixed(2)} platform fee & GST)` : ''}`,
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
        let groupCommissionGstAmount = 0;
        let groupTcsAmount = 0;
        const isStoreGst = isValidGstin(store.gstin);
        const catComm = categoryCommMap.get(storeId);

        groupItems.forEach((item) => {
          const product = productMap.get(item.productId)!;
          const effectivePrice = this.resolveEffectiveUnitPrice(product, item.quantity);
          const itemSub = Number((effectivePrice * item.quantity).toFixed(2));
          const commRate = this.resolveStoreCommissionRate(product, store, catComm);
          const settle = computeMarketplaceSettlement({
            grossAmount: itemSub,
            gstPercentage: Number((product as any).gstPercentage || 0),
            commissionPercent: commRate,
            isSellerGstRegistered: isStoreGst,
          });

          groupSubtotal += itemSub;
          groupCommissionAmount += settle.commissionAmount;
          groupCommissionGstAmount += settle.commissionGstAmount;
          groupTcsAmount += settle.tcsAmount;
        });

        const vendorNetPayout = Number(
          Math.max(0, groupSubtotal - groupCommissionAmount - groupCommissionGstAmount - groupTcsAmount).toFixed(2),
        );

        await tx.subOrder.create({
          data: {
            orderId: created.id,
            sellerStoreId: storeId,
            subtotal: Number(groupSubtotal.toFixed(2)),
            commissionAmount: Number(groupCommissionAmount.toFixed(2)),
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
      targetCustomerId,
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
      const pickupNickname =
        store.shiprocketPickupLocationId ||
        store.shiprocketPickupNickname ||
        `HUB_${store.slug.substring(0, 10).toUpperCase()}`;

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
            customerOrderId: order.id,
            paymentMethod: order.paymentMode === OrderPaymentMode.COD ? 'COD' : 'Prepaid',
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
      take: 150,
      include: DETAIL_INCLUDE,
      orderBy: { orderDate: 'desc' },
    });
  }

  findAll(status?: OrderStatus) {
    return this.prisma.customerOrder.findMany({
      where: status ? { status } : {},
      take: 200,
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
      take: 300,
      include: DETAIL_INCLUDE,
      orderBy: { orderDate: 'asc' },
    });
  }

  async findOneOrThrow(user: AuthUser, id: string) {
    const order = await this.prisma.customerOrder.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: DETAIL_INCLUDE,
    });
    if (!order) {
      throw new NotFoundException('Order not found.');
    }
    const isOrderSeller =
      hasActiveRole(user, Role.SELLER) &&
      (order.subOrders?.some((so: any) => so.sellerStore?.sellerId === user.id) ||
        order.items?.some((it: any) => it.sellerStore?.sellerId === user.id));
    if (order.customerId !== user.id && !isOrderSeller && !this.isOrderStaff(user)) {
      throw new ForbiddenException('You do not have access to this order.');
    }
    return order;
  }

  /** Safe redacted order tracking lookup by orderNumber or trackingId (no customer PII exposed) */
  async trackPublicOrder(query: string) {
    const q = (query || '').trim();
    if (!q) {
      throw new BadRequestException('Order number or tracking ID is required.');
    }
    const order = await this.prisma.customerOrder.findFirst({
      where: {
        OR: [{ orderNumber: q }, { trackingId: q }, { id: q }],
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        orderDate: true,
        deliveryDate: true,
        dispatchedAt: true,
        packedAt: true,
        courierName: true,
        trackingId: true,
        paymentMode: true,
        paymentStatus: true,
        totalAmount: true,
        items: {
          select: { id: true, productName: true, quantity: true, price: true },
        },
        shippingLogs: {
          select: { status: true, courierName: true, awbCode: true, deliveredAt: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!order) {
      throw new NotFoundException(`No consignment found matching "${q}".`);
    }
    return order;
  }

  /** UPI deep link with the order's fixed bill amount and the order number as the remark. */
  async getUpiLink(user: AuthUser, id: string) {
    const order = await this.findOneOrThrow(user, id);
    const settings = await this.appSettingsService.get();
    let upiId = settings.upiId;
    let upiPayeeName = settings.upiPayeeName;
    try {
      const integrations = await this.appSettingsService.getIntegrations();
      if (integrations?.gateway?.providers?.upiDirect?.upiId) {
        upiId = integrations.gateway.providers.upiDirect.upiId;
      }
      if (integrations?.gateway?.providers?.upiDirect?.payeeName) {
        upiPayeeName = integrations.gateway.providers.upiDirect.payeeName;
      }
    } catch {}
    if (!upiId) {
      throw new BadRequestException('UPI payment is not configured yet. Please contact support.');
    }
    const upiLink = buildUpiPaymentLink({
      amount: Number(order.totalAmount),
      note: order.orderNumber,
      transactionRef: order.orderNumber,
      payeeVpa: upiId,
      payeeName: upiPayeeName ?? undefined,
    });
    return { upiLink, amount: Number(order.totalAmount), orderNumber: order.orderNumber };
  }

  async initiateCashfreePayment(user: AuthUser, id: string) {
    const order = await this.findOneOrThrow(user, id);
    const staffRoles: Role[] = [Role.ADMIN, Role.SUPER_ADMIN, Role.OPERATOR];
    if (order.customerId !== user.id && !staffRoles.includes(user.role)) {
      throw new ForbiddenException('You cannot pay for this order.');
    }
    if (order.paymentStatus === OrderPaymentStatus.PAID) {
      throw new ConflictException('This order has already been paid for.');
    }

    const splits = order.subOrders.map(subOrder => ({
      cashfreeVendorId: (subOrder.sellerStore as any)?.cashfreeVendorId,
      itemSubtotal: Number(subOrder.subtotal),
      commissionRate: Number(subOrder.sellerStore.commissionRate ?? 8.0),
      isGstRegistered: Boolean(subOrder.sellerStore?.gstin && subOrder.sellerStore.gstin.trim().length >= 15),
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

  async markPaymentPaid(operator: AuthUser, id: string, transactionId?: string, paymentNotes?: string) {
    const order = await this.findOneOrThrow(operator, id);
    if (order.paymentStatus === OrderPaymentStatus.PAID) {
      return order;
    }
    const updated = await this.prisma.customerOrder.update({
      where: { id },
      data: {
        paymentStatus: OrderPaymentStatus.PAID,
        phonepeMerchantOrderId: transactionId?.trim() || order.phonepeMerchantOrderId || `MANUAL-${Date.now()}`,
        phonepePaymentState: paymentNotes?.trim() || 'VERIFIED_BY_ADMIN',
      },
      include: DETAIL_INCLUDE,
    });

    await this.ensurePendingSellerPayoutsForOrder(order.id).catch((err) =>
      console.warn('Pending seller payout creation notice:', err),
    );
    await this.creditCouponCommission(order.id).catch((err) =>
      console.warn('Paid order coupon commission credit notice:', err),
    );

    await this.notifyCustomer(
      order.customerId,
      '💳 Payment Received',
      `Payment of ₹${order.totalAmount} for FarmsKing Order #${order.orderNumber} has been verified and confirmed.`,
      id,
      'ORDER_CONFIRMED_SMS',
    );

    return updated;
  }

  async submitPaymentUtr(customer: AuthUser, id: string, utrNumber: string) {
    const order = await this.findOneOrThrow(customer, id);
    if (order.customerId !== customer.id && !this.isOrderStaff(customer)) {
      throw new ForbiddenException('You cannot update payment reference for this order.');
    }
    return this.prisma.customerOrder.update({
      where: { id },
      data: {
        phonepeMerchantOrderId: utrNumber.trim(),
        phonepePaymentState: 'UTR_SUBMITTED_BY_CUSTOMER',
        paymentStatus: OrderPaymentStatus.PENDING,
      },
      include: DETAIL_INCLUDE,
    });
  }

  private async notifyCustomer(
    customerId: string,
    title: string,
    body: string,
    orderId: string,
    eventType?: string,
    meta?: { courierName?: string; trackingNumber?: string },
  ) {
    // 1. In-app notification record
    await this.notificationsService.create(customerId, NotificationType.SYSTEM, title, body, { orderId, eventType });

    // 2. Fetch full Customer and Order details
    try {
      const [customer, order] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: customerId },
          select: { id: true, name: true, mobile: true, email: true },
        }),
        this.prisma.customerOrder.findUnique({
          where: { id: orderId },
          include: {
            items: true,
          },
        }),
      ]);

      if (customer) {
        const orderNum = order?.orderNumber || orderId.slice(-8).toUpperCase();
        const orderTotal = Number(order?.totalAmount ?? 0);
        const { recipientName, recipientMobile } = extractOrderRecipient(order?.deliveryAddress, customer);

        // 3. Email Notification Flow
        const targetEmail = customer.email && !customer.email.includes('placeholder') ? customer.email : null;
        if (targetEmail) {
          if (eventType === 'ORDER_PLACED_SMS') {
            this.emailService
              .sendOrderPlacedConfirmationEmail(targetEmail, recipientName, {
                orderNumber: orderNum,
                totalAmount: orderTotal,
                paymentMode: order?.paymentMode,
                deliveryAddress: order?.deliveryAddress || undefined,
                items: (order?.items || []).map((i) => ({
                  productName: i.productName,
                  quantity: i.quantity,
                  price: Number(i.price),
                })),
              })
              .catch((err: any) => console.warn('[OrdersService] Customer order confirmation email error:', err?.message));
          } else {
            this.emailService
              .sendOrderLifecycleEmail(targetEmail, recipientName, {
                orderNumber: orderNum,
                statusTitle: title,
                statusDescription: body,
                totalAmount: orderTotal,
                courierName: meta?.courierName,
                trackingNumber: meta?.trackingNumber,
              })
              .catch((err: any) => console.warn('[OrdersService] Customer order status email error:', err?.message));
          }
        }

        // 4. Admin Real-Time Email Alert on Order Placement
        if (eventType === 'ORDER_PLACED_SMS') {
          try {
            const integrations = await this.appSettingsService.getIntegrations();
            const adminEmail =
              integrations?.projectMasterData?.smtp?.fromEmail ||
              integrations?.projectMasterData?.supportEmail ||
              integrations?.projectMasterData?.contactEmail ||
              process.env.ADMIN_EMAIL ||
              'farmskingapp@gmail.com';

            if (adminEmail && !adminEmail.includes('placeholder')) {
              this.emailService
                .sendAdminOrderAlertEmail(adminEmail, {
                  orderNumber: orderNum,
                  totalAmount: orderTotal,
                  customerName: recipientName,
                  customerMobile: recipientMobile || customer.mobile || 'N/A',
                  deliveryAddress: order?.deliveryAddress || undefined,
                  itemCount: order?.items?.length || 1,
                  paymentMode: order?.paymentMode,
                })
                .catch((err: any) => console.warn('[OrdersService] Admin order alert email error:', err?.message));
            }
          } catch (adminMailErr: any) {
            console.warn('[OrdersService] Admin email lookup error:', adminMailErr?.message);
          }
        }

        // 5. Text Message (SMS) Dispatch via Admin Configured SMS Provider
        const targetMobile = recipientMobile || customer.mobile;
        if (targetMobile) {
          if (eventType === 'ORDER_PLACED_SMS') {
            this.smsService
              .sendOrderPlacedSms(targetMobile, recipientName, orderNum, orderTotal)
              .catch((err: any) => console.warn('[OrdersService] SMS notification error:', err?.message));
          } else {
            const smsBody = `FarmsKing Order #${orderNum}: ${title}. ${body}. Track: https://farmsking.in/order-tracking`;
            this.smsService
              .sendTextMessage(targetMobile, smsBody, eventType)
              .catch((err: any) => console.warn('[OrdersService] SMS status update error:', err?.message));
          }
        }

        // 6. WhatsApp Business Text Message Dispatch
        if (targetMobile && !targetMobile.startsWith('G_')) {
          const itemsList = (order?.items || [])
            .map((i) => `• ${i.productName} (Qty: ${i.quantity}) - ₹${Number(i.price) * i.quantity}`)
            .join('\n');
          const waText = `📦 *FarmsKing Order Update*\n*Order #${orderNum}*\n\n*${title}*\n${body}\n${orderTotal > 0 ? `Total Amount: *₹${orderTotal}*\n` : ''}${itemsList ? `\n*Items:*\n${itemsList}\n` : ''}${order?.deliveryAddress ? `\n📍 *Delivery Address:* ${order.deliveryAddress}\n` : ''}\nTrack your order anytime: https://farmsking.in/order-tracking\n- _FARMSKING TECHNOLOGIES PRIVATE LIMITED_`;
          this.whatsappBotService
            .sendDirectTextMessage(targetMobile, waText)
            .catch((err: any) => console.warn('[OrdersService] WhatsApp alert error:', err?.message));
        }
      }
    } catch (notifyErr: any) {
      console.warn('[OrdersService] notifyCustomer multi-channel notice:', notifyErr?.message);
    }
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
    
    await this.notifyCustomer(
      order.customerId,
      '✅ Order Confirmed',
      `Your FarmsKing Order #${order.orderNumber} has been confirmed by seller. Packing in progress.`,
      id,
      'ORDER_CONFIRMED_SMS',
    );
    // Only credit affiliate coupon commission on confirmation when payment is already settled (prevents unpaid COD farming)
    if (order.paymentStatus === OrderPaymentStatus.PAID || order.paymentMode !== OrderPaymentMode.COD) {
      if (order.paymentStatus === OrderPaymentStatus.PAID) {
        await this.creditCouponCommission(id);
      }
    }
    this.triggerShiprocketSubOrders(order.id).catch((err) =>
      console.warn('Shiprocket confirm trigger notice:', err),
    );
    return updated;
  }

  /** Credits the partner's wallet with the coupon commission earned on this order, once, atomically. */
  private async creditCouponCommission(orderId: string) {
    const claimed = await this.prisma.couponRedemption.updateMany({
      where: { orderId, creditedAt: null },
      data: { creditedAt: new Date() },
    });
    if (claimed.count === 0) {
      return;
    }
    const redemption = await this.prisma.couponRedemption.findFirst({
      where: { orderId },
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
  }

  async cancel(user: AuthUser, id: string) {
    const order = await this.findOneOrThrow(user, id);
    const isStaff = this.isOrderStaff(user);
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

      // Clawback any affiliate coupon commission already credited for this cancelled order
      const creditedRedemption = await tx.couponRedemption.findFirst({
        where: { orderId: id, creditedAt: { not: null } },
        include: { coupon: true },
      });
      if (creditedRedemption && Number(creditedRedemption.commissionAmount) > 0) {
        const existingClawback = await tx.walletTransaction.findFirst({
          where: {
            userId: creditedRedemption.coupon.businessPartnerId,
            type: WalletTransactionType.DEBIT,
            reason: { contains: `Clawback for Cancelled Order #${order.orderNumber}` },
          },
        });
        if (!existingClawback) {
          await tx.walletTransaction.create({
            data: {
              userId: creditedRedemption.coupon.businessPartnerId,
              type: WalletTransactionType.DEBIT,
              amount: Number(creditedRedemption.commissionAmount),
              reason: `Clawback for Cancelled Order #${order.orderNumber}`,
              couponRedemptionId: creditedRedemption.id,
            },
          });
        }
      }

      if (Number(order.walletUsedAmount || 0) > 0) {
        const debitTx = await tx.walletTransaction.findFirst({
          where: {
            userId: order.customerId,
            type: WalletTransactionType.DEBIT,
            reason: { contains: `Order #${order.orderNumber}` },
          },
        });
        const alreadyRefunded = await tx.walletTransaction.findFirst({
          where: {
            userId: order.customerId,
            type: WalletTransactionType.CREDIT,
            reason: { contains: `Refund for Cancelled Order #${order.orderNumber}` },
          },
        });
        if (debitTx && !alreadyRefunded) {
          await tx.walletTransaction.create({
            data: {
              userId: order.customerId,
              type: WalletTransactionType.CREDIT,
              amount: Number(debitTx.amount),
              reason: `Refund for Cancelled Order #${order.orderNumber}`,
            },
          });
        }
      }

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
    const packedOrder = await this.prisma.customerOrder.update({
      where: { id },
      data: { status: OrderStatus.PACKED, packedById: operator.id, packedAt: new Date() },
      include: DETAIL_INCLUDE,
    });
    await this.notifyCustomer(
      order.customerId,
      '🎁 Order Ready & Packed',
      `Your FarmsKing Order #${order.orderNumber} is packed and ready for dispatch.`,
      id,
      'ORDER_PACKED_SMS',
    );
    return packedOrder;
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

    await this.ensurePendingSellerPayoutsForOrder(order.id).catch((err) =>
      console.warn('Delivered payout creation notice:', err),
    );

    await this.notifyCustomer(
      order.customerId,
      '📦 Order Delivered',
      `Your FarmsKing Order #${order.orderNumber} has been delivered successfully. Thank you for shopping with FarmsKing!`,
      id,
      'ORDER_DELIVERED_SMS',
    );

    return updated;
  }

  /** Creates PENDING SellerPayout records for COD / manually paid / delivered orders if not yet created */
  private async ensurePendingSellerPayoutsForOrder(orderId: string) {
    const order = await this.prisma.customerOrder.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true, sellerStore: true } },
      },
    });
    if (!order) return;

    const storeIds = Array.from(
      new Set(order.items.map((i) => i.sellerStoreId).filter((s): s is string => Boolean(s))),
    );
    const categoryCommMap = await this.getCategoryCommissionsMap(storeIds);

    const sellerMap = new Map<string, { store: any; items: typeof order.items }>();
    for (const item of order.items) {
      if (!item.sellerStoreId || !item.sellerStore) continue;
      const entry = sellerMap.get(item.sellerStoreId) || { store: item.sellerStore, items: [] };
      entry.items.push(item);
      sellerMap.set(item.sellerStoreId, entry);
    }

    for (const [sellerStoreId, group] of sellerMap.entries()) {
      const store = group.store;
      const isGstRegistered = isValidGstin(store?.gstin);
      const catComm = categoryCommMap.get(sellerStoreId);

      let totalGross = 0;
      let totalCommission = 0;
      let totalCommissionGst = 0;
      let totalTcs = 0;
      let netPayout = 0;

      const itemBreakdowns: Array<{ id: string; itemComm: number; itemTcs: number; itemNet: number }> = [];

      for (const item of group.items) {
        const itemSub = Number(item.subtotal || Number(item.price) * item.quantity);
        const commRate = this.resolveStoreCommissionRate(item.product, store, catComm);
        const calc = computeMarketplaceSettlement({
          grossAmount: itemSub,
          gstPercentage: Number(item.product?.gstPercentage || 0),
          commissionPercent: commRate,
          isSellerGstRegistered: isGstRegistered,
        });
        totalGross += itemSub;
        totalCommission += calc.commissionAmount;
        totalCommissionGst += calc.commissionGstAmount;
        totalTcs += calc.tcsAmount;
        netPayout += calc.netSellerPayout;
        itemBreakdowns.push({
          id: item.id,
          itemComm: calc.commissionAmount,
          itemTcs: calc.tcsAmount,
          itemNet: calc.netSellerPayout,
        });
      }

      const payoutRefNo = `PAY-${order.orderNumber}-${sellerStoreId.substring(0, 6)}`;

      const existing = await this.prisma.sellerPayout.findUnique({ where: { payoutRefNo } });
      if (existing) continue;

      const createdPayout = await this.prisma.sellerPayout.create({
        data: {
          sellerStoreId,
          payoutRefNo,
          totalGrossAmount: Number(totalGross.toFixed(2)),
          totalCommissionAmount: Number(totalCommission.toFixed(2)),
          commissionGstAmount: Number(totalCommissionGst.toFixed(2)),
          totalTcsAmount: Number(totalTcs.toFixed(2)),
          netPayoutAmount: Number(netPayout.toFixed(2)),
          status: SellerPayoutStatus.PENDING,
        },
      });

      for (const br of itemBreakdowns) {
        await this.prisma.customerOrderItem.update({
          where: { id: br.id },
          data: {
            commissionAmount: br.itemComm,
            tcsAmount: br.itemTcs,
            sellerPayoutAmount: br.itemNet,
            sellerPayoutId: createdPayout.id,
          },
        });
      }
    }
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
          panNumber: store?.panNumber || 'Form 60 / Exempt Primary Producer',
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
          hsnCode: item.product?.hsnCode || (item.product?.categorySlug === 'pesticides' ? '380899' : '120991'),
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

  /** Render HTML representation of a specific invoice (ownership enforced) */
  async getInvoiceHtml(user: AuthUser, invoiceId: string) {
    const invoice = await this.prisma.orderInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        order: { select: { customerId: true } },
        sellerStore: { select: { sellerId: true } },
      },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found.');
    }
    const isStaff = this.isOrderStaff(user);
    const isBuyer = invoice.order?.customerId === user.id;
    const isSeller = hasActiveRole(user, Role.SELLER) && invoice.sellerStore?.sellerId === user.id;
    if (!isStaff && !isBuyer && !isSeller) {
      throw new ForbiddenException('You do not have permission to view this invoice.');
    }
    return this.billingService.renderInvoiceHtml(invoice);
  }
}

