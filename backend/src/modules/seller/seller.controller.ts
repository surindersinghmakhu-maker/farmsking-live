import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role, SellerKycStatus, SubOrderStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { SellerService } from './seller.service';
import { CreateSellerStoreDto, UpdateSellerKycDto, UpdateSellerSettingsDto } from './dto/seller-store.dto';

@Controller('seller')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  /** Register Seller Store */
  @UseGuards(JwtAuthGuard)
  @Post('store')
  registerStore(@CurrentUser() user: AuthUser, @Body() dto: CreateSellerStoreDto) {
    return this.sellerService.registerStore(user, dto);
  }

  /** Get Seller Profile/Store info */
  @UseGuards(JwtAuthGuard)
  @Get('store/me')
  getMyStore(@CurrentUser() user: AuthUser) {
    return this.sellerService.getMyStore(user);
  }

  /** Update Seller Store KYC */
  @UseGuards(JwtAuthGuard)
  @Patch('store/kyc')
  updateKyc(@CurrentUser() user: AuthUser, @Body() dto: UpdateSellerKycDto) {
    return this.sellerService.updateKyc(user, dto);
  }

  /** Get Seller Dashboard Stats */
  @UseGuards(JwtAuthGuard)
  @Get('dashboard/stats')
  getDashboardStats(@CurrentUser() user: AuthUser) {
    return this.sellerService.getDashboardStats(user);
  }

  /** Get Incoming Customer Sub-Orders for Current Seller Store */
  @UseGuards(JwtAuthGuard)
  @Get('orders')
  getMyOrders(@CurrentUser() user: AuthUser) {
    return this.sellerService.getMyOrders(user);
  }

  /** Seller: Update Own Sub-Order Status (Accept / Pack) */
  @UseGuards(JwtAuthGuard)
  @Patch('orders/:subOrderId/status')
  updateMySubOrderStatus(
    @CurrentUser() user: AuthUser,
    @Param('subOrderId') subOrderId: string,
    @Body('status') status: SubOrderStatus,
  ) {
    return this.sellerService.updateMySubOrderStatus(user, subOrderId, status);
  }

  /** Admin: List all Seller Payout transactions */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('admin/payouts')
  listAllPayoutsForAdmin(@Query('status') status?: string) {
    return this.sellerService.listAllPayoutsForAdmin(status);
  }

  /** Admin: Settle all pending payouts for a store */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('admin/stores/:storeId/settle-payouts')
  settleStorePendingPayoutsByAdmin(
    @Param('storeId') storeId: string,
    @Body('cashfreeUtrNo') cashfreeUtrNo?: string,
  ) {
    return this.sellerService.settleStorePendingPayoutsByAdmin(storeId, cashfreeUtrNo);
  }

  /** Admin: Mark Seller Payout as Settled (with optional Bank UTR) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('admin/payouts/:payoutId/settle')
  settlePayoutByAdmin(
    @Param('payoutId') payoutId: string,
    @Body('cashfreeUtrNo') cashfreeUtrNo?: string,
  ) {
    return this.sellerService.settlePayoutByAdmin(payoutId, cashfreeUtrNo);
  }

  /** Admin: List all stores */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('admin/stores')
  listStoresForAdmin(@Query('kycStatus') kycStatus?: SellerKycStatus) {
    return this.sellerService.listStoresForAdmin(kycStatus);
  }

  /** Admin: Approve or Reject KYC */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch('admin/stores/:storeId/kyc')
  verifyKycByAdmin(
    @Param('storeId') storeId: string,
    @Body('status') status: SellerKycStatus,
    @Body('commissionRate') commissionRate?: number,
    @Body('rejectionReason') rejectionReason?: string,
  ) {
    return this.sellerService.verifyKycByAdmin(storeId, status, commissionRate, rejectionReason);
  }

  /** Admin: Update Seller Governance Settings (Commission, RTO Policy, Catalog Mode, FSSAI Approval) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch('admin/stores/:storeId/settings')
  updateSellerSettings(
    @Param('storeId') storeId: string,
    @Body() dto: UpdateSellerSettingsDto,
  ) {
    return this.sellerService.updateSellerSettings(storeId, dto);
  }

  /** CA/Admin: Generate GSTR-8 Report */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('admin/gstr8')
  generateGstr8Report(
    @Query('sellerStoreId') sellerStoreId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.sellerService.generateGstr8Report(
      sellerStoreId,
      parseInt(month || '1', 10),
      parseInt(year || '2026', 10),
    );
  }
}

