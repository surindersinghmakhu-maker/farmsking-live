import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { BasicPlanCouponsService } from './basic-plan-coupons.service';
import { CreateBasicPlanCouponDto } from './dto/create-basic-plan-coupon.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('basic-plan-coupons')
export class BasicPlanCouponsController {
  constructor(private readonly basicPlanCouponsService: BasicPlanCouponsService) {}

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBasicPlanCouponDto) {
    return this.basicPlanCouponsService.create(user, dto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get()
  listAll() {
    return this.basicPlanCouponsService.listAll();
  }

  @Roles(Role.BUSINESS_PARTNER)
  @Get('available')
  listAvailable() {
    return this.basicPlanCouponsService.listAvailableForPurchase();
  }

  @Roles(Role.BUSINESS_PARTNER)
  @Get('mine')
  listMine(@CurrentUser() user: AuthUser) {
    return this.basicPlanCouponsService.listMinePurchased(user);
  }

  @Roles(Role.BUSINESS_PARTNER)
  @Post(':code/purchase')
  purchase(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.basicPlanCouponsService.purchase(user, code);
  }

  @Roles(Role.FARMER)
  @Post(':code/redeem')
  redeem(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.basicPlanCouponsService.redeem(user, code);
  }
}
