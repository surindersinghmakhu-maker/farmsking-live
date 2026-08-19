import { Body, Controller, Headers, HttpCode, Logger, Post } from '@nestjs/common';
import { NotificationType, OrderPaymentStatus } from '@prisma/client';
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

/** Public S2S webhook — PhonePe calls this directly, so it carries no JWT and must stay outside the auth guard. */
@Controller('payments/phonepe')
export class PhonePeWebhookController {
  private readonly logger = new Logger(PhonePeWebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly phonePeService: PhonePeService,
    private readonly notificationsService: NotificationsService,
  ) {}

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

    const order = await this.prisma.customerOrder.findUnique({ where: { phonepeMerchantOrderId: merchantOrderId } });
    if (!order) {
      this.logger.warn(`PhonePe webhook for unknown merchantOrderId: ${merchantOrderId}`);
      return { status: 'ignored' };
    }

    const nextStatus: OrderPaymentStatus =
      body.payload.state === 'COMPLETED' ? 'PAID' : body.payload.state === 'FAILED' ? 'FAILED' : 'PENDING';

    if (order.paymentStatus !== nextStatus) {
      await this.prisma.customerOrder.update({
        where: { id: order.id },
        data: { paymentStatus: nextStatus, phonepePaymentState: body.payload.state },
      });

      if (nextStatus === 'PAID') {
        await this.notificationsService.create(
          order.customerId,
          NotificationType.SYSTEM,
          'Payment received',
          `Payment for order ${order.orderNumber} was successful.`,
          { orderId: order.id },
        );
      } else if (nextStatus === 'FAILED') {
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
}
