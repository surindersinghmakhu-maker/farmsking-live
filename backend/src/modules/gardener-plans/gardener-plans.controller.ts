import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { GardenerPlansService } from './gardener-plans.service';
import { CreateGardenerPlanCouponDto } from './dto/create-gardener-plan-coupon.dto';
import { RedeemGardenerPlanCouponDto } from './dto/redeem-gardener-plan-coupon.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gardener-plans')
export class GardenerPlansController {
  constructor(private readonly gardenerPlansService: GardenerPlansService) {}

  @Roles(Role.GARDENER)
  @Get('my-plan')
  getMyPlan(@CurrentUser() user: AuthUser) {
    return this.gardenerPlansService.getMyPlan(user);
  }

  @Roles(Role.GARDENER)
  @Get('coupon/:code/preview')
  previewCoupon(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.gardenerPlansService.previewCoupon(user, code);
  }

  @Roles(Role.GARDENER)
  @Post('redeem')
  redeemCoupon(@CurrentUser() user: AuthUser, @Body() dto: RedeemGardenerPlanCouponDto) {
    return this.gardenerPlansService.redeemCoupon(user, dto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('coupons')
  createCoupon(@CurrentUser() user: AuthUser, @Body() dto: CreateGardenerPlanCouponDto) {
    return this.gardenerPlansService.createCoupon(user, dto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('coupons')
  listAllCoupons() {
    return this.gardenerPlansService.listAllCoupons();
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('all')
  listAllGardenerPlans() {
    return this.gardenerPlansService.listAllGardenerPlans();
  }
}
