import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { CashfreeService } from './cashfree.service';
import { CreateCashfreeVendorDto, CreateSplitOrderDto } from './dto/cashfree.dto';

@Controller('cashfree')
export class CashfreeController {
  constructor(private readonly cashfreeService: CashfreeService) {}

  /** Onboard a Seller Store to Cashfree Marketplace */
  @UseGuards(JwtAuthGuard)
  @Post('vendors')
  createVendor(@Body() dto: CreateCashfreeVendorDto) {
    return this.cashfreeService.createVendorOnCashfree(dto);
  }

  /** Create a Cashfree Split Payment Order */
  @UseGuards(JwtAuthGuard)
  @Post('orders/split')
  createSplitOrder(@Body() dto: CreateSplitOrderDto) {
    return this.cashfreeService.createSplitOrder(dto);
  }

  /** Verify Cashfree Payment Status */
  @Get('orders/:orderId/verify')
  verifyPayment(@Param('orderId') orderId: string) {
    return this.cashfreeService.verifyPayment(orderId);
  }

  /** Cashfree Webhook Callback Endpoint */
  @Post('webhook')
  handleWebhook(@Body() body: any) {
    return this.cashfreeService.handleWebhook(body);
  }
}
