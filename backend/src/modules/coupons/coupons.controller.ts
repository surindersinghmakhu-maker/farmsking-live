import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { OperatorPermission, Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { OperatorPermissionGuard } from '../../common/guards/operator-permission.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireOperatorPermission } from '../../common/decorators/operator-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { RedeemCouponDto } from './dto/redeem-coupon.dto';
import { IssuePartnerCouponDto } from './dto/issue-partner-coupon.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCouponDto) {
    return this.couponsService.create(user, dto);
  }

  /** Issues a fresh Business-Partner-tier referral coupon (uses current AppSetting defaults) to one selected partner, or every active partner if none is given. */
  @Roles(Role.SUPER_ADMIN)
  @Post('issue-partner-coupon')
  issuePartnerCoupon(@CurrentUser() user: AuthUser, @Body() dto: IssuePartnerCouponDto) {
    return this.couponsService.issuePartnerCoupon(user, dto);
  }

  @UseGuards(OperatorPermissionGuard)
  @RequireOperatorPermission(OperatorPermission.VIEW_COUPONS)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.OPERATOR)
  @Get()
  listAll() {
    return this.couponsService.listAll();
  }

  @Roles(Role.BUSINESS_PARTNER, Role.ADVISOR)
  @Get('mine')
  listMine(@CurrentUser() user: AuthUser) {
    return this.couponsService.listMine(user);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.update(id, dto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id/remove')
  remove(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.BUSINESS_PARTNER, Role.ADVISOR)
  @Get(':id/redemptions')
  getRedemptions(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.couponsService.getRedemptions(user, id);
  }

  @Roles(Role.CUSTOMER, Role.FARMER, Role.GARDENER, Role.ADVISOR)
  @Post(':code/redeem')
  redeem(@CurrentUser() user: AuthUser, @Param('code') code: string, @Body() dto: RedeemCouponDto) {
    return this.couponsService.redeem(user, code, dto);
  }

  @Roles(Role.CUSTOMER, Role.FARMER, Role.GARDENER, Role.ADVISOR)
  @Get(':code/preview')
  preview(@Param('code') code: string, @Query('amount') amount: string) {
    const orderAmount = Number(amount);
    if (!amount || Number.isNaN(orderAmount) || orderAmount <= 0) {
      throw new BadRequestException('A valid order amount is required.');
    }
    return this.couponsService.previewForOrder(code, orderAmount);
  }
}
