import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { DispatchOrderDto } from './dto/dispatch-order.dto';
import { InitiatePhonePePaymentDto } from './dto/initiate-phonepe-payment.dto';

const STAFF_ROLES = [Role.ADMIN, Role.SUPER_ADMIN, Role.OPERATOR];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles(Role.CUSTOMER, Role.FARMER, Role.GARDENER, Role.ADVISOR)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user, dto);
  }

  @Roles(Role.CUSTOMER, Role.FARMER, Role.GARDENER, Role.ADVISOR)
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

  @Roles(Role.CUSTOMER, Role.FARMER, Role.GARDENER, Role.ADVISOR, ...STAFF_ROLES)
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.findOneOrThrow(user, id);
  }

  @Roles(Role.CUSTOMER, Role.FARMER, Role.GARDENER, Role.ADVISOR, ...STAFF_ROLES)
  @Get(':id/upi-link')
  getUpiLink(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.getUpiLink(user, id);
  }

  @Roles(Role.CUSTOMER, Role.FARMER, Role.GARDENER, Role.ADVISOR)
  @Post(':id/phonepe/initiate')
  initiatePhonePePayment(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: InitiatePhonePePaymentDto) {
    return this.ordersService.initiatePhonePePayment(user, id, dto.redirectUrl);
  }

  @Roles(Role.CUSTOMER, Role.FARMER, Role.GARDENER, Role.ADVISOR, ...STAFF_ROLES)
  @Get(':id/phonepe/status')
  getPhonePePaymentStatus(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.getPhonePePaymentStatus(user, id);
  }

  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/confirm')
  confirm(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.confirm(user, id);
  }

  @Roles(Role.CUSTOMER, Role.FARMER, Role.GARDENER, Role.ADVISOR, Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.cancel(user, id);
  }

  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/start-packing')
  startPacking(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.startPacking(user, id);
  }

  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/mark-packed')
  markPacked(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.markPacked(user, id);
  }

  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/dispatch')
  dispatch(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: DispatchOrderDto) {
    return this.ordersService.dispatch(user, id, dto);
  }

  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/mark-delivered')
  markDelivered(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.markDelivered(user, id);
  }
}
