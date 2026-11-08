import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
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
  @Post('verify')
  verifyPayment(@Body() dto: VerifyRazorpayPaymentDto) {
    return this.razorpayService.verifyPayment(dto);
  }

  /**
   * Razorpay Webhook Handler
   */
  @Post('webhook')
  handleWebhook(@Body() body: any, @Headers('x-razorpay-signature') signature?: string) {
    return this.razorpayService.handleWebhook(body, signature);
  }
}

