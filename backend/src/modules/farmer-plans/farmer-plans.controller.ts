import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { FarmerSubscriptionPlan, OperatorPermission, Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { OperatorPermissionGuard } from '../../common/guards/operator-permission.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireOperatorPermission } from '../../common/decorators/operator-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { FarmerPlansService } from './farmer-plans.service';
import { CreateFarmerPlanCouponDto } from './dto/create-farmer-plan-coupon.dto';
import { GenerateAdvisorCouponDto } from './dto/generate-advisor-coupon.dto';
import { RedeemFarmerPlanCouponDto } from './dto/redeem-farmer-plan-coupon.dto';
import { GrantFarmerPlanDaysDto } from './dto/grant-farmer-plan-days.dto';
import { UpdateFarmerPlanPricingDto } from './dto/update-farmer-plan-pricing.dto';
import { ChooseAdvisorDto } from './dto/choose-advisor.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('farmer-plans')
export class FarmerPlansController {
  constructor(private readonly farmerPlansService: FarmerPlansService) {}

  /** Farmer: view their current active plan details */
  @Roles(Role.FARMER)
  @Get('my-plan')
  getMyPlan(@CurrentUser() user: AuthUser) {
    return this.farmerPlansService.getMyPlan(user);
  }

  /** Farmer, or an advisor/admin/business partner previewing on behalf of a farmer (?farmerId=) — shows what a code would grant, without consuming it */
  @Roles(Role.FARMER, Role.ADVISOR, Role.ADMIN, Role.SUPER_ADMIN, Role.BUSINESS_PARTNER)
  @Get('coupon/:code/preview')
  previewCoupon(@CurrentUser() user: AuthUser, @Param('code') code: string, @Query('farmerId') farmerId?: string) {
    return this.farmerPlansService.previewCoupon(user, code, farmerId);
  }

  /** Farmer, or an advisor/admin/business partner redeeming on behalf of a farmer — activates BASIC/STANDARD/PREMIUM (new plan, extend, or renew) */
  @Roles(Role.FARMER, Role.ADVISOR, Role.ADMIN, Role.SUPER_ADMIN, Role.BUSINESS_PARTNER)
  @Post('redeem')
  redeemCoupon(@CurrentUser() user: AuthUser, @Body() dto: RedeemFarmerPlanCouponDto) {
    return this.farmerPlansService.redeemCoupon(user, dto);
  }

  /** Farmer on STANDARD/PREMIUM: pick a specific Farm Advisor instead of the auto-assigned one. */
  @Roles(Role.FARMER)
  @Post('choose-advisor')
  chooseAdvisor(@CurrentUser() user: AuthUser, @Body() dto: ChooseAdvisorDto) {
    return this.farmerPlansService.chooseAdvisor(user, dto.advisorId);
  }

  /** Admin/Super Admin: create a BASIC or PREMIUM plan coupon — open, locked to a farmer, or issued to an advisor */
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('coupons')
  createCoupon(@CurrentUser() user: AuthUser, @Body() dto: CreateFarmerPlanCouponDto) {
    return this.farmerPlansService.createCoupon(user, dto);
  }

  /** Advisor: self-service — generate their own plan coupon, debiting the Super-Admin-configured generation cost from their wallet. */
  @Roles(Role.ADVISOR)
  @Post('coupons/generate')
  generateOwnCoupon(@CurrentUser() user: AuthUser, @Body() dto: GenerateAdvisorCouponDto) {
    return this.farmerPlansService.generateOwnCoupon(user, dto);
  }

  /** Super Admin: deactivate an unused coupon so it can no longer be redeemed — never deleted, stays in history. */
  @Roles(Role.SUPER_ADMIN)
  @Patch('coupons/:id/deactivate')
  deactivateCoupon(@Param('id') id: string) {
    return this.farmerPlansService.deactivateCoupon(id);
  }

  /** Advisor: list coupons issued to them, to apply to any of their assigned farmers */
  @Roles(Role.ADVISOR)
  @Get('coupons/mine')
  listMineForAdvisor(@CurrentUser() user: AuthUser) {
    return this.farmerPlansService.listMineForAdvisor(user);
  }

  /** Business Partner: list coupons issued to them, to hand out to farmers — earns a commission on redemption */
  @Roles(Role.BUSINESS_PARTNER)
  @Get('coupons/mine-partner')
  listMineForBusinessPartner(@CurrentUser() user: AuthUser) {
    return this.farmerPlansService.listMineForBusinessPartner(user);
  }

  /** Any authenticated role: view the current plan prices/commission splits, e.g. for the plan comparison chart */
  @Roles(
    Role.CUSTOMER,
    Role.FARMER,
    Role.GARDENER,
    Role.ADVISOR,
    Role.BUSINESS_PARTNER,
    Role.ADMIN,
    Role.SUPER_ADMIN,
    Role.OPERATOR,
  )
  @Get('pricing')
  getPricing() {
    return this.farmerPlansService.getPricing();
  }

  /** Super Admin only: edit a plan's price/commission split */
  @Roles(Role.SUPER_ADMIN)
  @Patch('pricing/:plan')
  updatePricing(@CurrentUser() user: AuthUser, @Param('plan') plan: FarmerSubscriptionPlan, @Body() dto: UpdateFarmerPlanPricingDto) {
    return this.farmerPlansService.updatePricing(user, plan, dto);
  }

  /** Admin/Super Admin (or Operator with VIEW_FARMER_PLANS): list all plan coupons */
  @UseGuards(OperatorPermissionGuard)
  @RequireOperatorPermission(OperatorPermission.VIEW_FARMER_PLANS)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.OPERATOR)
  @Get('coupons')
  listAllCoupons() {
    return this.farmerPlansService.listAllCoupons();
  }

  /** Admin/Super Admin (or Operator with VIEW_FARMER_PLANS): list all farmer plan records */
  @UseGuards(OperatorPermissionGuard)
  @RequireOperatorPermission(OperatorPermission.VIEW_FARMER_PLANS)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.OPERATOR)
  @Get('all')
  listAllFarmerPlans() {
    return this.farmerPlansService.listAllFarmerPlans();
  }

  /** Admin/Super Admin: extend a farmer's current plan by N days, no coupon involved */
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('grant-days')
  grantDaysDirectly(@Body() dto: GrantFarmerPlanDaysDto) {
    return this.farmerPlansService.grantDaysDirectly(dto.farmerId, dto.daysGranted);
  }
}
