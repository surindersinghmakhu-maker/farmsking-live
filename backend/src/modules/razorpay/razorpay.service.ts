import { Injectable, Logger, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { CreateRazorpayOrderDto, CreateRazorpaySubscriptionDto, VerifyRazorpayPaymentDto } from './dto/razorpay.dto';
import { PlanPaymentStatus, NotificationType, PlanCouponCategory, FarmerSubscriptionPlan } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly appSettingsService: AppSettingsService,
  ) {
    this.keyId = this.configService.get<string>('RAZORPAY_KEY_ID') || '';
    this.keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || '';
    this.webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET') || '';
  }

  /**
   * Lazily refresh credentials from AppSettings systemIntegrations if configured by Admin.
   */
  private async getCredentials(): Promise<{ keyId: string; keySecret: string; webhookSecret: string }> {
    try {
      const integrations = await this.appSettingsService.getIntegrations();
      const rzpConfig = integrations?.gateway?.providers?.razorpay;
      if (rzpConfig?.keyId && rzpConfig?.keySecret) {
        return {
          keyId: rzpConfig.keyId,
          keySecret: rzpConfig.keySecret,
          webhookSecret: rzpConfig.webhookSecret || this.webhookSecret,
        };
      }
    } catch {
      // Fallback to environment variables
    }
    return {
      keyId: this.keyId,
      keySecret: this.keySecret,
      webhookSecret: this.webhookSecret,
    };
  }

  private async getBasicAuthHeader(): Promise<string> {
    const creds = await this.getCredentials();
    if (!creds.keyId || !creds.keySecret) {
      throw new BadRequestException('Razorpay credentials are not configured. Please contact support.');
    }
    return 'Basic ' + Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64');
  }

  /**
   * Create a standard one-time Razorpay Order
   */
  async createStandardOrder(dto: CreateRazorpayOrderDto) {
    const creds = await this.getCredentials();
    const authHeader = await this.getBasicAuthHeader();

    const payload = {
      amount: Math.round(dto.amount * 100), // In paise
      currency: 'INR',
      receipt: dto.orderId,
      notes: {
        orderId: dto.orderId,
        customerId: dto.customerId || '',
        customerPhone: dto.customerPhone || '',
        ...(dto.notes || {}),
      },
    };

    try {
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        this.logger.error(`Razorpay order creation failed: ${JSON.stringify(data)}`);
        throw new BadRequestException(data.error?.description || 'Failed to initialize Razorpay payment');
      }

      return {
        orderId: dto.orderId,
        razorpayOrderId: data.id,
        amount: dto.amount,
        currency: 'INR',
        keyId: creds.keyId,
      };
    } catch (err: any) {
      this.logger.error('Error creating Razorpay order', err);
      throw new BadRequestException(err.message || 'Razorpay initialization failed');
    }
  }

  /**
   * Create a recurring Subscription (Google Pay / PhonePe UPI AutoPay) on Razorpay
   */
  async createSubscription(dto: CreateRazorpaySubscriptionDto) {
    const creds = await this.getCredentials();
    const authHeader = await this.getBasicAuthHeader();

    try {
      // Step 1: Create or identify plan on Razorpay
      const planPayload = {
        period: dto.intervalType || 'monthly',
        interval: 1,
        item: {
          name: dto.planName,
          amount: Math.round(dto.amount * 100), // In paise
          currency: 'INR',
          description: `FarmsKing ${dto.planName} Recurring UPI AutoPay`,
        },
        notes: {
          customerId: dto.customerId || '',
          customerPhone: dto.customerPhone || '',
        },
      };

      const planRes = await fetch('https://api.razorpay.com/v1/plans', {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planPayload),
      });

      const planData = await planRes.json();
      if (!planRes.ok) {
        this.logger.error(`Razorpay plan creation failed: ${JSON.stringify(planData)}`);
        throw new BadRequestException(planData.error?.description || 'Failed to create subscription plan on Razorpay');
      }

      // Step 2: Create recurring subscription instance
      const subPayload = {
        plan_id: planData.id,
        total_count: dto.totalCount || 12,
        quantity: 1,
        customer_notify: 1,
        notes: {
          customerId: dto.customerId || '',
          customerPhone: dto.customerPhone || '',
          customerName: dto.customerName || '',
          ...(dto.notes || {}),
        },
      };

      const subRes = await fetch('https://api.razorpay.com/v1/subscriptions', {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subPayload),
      });

      const subData = await subRes.json();
      if (!subRes.ok) {
        this.logger.error(`Razorpay subscription creation failed: ${JSON.stringify(subData)}`);
        throw new BadRequestException(subData.error?.description || 'Failed to initialize Razorpay subscription');
      }

      return {
        subscriptionId: subData.id,
        planId: planData.id,
        shortUrl: subData.short_url,
        status: subData.status,
        amount: dto.amount,
        keyId: creds.keyId,
      };
    } catch (err: any) {
      this.logger.error('Error creating Razorpay subscription', err);
      throw new BadRequestException(err.message || 'Razorpay subscription creation failed');
    }
  }

  /**
   * Verify Razorpay Client Payment Signature
   */
  async verifyPayment(dto: VerifyRazorpayPaymentDto): Promise<{ success: boolean; message: string }> {
    const creds = await this.getCredentials();
    if (!creds.keySecret) {
      throw new UnauthorizedException('Razorpay verification secret is not configured.');
    }
    const body = `${dto.razorpayOrderId}|${dto.razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', creds.keySecret)
      .update(body)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const actualBuf = Buffer.from(dto.razorpaySignature || '', 'utf8');
    if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
      throw new BadRequestException('Invalid Razorpay payment signature');
    }

    return {
      success: true,
      message: 'Payment signature verified successfully',
    };
  }

  /**
   * Verify Webhook Signature
   */
  verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    try {
      const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  /**
   * Razorpay Webhook Handler
   */
  async handleWebhook(rawBody: string, signatureHeader?: string) {
    const creds = await this.getCredentials();
    const webhookSecret = creds.webhookSecret?.trim();
    if (!webhookSecret || webhookSecret === 'rzp_webhook_secret' || !signatureHeader) {
      throw new UnauthorizedException('Razorpay webhook signature or secret verification failed.');
    }

    const isValid = this.verifyWebhookSignature(rawBody, signatureHeader, webhookSecret);
    if (!isValid) {
      this.logger.warn('Razorpay webhook signature verification failed');
      throw new UnauthorizedException('Invalid Razorpay webhook signature.');
    }

    let payload: any;
    try {
      payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    } catch {
      payload = rawBody;
    }

    const event = payload?.event;
    this.logger.log(`Received Razorpay webhook event: ${event}`);

    // Event 1: One-time payment captured or order paid
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payload?.payment?.entity || payload?.payload?.order?.entity;
      const receipt = paymentEntity?.receipt || paymentEntity?.notes?.orderId;
      if (receipt) {
        await this.handleFulfillment(receipt, paymentEntity);
      }
    }

    // Event 2: Recurring Subscription Charged (UPI AutoPay renewal)
    if (event === 'subscription.charged') {
      const subEntity = payload?.payload?.subscription?.entity;
      const paymentEntity = payload?.payload?.payment?.entity;
      const receipt = subEntity?.notes?.orderId || paymentEntity?.notes?.orderId;
      if (receipt) {
        await this.handleFulfillment(receipt, paymentEntity, true);
      }
    }

    return { status: 'OK', event };
  }

  /**
   * Fulfill order or plan payment upon successful charge
   */
  private async handleFulfillment(orderId: string, paymentData: any, isRecurringCharge: boolean = false) {
    if (orderId.startsWith('PLAN-')) {
      await this.handlePlanPaymentSuccess(orderId, paymentData, isRecurringCharge);
    } else if (orderId.startsWith('GCARD-')) {
      await this.handleGardenerPlanPaymentSuccess(orderId);
    }
  }

  /**
   * Handle Farmer VIP Plan Payment Success
   */
  async handlePlanPaymentSuccess(orderId: string, paymentData?: any, isRecurring?: boolean) {
    const requestId = orderId.replace('PLAN-', '');
    const request = await this.prisma.farmerPlanPaymentRequest.findUnique({
      where: { id: requestId },
      include: {
        farmer: true,
      },
    });

    if (!request) {
      this.logger.warn(`FarmerPlanPaymentRequest ${requestId} not found for Razorpay fulfillment`);
      return;
    }
    if (request.status === PlanPaymentStatus.CONFIRMED) {
      return;
    }

    // Atomic claim to ensure duplicate webhooks cannot double-mint VIP coupons
    const claimed = await this.prisma.farmerPlanPaymentRequest.updateMany({
      where: { id: requestId, status: { not: PlanPaymentStatus.CONFIRMED } },
      data: {
        status: PlanPaymentStatus.CONFIRMED,
        utr: paymentData?.id ? `RZP-${paymentData.id}` : (isRecurring ? 'RZP-AUTOPAY' : 'RZP-PAID'),
        submittedAt: new Date(),
        confirmedAt: new Date(),
      },
    });
    if (claimed.count === 0) {
      return;
    }

    // Auto-extend farmer plan
    const prefix = request.targetPlan === FarmerSubscriptionPlan.PRO ? 'FB' : request.targetPlan === FarmerSubscriptionPlan.SMART ? 'FP' : 'FS';
    const code = `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;

    const isAdvisorPlan =
      request.targetPlan === FarmerSubscriptionPlan.SMART ||
      request.targetPlan === FarmerSubscriptionPlan.SUPER ||
      request.targetPlan === FarmerSubscriptionPlan.GOLD ||
      request.targetPlan === FarmerSubscriptionPlan.ROYAL;

    await this.prisma.farmerPlanCoupon.create({
      data: {
        code,
        category: isAdvisorPlan ? PlanCouponCategory.DOCTOR_CONSULTATION : PlanCouponCategory.FARMER_PLAN,
        plan: request.targetPlan,
        daysGranted: request.daysGranted,
        assignedFarmerId: request.farmerId,
        assignedAdvisorId: request.selectedAdvisorId ?? undefined,
        doctorKingId: request.doctorKingId ?? null,
        advisorKingId: request.advisorKingId ?? null,
        createdById: request.selectedDoctorId ?? request.farmerId,
        createdByRole: 'SYSTEM' as any,
        isUsed: true,
        usedAt: new Date(),
        usedByFarmerId: request.farmerId,
        generationCostAmount: request.amount,
      },
    });

    // Send instant push notification
    await this.prisma.notification.create({
      data: {
        userId: request.farmerId,
        type: NotificationType.SYSTEM,
        title: isRecurring ? '🔄 Auto-Debit Successful' : '✅ VIP Plan Activated',
        body: isRecurring
          ? `Your recurring subscription of ₹${request.amount} was debited successfully via UPI AutoPay. Plan renewed for ${request.daysGranted} days.`
          : `Payment of ₹${request.amount} verified via Razorpay. Your ${request.targetPlan} plan is active!`,
        data: { farmerPlanPaymentRequestId: requestId, couponCode: code },
      },
    });

    this.logger.log(`Successfully confirmed Razorpay plan payment ${requestId} for farmer ${request.farmer.name}`);
  }

  /**
   * Handle Gardener Plan Payment Success
   */
  async handleGardenerPlanPaymentSuccess(orderId: string) {
    const requestId = orderId.replace('GCARD-', '');
    const request = await this.prisma.gardenerPlanPaymentRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.status !== 'PENDING') return;

    await this.prisma.$transaction(async (tx) => {
      await tx.gardenerPlanPaymentRequest.update({
        where: { id: requestId },
        data: { status: PlanPaymentStatus.CONFIRMED, paidAt: new Date() },
      });

      const now = new Date();
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
    });
  }
}

