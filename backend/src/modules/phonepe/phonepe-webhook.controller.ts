import { Body, Controller, Get, Headers, HttpCode, Logger, Param, Post } from '@nestjs/common';
import { FarmerSubscriptionPlan, NotificationType, OrderPaymentStatus, PlanCouponCategory, PlanPaymentStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PhonePeService } from './phonepe.service';

interface PhonePeWebhookPayload {
  event: string;
  payload: {
    orderId: string;
    merchantOrderId: string;
    state: 'COMPLETED' | 'FAILED' | 'PENDING';
    amount: number;
  };
}

/** Public S2S webhook & Status Check — PhonePe calls this directly or frontend status check */
@Controller('payments/phonepe')
export class PhonePeWebhookController {
  private readonly logger = new Logger(PhonePeWebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly phonePeService: PhonePeService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get('status/:merchantOrderId')
  async getStatus(@Param('merchantOrderId') merchantOrderId: string) {
    try {
      const res = await this.phonePeService.checkStatus(merchantOrderId);
      if (res.state === 'COMPLETED') {
        await this.handleSuccessFulfillment(merchantOrderId, res.orderId, res.amount / 100);
      }
      return { success: true, ...res };
    } catch (err: any) {
      return { success: false, state: 'PENDING', message: err?.message || 'Status check failed' };
    }
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Headers('authorization') authorization: string | undefined, @Body() body: PhonePeWebhookPayload) {
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
          where: { id: requestId, status: PlanPaymentStatus.PENDING },
          data: { status: PlanPaymentStatus.REJECTED, rejectionReason: 'PhonePe payment failed or cancelled.' },
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

    const nextStatus: OrderPaymentStatus =
      body.payload.state === 'FAILED' ? OrderPaymentStatus.FAILED : OrderPaymentStatus.PENDING;

    if (order.paymentStatus !== nextStatus) {
      await this.prisma.customerOrder.update({
        where: { id: order.id },
        data: { paymentStatus: nextStatus, phonepePaymentState: body.payload.state },
      });

      if (nextStatus === OrderPaymentStatus.FAILED) {
        await this.notificationsService.create(
          order.customerId,
          NotificationType.SYSTEM,
          'Payment failed',
          `Payment for order ${order.orderNumber} could not be completed. You can retry from My Orders.`,
          { orderId: order.id },
        );
      }
    }

    return { status: 'ok' };
  }

  private async handleSuccessFulfillment(merchantOrderId: string, phonepeOrderId: string, amountRupees: number) {
    if (merchantOrderId.startsWith('PLAN-')) {
      const requestId = merchantOrderId.replace('PLAN-', '');
      const req = await this.prisma.farmerPlanPaymentRequest.findUnique({
        where: { id: requestId },
        include: { farmer: true },
      });
      if (req && req.status !== PlanPaymentStatus.CONFIRMED) {
        await this.prisma.farmerPlanPaymentRequest.update({
          where: { id: requestId },
          data: {
            status: PlanPaymentStatus.CONFIRMED,
            utr: `PHONEPE-${phonepeOrderId || 'PAID'}`,
            submittedAt: new Date(),
            confirmedAt: new Date(),
          },
        });

        const prefix = req.targetPlan === FarmerSubscriptionPlan.PRO ? 'FB' : req.targetPlan === FarmerSubscriptionPlan.SMART ? 'FP' : 'FS';
        const code = `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;
        const isAdvisorPlan =
          req.targetPlan === FarmerSubscriptionPlan.SMART ||
          req.targetPlan === FarmerSubscriptionPlan.SUPER ||
          req.targetPlan === FarmerSubscriptionPlan.GOLD ||
          req.targetPlan === FarmerSubscriptionPlan.ROYAL;

        await this.prisma.farmerPlanCoupon.create({
          data: {
            code,
            category: isAdvisorPlan ? PlanCouponCategory.DOCTOR_CONSULTATION : PlanCouponCategory.FARMER_PLAN,
            plan: req.targetPlan,
            daysGranted: req.daysGranted,
            assignedFarmerId: req.farmerId,
            assignedAdvisorId: req.selectedAdvisorId ?? undefined,
            doctorKingId: req.doctorKingId ?? null,
            advisorKingId: req.advisorKingId ?? null,
            createdById: req.farmerId,
            createdByRole: Role.FARMER,
            isUsed: true,
            usedAt: new Date(),
            usedByFarmerId: req.farmerId,
            generationCostAmount: req.amount,
          },
        });

        await this.notificationsService.create(
          req.farmerId,
          NotificationType.SYSTEM,
          'VIP Plan Activated',
          `Payment of ₹${amountRupees || req.amount} verified via PhonePe. Your ${req.targetPlan} plan is active!`,
          { farmerPlanPaymentRequestId: requestId, couponCode: code },
        );
        this.logger.log(`PhonePe plan payment ${requestId} confirmed for farmer ${req.farmer.name}`);
      }
      return;
    }

    // Customer order
    const order = await this.prisma.customerOrder.findFirst({
      where: {
        OR: [
          { phonepeMerchantOrderId: merchantOrderId },
          { orderNumber: merchantOrderId },
        ],
      },
    });
    if (order && order.paymentStatus !== OrderPaymentStatus.PAID) {
      await this.prisma.customerOrder.update({
        where: { id: order.id },
        data: { paymentStatus: OrderPaymentStatus.PAID, phonepePaymentState: 'COMPLETED' },
      });
      await this.notificationsService.create(
        order.customerId,
        NotificationType.SYSTEM,
        'Payment received',
        `Payment for order ${order.orderNumber} was successful.`,
        { orderId: order.id },
      );
    }
  }
}
