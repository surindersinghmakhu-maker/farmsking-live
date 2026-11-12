import { Body, Controller, Headers, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { RazorpayService } from './razorpay.service';
import { CreateRazorpayOrderDto, CreateRazorpaySubscriptionDto, VerifyRazorpayPaymentDto } from './dto/razorpay.dto';

@Controller('razorpay')
export class RazorpayController {
  constructor(private readonly razorpayService: RazorpayService) {}

  /**
   * Create standard one-time Razorpay Order
   */
  @UseGuards(JwtAuthGuard)
  @Post('orders/create')
  createOrder(@CurrentUser() user: AuthUser, @Body() dto: CreateRazorpayOrderDto) {
    return this.razorpayService.createStandardOrder({
      ...dto,
      customerId: dto.customerId || user.id,
      customerPhone: dto.customerPhone || user.mobile,
      customerName: dto.customerName || user.name,
    });
  }

  /**
   * Create Recurring Subscription (Google Pay / PhonePe UPI AutoPay)
   */
  @UseGuards(JwtAuthGuard)
  @Post('subscriptions/create')
  createSubscription(@CurrentUser() user: AuthUser, @Body() dto: CreateRazorpaySubscriptionDto) {
    return this.razorpayService.createSubscription({
      ...dto,
      customerId: dto.customerId || user.id,
      customerPhone: dto.customerPhone || user.mobile,
      customerEmail: dto.customerEmail || (user as any).email || undefined,
      customerName: dto.customerName || user.name,
    });
  }

  /**
   * Verify Client Payment Signature
   */
  @UseGuards(JwtAuthGuard)
  @Post('verify')
  verifyPayment(@Body() dto: VerifyRazorpayPaymentDto) {
    return this.razorpayService.verifyPayment(dto);
  }

  /**
   * Razorpay Webhook Handler
   */
  @Post('webhook')
  handleWebhook(
    @Req() req: Request,
    @Body() body: any,
    @Headers('x-razorpay-signature') signature?: string,
  ) {
    const rawBody = (req as any).rawBody
      ? Buffer.isBuffer((req as any).rawBody)
        ? (req as any).rawBody.toString('utf8')
        : String((req as any).rawBody)
      : JSON.stringify(body);
    return this.razorpayService.handleWebhook(rawBody, signature);
  }
}

