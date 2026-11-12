import { BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OrderStatus, Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { DispatchOrderDto } from './dto/dispatch-order.dto';
import { MarkPaidDto, SubmitUtrDto } from './dto/mark-paid.dto';

const STAFF_ROLES = [Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER, Role.OPERATOR, Role.ACCOUNTANT];
const BUYER_ROLES = [Role.CUSTOMER, Role.FARMER, Role.GARDENER, Role.ADVISOR, Role.AGENT, Role.SELLER, Role.TRADER, Role.SUPERVISOR];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles(...BUYER_ROLES, ...STAFF_ROLES)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user, dto);
  }

  @Roles(...BUYER_ROLES, ...STAFF_ROLES)
  @Get('mine')
  findMine(@CurrentUser() user: AuthUser) {
    return this.ordersService.findMine(user);
  }

  @Roles(...STAFF_ROLES)
  @Get('fulfillment-queue')
  findFulfillmentQueue() {
    return this.ordersService.findFulfillmentQueue();
  }

  @Roles(...STAFF_ROLES)
  @Get()
  findAll(@Query('status') status?: OrderStatus) {
    return this.ordersService.findAll(status);
  }

  @Roles(...BUYER_ROLES, ...STAFF_ROLES)
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.findOneOrThrow(user, id);
  }

  @Roles(...BUYER_ROLES, ...STAFF_ROLES)
  @Get(':id/upi-link')
  getUpiLink(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.getUpiLink(user, id);
  }

  @Roles(...BUYER_ROLES, ...STAFF_ROLES)
  @Get(':id/farmer-bill-of-supply')
  generateFarmerBillOfSupply(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.generateFarmerBillOfSupply(user, id);
  }

  @Roles(...BUYER_ROLES, ...STAFF_ROLES)
  @Get(':id/invoices')
  getOrderInvoices(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.getOrderInvoices(user, id);
  }

  @Roles(...BUYER_ROLES, ...STAFF_ROLES)
  @Get('invoices/:invoiceId/html')
  getInvoiceHtml(@CurrentUser() user: AuthUser, @Param('invoiceId') invoiceId: string) {
    return this.ordersService.getInvoiceHtml(user, invoiceId);
  }

  @Roles(...BUYER_ROLES, ...STAFF_ROLES)
  @Post(':id/cashfree/initiate')
  initiateCashfreePayment(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.initiateCashfreePayment(user, id);
  }

  @Roles(...BUYER_ROLES, ...STAFF_ROLES)
  @Get(':id/cashfree/status')
  getCashfreePaymentStatus(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.getCashfreePaymentStatus(user, id);
  }

  @Roles(Role.OPERATOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/confirm')
  confirm(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.confirm(user, id);
  }

  @Roles(...BUYER_ROLES, ...STAFF_ROLES)
  @Post(':id/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.cancel(user, id);
  }

  @Roles(Role.OPERATOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/start-packing')
  startPacking(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.startPacking(user, id);
  }

  @Roles(Role.OPERATOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/mark-packed')
  markPacked(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.markPacked(user, id);
  }

  @Roles(Role.OPERATOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/dispatch')
  dispatch(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: DispatchOrderDto) {
    return this.ordersService.dispatch(user, id, dto);
  }

  @Roles(Role.OPERATOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/mark-delivered')
  markDelivered(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.markDelivered(user, id);
  }

  @Roles(Role.OPERATOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/mark-paid')
  markPaid(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: MarkPaidDto) {
    return this.ordersService.markPaymentPaid(user, id, dto.transactionId, dto.notes);
  }

  @Roles(...BUYER_ROLES, ...STAFF_ROLES)
  @Post(':id/submit-utr')
  submitUtr(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SubmitUtrDto) {
    const utr = (dto.utrNumber || dto.utr || '').trim();
    if (!utr) {
      throw new BadRequestException('UTR / Transaction Reference number is required.');
    }
    return this.ordersService.submitPaymentUtr(user, id, utr);
  }
}

@Controller('orders-public')
export class OrdersPublicController {
  constructor(private readonly ordersService: OrdersService) {}

  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @Get('track/:orderNumber')
  trackOrder(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.trackPublicOrder(orderNumber);
  }
}
