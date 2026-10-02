import { Injectable, Logger, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashfreeVendorDto, CreateSplitOrderDto } from './dto/cashfree.dto';
import { OrderPaymentStatus, SellerPayoutStatus } from '@prisma/client';

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

    // Construct Cashfree Order Splits
    const orderSplits = dto.splits.map((split) => {
      const commissionPercent = split.commissionRate || 5.0; // 5% platform commission
      const tcsPercent = 1.0; // 1% GST TCS tax
      const totalDeductionPercent = commissionPercent + tcsPercent;
      
      const vendorAmount = Number((split.itemSubtotal * (1 - totalDeductionPercent / 100)).toFixed(2));

      return {
        vendor_id: split.cashfreeVendorId,
        amount: vendorAmount,
        percentage: undefined,
      };
    });

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
        return_url: `https://farmsking.in/order-status?order_id={order_id}`,
        notify_url: `https://api.farmsking.in/cashfree/webhook`,
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
  async verifyPayment(orderId: string) {
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
        await this.handlePaymentSuccess(orderId, resData);
      }

      return resData;
    } catch (error) {
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
      const commissionRate = Number(store?.commissionRate || 5.0); // 5%
      
      const commissionAmount = (data.subtotal * commissionRate) / 100;
      const tcsAmount = (data.subtotal * 1.0) / 100; // 1% GST TCS
      const netPayoutAmount = data.subtotal - commissionAmount - tcsAmount;

      const payoutRefNo = `PAY-${order.orderNumber}-${sellerStoreId.substring(0, 6)}`;

      await this.prisma.sellerPayout.upsert({
        where: { payoutRefNo },
        create: {
          sellerStoreId,
          payoutRefNo,
          totalGrossAmount: data.subtotal,
          totalCommissionAmount: commissionAmount,
          totalTcsAmount: tcsAmount,
          netPayoutAmount: netPayoutAmount,
          status: SellerPayoutStatus.SETTLED,
          paidAt: new Date(),
        },
        update: {
          status: SellerPayoutStatus.SETTLED,
          paidAt: new Date(),
        },
      });

      // Update item level payouts
      for (const item of data.items) {
        const itemSubtotal = Number(item.subtotal || Number(item.price) * item.quantity);
        const itemCommission = (itemSubtotal * commissionRate) / 100;
        const itemTcs = (itemSubtotal * 1.0) / 100;
        const itemNetPayout = itemSubtotal - itemCommission - itemTcs;

        await this.prisma.customerOrderItem.update({
          where: { id: item.id },
          data: {
            subtotal: itemSubtotal,
            commissionAmount: itemCommission,
            tcsAmount: itemTcs,
            sellerPayoutAmount: itemNetPayout,
          },
        });
      }
    }
  }

  /**
   * Cashfree Webhook Handler
   */
  async handleWebhook(body: any) {
    this.logger.log(`Cashfree Webhook received: ${JSON.stringify(body)}`);

    const orderId = body?.data?.order?.order_id;
    const orderStatus = body?.data?.order?.order_status;

    if (orderId && orderStatus === 'PAID') {
      if (orderId.startsWith('PLAN-')) {
        await this.handlePlanPaymentSuccess(orderId);
      } else if (orderId.startsWith('GCARD-')) {
        await this.handleGardenerPlanPaymentSuccess(orderId);
      } else {
        await this.handlePaymentSuccess(orderId, body.data.order);
      }
    }

    return { status: 'SUCCESS' };
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
        data: { status: 'APPROVED', paidAt: new Date() },
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
      const address = gardener ? [gardener.village, gardener.tehsil, gardener.district, gardener.state, gardener.pincode].filter(Boolean).join(', ') : 'Registered Address';

      // Place a free order for Flower Seeds Gift Pack ONLY for GARDENER role
      if (gardener?.role === 'GARDENER') {
        const giftOrderNumber = `GIFT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        await tx.customerOrder.create({
          data: {
            customerId: request.gardenerId,
            orderNumber: giftOrderNumber,
            totalAmount: 0,
            discountAmount: request.amount, // MRP is discounted to 0
            deliveryAddress: address,
            paymentMode: 'PREPAID', // It's free, effectively prepaid
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
