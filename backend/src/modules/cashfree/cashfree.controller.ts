import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { CashfreeService } from './cashfree.service';
import { CreateCashfreeVendorDto, CreateSplitOrderDto } from './dto/cashfree.dto';

@Controller('cashfree')
export class CashfreeController {
  constructor(private readonly cashfreeService: CashfreeService) {}

  /** Admin/Super Admin: Onboard a Verified Seller Store to Cashfree Marketplace */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('vendors')
  createVendor(@Body() dto: CreateCashfreeVendorDto) {
    return this.cashfreeService.createVendorOnCashfree(dto);
  }

  /** Create a Cashfree Split Payment Order */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('orders/split')
  createSplitOrder(@Body() dto: CreateSplitOrderDto) {
    return this.cashfreeService.createSplitOrder(dto);
  }

  /** Create a Standard/Generic Cashfree Payment Session for Plans, Cards, Wallet, Doctor Consultations & Shopping */
  @UseGuards(JwtAuthGuard)
  @Post('orders/create')
  createOrder(
    @CurrentUser() user: AuthUser,
    @Body() dto: { orderId: string; amount: number; purpose?: string; customerName?: string; customerPhone?: string },
  ) {
    return this.cashfreeService.createStandardOrder({
      orderId: dto.orderId,
      amount: dto.amount,
      customerId: user.id,
      customerPhone: dto.customerPhone || user.mobile,
      customerName: dto.customerName || user.name,
    });
  }

  /** Create a Cashfree Recurring Subscription (UPI AutoPay) */
  @UseGuards(JwtAuthGuard)
  @Post('subscriptions/create')
  createSubscription(
    @CurrentUser() user: AuthUser,
    @Body() dto: { subscriptionId: string; planName: string; amount: number; intervalType?: 'MONTH' | 'YEAR'; customerName?: string; customerPhone?: string; customerEmail?: string },
  ) {
    return this.cashfreeService.createSubscription({
      subscriptionId: dto.subscriptionId,
      planName: dto.planName,
      amount: dto.amount,
      intervalType: dto.intervalType || 'MONTH',
      customerId: user.id,
      customerPhone: dto.customerPhone || user.mobile,
      customerEmail: dto.customerEmail || (user as any).email || undefined,
      customerName: dto.customerName || user.name,
    });
  }

  /** Verify Cashfree Payment Status */
  @UseGuards(JwtAuthGuard)
  @Get('orders/:orderId/verify')
  verifyPayment(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) {
    return this.cashfreeService.verifyPayment(orderId, user);
  }

  /** Cashfree Webhook Callback Endpoint */
  @Post('webhook')
  handleWebhook(
    @Req() req: Request,
    @Body() body: any,
    @Headers('x-webhook-signature') signature?: string,
    @Headers('x-webhook-timestamp') timestamp?: string,
  ) {
    const rawBody = (req as any).rawBody
      ? Buffer.isBuffer((req as any).rawBody)
        ? (req as any).rawBody.toString('utf8')
        : String((req as any).rawBody)
      : undefined;
    return this.cashfreeService.handleWebhook(body, signature, timestamp, rawBody);
  }
}
