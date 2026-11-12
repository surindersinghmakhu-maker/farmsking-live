import { Injectable, Logger, BadRequestException, ForbiddenException, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashfreeVendorDto, CreateSplitOrderDto } from './dto/cashfree.dto';
import { OrderPaymentMode, OrderPaymentStatus, PlanPaymentStatus, Role, SellerPayoutStatus } from '@prisma/client';
import { hasActiveRole } from '../../common/utils/auth-user.util';
import { computeMarketplaceSettlement, isValidGstin } from '../../common/utils/tax-compliance.util';
import type { AuthUser } from '../../common/types/auth-user.type';
import * as crypto from 'crypto';

@Injectable()
export class CashfreeService {
  private readonly logger = new Logger(CashfreeService.name);
  private readonly appId: string;
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.appId = this.configService.get<string>('CASHFREE_APP_ID') || 'TEST_APP_ID';
    this.secretKey = this.configService.get<string>('CASHFREE_SECRET_KEY') || 'TEST_SECRET_KEY';
    const env = this.configService.get<string>('CASHFREE_ENV') || 'SANDBOX';
    
    this.baseUrl = env.toUpperCase() === 'PRODUCTION'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';
  }

  private getHeaders() {
    return {
      'x-client-id': this.appId,
      'x-client-secret': this.secretKey,
      'x-api-version': '2023-08-01',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Register or update a vendor on Cashfree Easy Split Marketplace
   */
  async createVendorOnCashfree(dto: CreateCashfreeVendorDto) {
    const endpoint = `${this.baseUrl}/easy-split/vendors`;

    const payload = {
      vendor_id: dto.vendorId,
      status: 'ACTIVE',
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      verify_account: true,
      bank_details: dto.bankAccountNo && dto.bankIfsc ? {
        account_number: dto.bankAccountNo,
        account_holder: dto.bankAccountHolderName || dto.name,
        ifsc: dto.bankIfsc,
      } : undefined,
      upi_details: dto.upiId ? {
        vpa: dto.upiId,
        account_holder: dto.name,
      } : undefined,
      kyc_details: dto.gstin ? {
        gstin: dto.gstin,
      } : undefined,
    };

    try {
      this.logger.log(`Creating Cashfree Vendor: ${dto.vendorId}`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok) {
        this.logger.error(`Cashfree Vendor Creation Failed: ${JSON.stringify(resData)}`);
        // If already exists, return success
        if (resData?.code === 'vendor_already_exists') {
          return { vendor_id: dto.vendorId, status: 'EXISTS' };
        }
        throw new BadRequestException(resData?.message || 'Cashfree Vendor registration failed.');
      }

      // Store Cashfree Vendor ID in Seller Store
      await this.prisma.sellerStore.updateMany({
        where: { id: dto.vendorId },
        data: { cashfreeVendorId: resData.vendor_id || dto.vendorId },
      });

      return resData;
    } catch (error) {
      this.logger.error('Error calling Cashfree Vendor API:', error);
      throw new InternalServerErrorException(error.message || 'Cashfree API error');
    }
  }

  /**
   * Create Cashfree Split Payment Order with Vendor Settlements
   */
  async createSplitOrder(dto: CreateSplitOrderDto) {
    const endpoint = `${this.baseUrl}/orders`;

    // Construct Cashfree Order Splits (0.5% Sec 52 TCS + Commission + 18% GST on commission)
    const rawSplits = dto.splits.map((split) => {
      const calc = computeMarketplaceSettlement({
        grossAmount: split.itemSubtotal,
        gstPercentage: Number((split as any).gstPercentage || 0),
        commissionPercent: Number(split.commissionRate ?? 8.0),
        isSellerGstRegistered: Boolean((split as any).isGstRegistered),
      });
      return {
        vendor_id: split.cashfreeVendorId,
        amount: calc.netSellerPayout,
      };
    });

    const totalVendorSplits = rawSplits.reduce((s, x) => s + x.amount, 0);
    const scaleFactor = totalVendorSplits > dto.amount && totalVendorSplits > 0 ? dto.amount / totalVendorSplits : 1;
    const orderSplits = rawSplits
      .map((s) => ({
        vendor_id: s.vendor_id,
        amount: Number((s.amount * scaleFactor).toFixed(2)),
        percentage: undefined,
      }))
      .filter((s) => s.amount > 0);

    const payload = {
      order_id: dto.orderId,
      order_amount: dto.amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: dto.customerId,
        customer_name: dto.customerName || 'FarmsKing Customer',
        customer_phone: dto.customerPhone,
      },
      order_splits: orderSplits.length > 0 ? orderSplits : undefined,
      order_meta: {
        return_url: `${(process.env.APP_URL || 'https://farmsking.in').replace(/\/$/, '')}/order-status?order_id={order_id}`,
        notify_url: `${(process.env.BACKEND_URL || process.env.APP_URL || 'https://farmsking.in').replace(/\/$/, '')}/api/v1/cashfree/webhook`,
      },
    };

    try {
      this.logger.log(`Creating Cashfree Order: ${dto.orderId}`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok) {
        this.logger.error(`Cashfree Order Creation Failed: ${JSON.stringify(resData)}`);
        throw new BadRequestException(resData?.message || 'Cashfree Order creation failed.');
      }

      return {
        orderId: resData.order_id,
        paymentSessionId: resData.payment_session_id,
        orderStatus: resData.order_status,
      };
    } catch (error) {
      this.logger.error('Error creating Cashfree split order:', error);
      throw new InternalServerErrorException(error.message || 'Cashfree Split Order creation failed.');
    }
  }

  /**
   * Create Standard Cashfree Order (No Splits) - Used for Plan Payments
   */
  async createStandardOrder(dto: { orderId: string; amount: number; customerId: string; customerPhone: string; customerName?: string }) {
    const endpoint = `${this.baseUrl}/orders`;

    const payload = {
      order_id: dto.orderId,
      order_amount: dto.amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: dto.customerId,
        customer_name: dto.customerName || 'FarmsKing User',
        customer_phone: dto.customerPhone || '9999999999',
      },
      order_meta: {
        return_url: `https://farmsking.in/payment-status?order_id={order_id}`,
        notify_url: `https://api.farmsking.in/cashfree/webhook`,
      },
    };

    try {
      this.logger.log(`Creating Cashfree Standard Order: ${dto.orderId}`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok) {
        this.logger.error(`Cashfree Order Creation Failed: ${JSON.stringify(resData)}`);
        throw new BadRequestException(resData?.message || 'Cashfree Order creation failed.');
      }

      return {
        orderId: resData.order_id,
        paymentSessionId: resData.payment_session_id,
        orderStatus: resData.order_status,
      };
    } catch (error) {
      this.logger.error('Error creating Cashfree standard order:', error);
      throw new InternalServerErrorException(error.message || 'Cashfree Order creation failed.');
    }
  }

  /**
   * Verify Payment Session Status from Cashfree
   */
  /**
   * Create Recurring Subscription (Google Pay / PhonePe UPI AutoPay) on Cashfree
   */
  async createSubscription(dto: {
    subscriptionId: string;
    planName: string;
    amount: number;
    intervalType?: 'MONTH' | 'YEAR';
    customerId: string;
    customerPhone: string;
    customerEmail?: string;
    customerName?: string;
  }) {
    const subBaseUrl = this.baseUrl.includes('sandbox')
      ? 'https://sandbox.cashfree.com/sub'
      : 'https://api.cashfree.com/sub';

    const payload = {
      subscriptionId: dto.subscriptionId,
      planId: `PLAN_${(dto.planName || 'VIP').toUpperCase().replace(/\s+/g, '_')}`,
      customerName: dto.customerName || 'FarmsKing Farmer',
      customerPhone: dto.customerPhone || '9999999999',
      customerEmail: dto.customerEmail || 'support@farmsking.in',
      authModes: ['UPI', 'ENACH', 'CARD'],
      amount: dto.amount,
      returnUrl: `https://farmsking.in/payment-status?sub_id={sub_id}`,
      notificationChannels: ['SMS', 'EMAIL'],
    };

    try {
      this.logger.log(`Creating Cashfree Recurring Subscription: ${dto.subscriptionId}`);
      const response = await fetch(`${subBaseUrl}/subscriptions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (!response.ok) {
        this.logger.warn(`Cashfree direct Subscriptions API status ${response.status}. Falling back to standard PG checkout.`);
        const stdOrder = await this.createStandardOrder({
          orderId: dto.subscriptionId,
          amount: dto.amount,
          customerId: dto.customerId,
          customerPhone: dto.customerPhone,
          customerName: dto.customerName,
        });
        return {
          subscriptionId: dto.subscriptionId,
          paymentSessionId: stdOrder.paymentSessionId,
          subscriptionLink: `https://payments.cashfree.com/order/#${stdOrder.paymentSessionId}`,
        };
      }

      return {
        subscriptionId: resData.subscriptionId || dto.subscriptionId,
        paymentSessionId: resData.paymentSessionId || null,
        subscriptionLink: resData.authLink || resData.subscriptionLink || `https://payments.cashfree.com/subscriptions/${resData.subscriptionId || dto.subscriptionId}`,
      };
    } catch (error) {
      this.logger.warn('Cashfree subscription creation fallback to standard order:', error?.message);
      const stdOrder = await this.createStandardOrder({
        orderId: dto.subscriptionId,
        amount: dto.amount,
        customerId: dto.customerId,
        customerPhone: dto.customerPhone,
        customerName: dto.customerName,
      });
      return {
        subscriptionId: dto.subscriptionId,
        paymentSessionId: stdOrder.paymentSessionId,
        subscriptionLink: `https://payments.cashfree.com/order/#${stdOrder.paymentSessionId}`,
      };
    }
  }

  async verifyPayment(orderId: string, caller?: AuthUser) {
    const isAdmin = caller ? hasActiveRole(caller, Role.ADMIN) || hasActiveRole(caller, Role.SUPER_ADMIN) : false;

    if (caller && !isAdmin) {
      if (orderId.startsWith('WALLET-')) {
        const walletMatch = /^WALLET-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-/i.exec(orderId);
        const ownerId = walletMatch?.[1];
        if (!ownerId || ownerId !== caller.id) {
          throw new ForbiddenException('You can only verify your own wallet top-up order.');
        }
      } else if (orderId.startsWith('PLAN-')) {
        const req = await this.prisma.farmerPlanPaymentRequest.findUnique({
          where: { id: orderId.replace('PLAN-', '') },
          select: { farmerId: true },
        });
        if (req && req.farmerId !== caller.id) {
          throw new ForbiddenException('You can only verify your own plan payment order.');
        }
      } else if (orderId.startsWith('GCARD-')) {
        const req = await this.prisma.gardenerPlanPaymentRequest.findUnique({
          where: { id: orderId.replace('GCARD-', '') },
          select: { gardenerId: true },
        });
        if (req && req.gardenerId !== caller.id) {
          throw new ForbiddenException('You can only verify your own garden card payment order.');
        }
      } else if (!orderId.startsWith('DOC-')) {
        const order = await this.prisma.customerOrder.findUnique({
          where: { orderNumber: orderId },
          select: { customerId: true },
        });
        if (order && order.customerId !== caller.id) {
          throw new ForbiddenException('You can only verify your own order payment.');
        }
      }
    }

    const endpoint = `${this.baseUrl}/orders/${orderId}`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new BadRequestException(resData?.message || 'Failed to verify Cashfree order');
      }

      if (resData.order_status === 'PAID') {
        if (orderId.startsWith('PLAN-')) {
          await this.handlePlanPaymentSuccess(orderId);
        } else if (orderId.startsWith('GCARD-')) {
          await this.handleGardenerPlanPaymentSuccess(orderId);
        } else if (orderId.startsWith('WALLET-')) {
          await this.handleWalletTopupSuccess(orderId, resData);
        } else if (orderId.startsWith('DOC-')) {
          await this.handleDoctorConsultationSuccess(orderId);
        } else {
          await this.handlePaymentSuccess(orderId, resData);
        }
      }

      return resData;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error verifying Cashfree order ${orderId}:`, error);
      throw new InternalServerErrorException('Error verifying payment status');
    }
  }

  /**
   * Internal Helper: Process Payment Success & Update Seller Payouts + TCS
   */
  async handlePaymentSuccess(orderId: string, cashfreeData: any) {
    const order = await this.prisma.customerOrder.findUnique({
      where: { orderNumber: orderId },
      include: {
        items: {
          include: {
            sellerStore: true,
            product: {
              select: {
                gstPercentage: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      this.logger.warn(`Order ${orderId} not found in database for payment confirmation.`);
      return;
    }

    // Update CustomerOrder Payment Status
    await this.prisma.customerOrder.update({
      where: { id: order.id },
      data: {
        paymentStatus: OrderPaymentStatus.PAID,
        phonepeMerchantOrderId: cashfreeData?.order_id || orderId,
        phonepePaymentState: cashfreeData?.order_status || 'PAID',
      },
    });

    // Group items by Seller Store to calculate Payouts & 1% TCS Tax
    const sellerMap = new Map<string, { storeId: string; subtotal: number; items: typeof order.items }>();

    for (const item of order.items) {
      if (!item.sellerStoreId) continue;
      const subtotal = Number(item.subtotal || Number(item.price) * item.quantity);
      
      const existing = sellerMap.get(item.sellerStoreId) || { storeId: item.sellerStoreId, subtotal: 0, items: [] };
      existing.subtotal += subtotal;
      existing.items.push(item);
      sellerMap.set(item.sellerStoreId, existing);
    }

    // Generate Seller Payout Records
    for (const [sellerStoreId, data] of sellerMap.entries()) {
      const store = await this.prisma.sellerStore.findUnique({ where: { id: sellerStoreId } });
      const commissionRate = Number(store?.commissionRate ?? 8.0);
      const isGstRegistered = isValidGstin(store?.gstin);

      let totalCommission = 0;
      let totalCommissionGst = 0;
      let totalTcs = 0;
      let netPayoutAmount = 0;

      for (const item of data.items) {
        const itemSubtotal = Number(item.subtotal || Number(item.price) * item.quantity);
        const gstPct = Number(item.product?.gstPercentage || 0);
        const calc = computeMarketplaceSettlement({
          grossAmount: itemSubtotal,
          gstPercentage: gstPct,
          commissionPercent: commissionRate,
          isSellerGstRegistered: isGstRegistered,
        });

        totalCommission += calc.commissionAmount;
        totalCommissionGst += calc.commissionGstAmount;
        totalTcs += calc.tcsAmount;
        netPayoutAmount += calc.netSellerPayout;
      }

      const payoutStatus: SellerPayoutStatus = SellerPayoutStatus.PENDING;
      const payoutRefNo = `PAY-${order.orderNumber}-${sellerStoreId.substring(0, 6)}`;

      const payoutRecord = await this.prisma.sellerPayout.upsert({
        where: { payoutRefNo },
        create: {
          sellerStoreId,
          payoutRefNo,
          totalGrossAmount: Number(data.subtotal.toFixed(2)),
          totalCommissionAmount: Number(totalCommission.toFixed(2)),
          commissionGstAmount: Number(totalCommissionGst.toFixed(2)),
          totalTcsAmount: Number(totalTcs.toFixed(2)),
          netPayoutAmount: Number(netPayoutAmount.toFixed(2)),
          status: payoutStatus,
          paidAt: null,
        },
        update: {
          status: payoutStatus,
        },
      });

      // Update item level payouts
      for (const item of data.items) {
        const itemSubtotal = Number(item.subtotal || Number(item.price) * item.quantity);
        const gstPct = Number(item.product?.gstPercentage || 0);
        const calc = computeMarketplaceSettlement({
          grossAmount: itemSubtotal,
          gstPercentage: gstPct,
          commissionPercent: commissionRate,
          isSellerGstRegistered: isGstRegistered,
        });

        await this.prisma.customerOrderItem.update({
          where: { id: item.id },
          data: {
            subtotal: itemSubtotal,
            commissionAmount: calc.commissionAmount,
            tcsAmount: calc.tcsAmount,
            sellerPayoutAmount: calc.netSellerPayout,
            sellerPayoutId: payoutRecord.id,
          },
        });
      }
    }
  }

  /**
   * Cashfree Webhook Handler
   */
  async handleWebhook(body: any, signature?: string, timestamp?: string, rawBody?: string) {
    if (!this.secretKey || this.secretKey === 'TEST_SECRET_KEY') {
      throw new UnauthorizedException('Cashfree webhook secret is not configured.');
    }
    if (!signature || !timestamp || !rawBody) {
      throw new UnauthorizedException('Missing Cashfree webhook signature headers.');
    }
    const signedPayload = `${timestamp}${rawBody}`;
    const expected = crypto.createHmac('sha256', this.secretKey).update(signedPayload).digest('base64');
    const expectedBuf = Buffer.from(expected, 'utf8');
    const signatureBuf = Buffer.from(signature, 'utf8');
    if (expectedBuf.length !== signatureBuf.length || !crypto.timingSafeEqual(expectedBuf, signatureBuf)) {
      throw new UnauthorizedException('Invalid Cashfree webhook signature.');
    }

    this.logger.log(`Cashfree Webhook received: ${JSON.stringify(body)}`);

    const orderId = body?.data?.order?.order_id;
    if (!orderId || typeof orderId !== 'string' || !/^[A-Za-z0-9_-]{3,80}$/.test(orderId)) {
      return { status: 'IGNORED' };
    }

    try {
      // ALWAYS verify the order status with Cashfree directly to prevent spoofing
      const endpoint = `${this.baseUrl}/orders/${orderId}`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const resData = await response.json();
      
      if (!response.ok || resData.order_status !== 'PAID') {
        this.logger.warn(`Cashfree Webhook Spoof Attempt or Not Paid: ${orderId}`);
        return { status: 'VERIFICATION_FAILED_OR_NOT_PAID' };
      }

      // It is securely verified as PAID by Cashfree API
      if (orderId.startsWith('PLAN-')) {
        await this.handlePlanPaymentSuccess(orderId);
      } else if (orderId.startsWith('GCARD-')) {
        await this.handleGardenerPlanPaymentSuccess(orderId);
      } else if (orderId.startsWith('WALLET-')) {
        await this.handleWalletTopupSuccess(orderId, resData);
      } else if (orderId.startsWith('DOC-')) {
        await this.handleDoctorConsultationSuccess(orderId);
      } else {
        await this.handlePaymentSuccess(orderId, resData);
      }

      return { status: 'SUCCESS' };
    } catch (e: any) {
      if (e instanceof UnauthorizedException) throw e;
      this.logger.error(`Cashfree Webhook verification failed for ${orderId}: ${e.message}`);
      return { status: 'ERROR' };
    }
  }

  /** Handle Wallet Top-up via Cashfree (idempotent + full UUID parsing) */
  async handleWalletTopupSuccess(orderId: string, cashfreeData: any) {
    const uuidMatch = /^WALLET-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:-(\d+))?/i.exec(orderId);
    const parts = orderId.split('-');
    const userId = uuidMatch?.[1] || (parts.length >= 3 ? parts.slice(1, -1).join('-') : '');
    const amount = Number(cashfreeData?.order_amount || (uuidMatch?.[2] ?? parts[parts.length - 1]));

    if (!userId || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    const orderMarker = `(Order: ${orderId})`;
    await this.prisma.$transaction(async (tx) => {
      const existingCredit = await tx.walletTransaction.findFirst({
        where: {
          userId,
          reason: { contains: orderMarker },
        },
        select: { id: true },
      });
      if (existingCredit) {
        return;
      }

      const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!user) return;

      await tx.walletTransaction.create({
        data: {
          userId,
          amount,
          type: 'CREDIT',
          reason: `Cashfree Online Wallet Recharge ₹${amount} ${orderMarker}`,
        },
      });
    });
  }

  /** Handle Doctor Consultation Fee via Cashfree */
  async handleDoctorConsultationSuccess(orderId: string) {
    this.logger.log(`Doctor consultation payment confirmed for order: ${orderId}`);
  }

  /**
   * Handle Plan Payment Success
   */
  async handlePlanPaymentSuccess(orderId: string) {
    const requestId = orderId.replace('PLAN-', '');
    // We will update the status to PAID. The actual confirmation (coupon generation) can be triggered separately or handled directly.
    await this.prisma.farmerPlanPaymentRequest.updateMany({
      where: { id: requestId, status: 'PENDING' },
      data: { status: 'SUBMITTED', utr: 'CASHFREE-AUTO', submittedAt: new Date() },
    });
  }

  async handleGardenerPlanPaymentSuccess(orderId: string) {
    const requestId = orderId.replace('GCARD-', '');
    const request = await this.prisma.gardenerPlanPaymentRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.status !== 'PENDING') return;

    await this.prisma.$transaction(async (tx) => {
      // Mark as paid
      await tx.gardenerPlanPaymentRequest.update({
        where: { id: requestId },
        data: { status: PlanPaymentStatus.CONFIRMED, paidAt: new Date() },
      });
      
      const now = new Date();
      // Directly activate the plan
      await tx.gardenerPlan.upsert({
        where: { gardenerId: request.gardenerId },
        create: {
          gardenerId: request.gardenerId,
          plan: request.plan,
          startDate: now,
          endDate: null,
          expiredAt: null,
        },
        update: {
          plan: request.plan,
          startDate: now,
          endDate: null,
          expiredAt: null,
        },
      });

      // Fetch user to get their address and role
      const gardener = await tx.user.findUnique({ where: { id: request.gardenerId } });
      const address = gardener ? [gardener.village, gardener.district, gardener.state, gardener.pincode].filter(Boolean).join(', ') : 'Registered Address';

      // Place a free order for Flower Seeds Gift Pack ONLY for active GARDENER role
      if (gardener && hasActiveRole(gardener as any, Role.GARDENER)) {
        const giftOrderNumber = `GIFT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        await tx.customerOrder.create({
          data: {
            customerId: request.gardenerId,
            orderNumber: giftOrderNumber,
            totalAmount: 0,
            discountAmount: request.amount, // MRP is discounted to 0
            deliveryAddress: address,
            paymentMode: OrderPaymentMode.ONLINE, // Pre-paid via plan card
            paymentStatus: 'PAID',
            items: {
              create: [
                {
                  productName: `Flower Seeds Gift Pack (${request.plan} Plan Offer)`,
                  quantity: 1,
                  price: request.amount, // MRP is same as plan price
                  sellerStoreId: null, // Platform is the seller
                  subtotal: request.amount,
                }
              ]
            }
          }
        });
      }
    });
  }
}
