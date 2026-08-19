import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { PlanRenewalService } from './plan-renewal.service';
import { CreatePlanRenewalCouponDto } from './dto/create-plan-renewal-coupon.dto';
import { RedeemPlanRenewalCouponDto } from './dto/redeem-plan-renewal-coupon.dto';
import { GrantPlanDaysDto } from './dto/grant-plan-days.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('plan-renewal-coupons')
export class PlanRenewalController {
  constructor(private readonly planRenewalService: PlanRenewalService) {}

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePlanRenewalCouponDto) {
    return this.planRenewalService.create(user, dto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get()
  listAll() {
    return this.planRenewalService.listAll();
  }

  @Roles(Role.ADVISOR)
  @Get('mine')
  listMine(@CurrentUser() user: AuthUser) {
    return this.planRenewalService.listMineForAdvisor(user);
  }

  @Roles(Role.FARMER, Role.ADVISOR)
  @Get('upi-link')
  getUpiLink(@CurrentUser() user: AuthUser, @Query('farmerId') farmerId?: string) {
    return this.planRenewalService.getUpiLinkForFarmer(user, farmerId);
  }

  @Roles(Role.FARMER, Role.ADVISOR)
  @Get(':code/preview')
  preview(@CurrentUser() user: AuthUser, @Param('code') code: string, @Query('farmerId') farmerId?: string) {
    return this.planRenewalService.previewRedeem(user, code, farmerId);
  }

  @Roles(Role.FARMER, Role.ADVISOR)
  @Post(':code/redeem')
  redeem(@CurrentUser() user: AuthUser, @Param('code') code: string, @Body() dto: RedeemPlanRenewalCouponDto) {
    return this.planRenewalService.redeem(user, code, dto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('grant-days')
  grantDays(@Body() dto: GrantPlanDaysDto) {
    return this.planRenewalService.grantDaysDirectly(dto.farmerId, dto.daysGranted);
  }
}
