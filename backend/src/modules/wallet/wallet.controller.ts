import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { OperatorPermission, Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { OperatorPermissionGuard } from '../../common/guards/operator-permission.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireOperatorPermission } from '../../common/decorators/operator-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { WalletService } from './wallet.service';
import { CreditWalletDto } from './dto/credit-wallet.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('mine')
  getMyWallet(@CurrentUser() user: AuthUser) {
    return this.walletService.getMyWallet(user);
  }

  @Post('claim-welcome-bonus')
  async claimWelcomeBonus(@CurrentUser() user: AuthUser) {
    await this.walletService.ensureWelcomeBonus(user.id);
    return this.walletService.getMyWallet(user);
  }

  @Get('referral-statement')
  getReferralStatement(@CurrentUser() user: AuthUser) {
    return this.walletService.getReferralStatement(user.id);
  }

  /** Admin/Super Admin: Comprehensive list of all users and their wallet balances. */
  @UseGuards(OperatorPermissionGuard)
  @RequireOperatorPermission(OperatorPermission.VIEW_WALLETS)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.OPERATOR)
  @Get('admin/all-users')
  getAdminAllWallets(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.getAdminAllWallets(
      search,
      role,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }

  /** Admin/Super Admin: Detailed calculation breakdown of all issued bonuses & transactions. */
  @UseGuards(OperatorPermissionGuard)
  @RequireOperatorPermission(OperatorPermission.VIEW_WALLETS)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.OPERATOR)
  @Get('admin/bonus-report')
  getAdminBonusReport() {
    return this.walletService.getAdminBonusReport();
  }

  /** Admin/Super Admin (or Operator with VIEW_WALLETS): full transaction ledger for any partner/advisor's wallet. */
  @UseGuards(OperatorPermissionGuard)
  @RequireOperatorPermission(OperatorPermission.VIEW_WALLETS)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.OPERATOR)
  @Get('admin/:userId')
  getWalletForUser(@Param('userId') userId: string) {
    return this.walletService.getWalletForUser(userId);
  }

  /** Admin/Super Admin only: manually add balance to any user's wallet (e.g. a cash top-up, goodwill credit, correction). */
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('admin/:userId/credit')
  creditWallet(@CurrentUser() admin: AuthUser, @Param('userId') userId: string, @Body() dto: CreditWalletDto) {
    return this.walletService.adminCreditWallet(admin, userId, dto.amount, dto.reason);
  }

  /** Admin/Super Admin only: manually deduct balance from any user's wallet (e.g. correcting an over-credit). */
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('admin/:userId/debit')
  debitWallet(@CurrentUser() admin: AuthUser, @Param('userId') userId: string, @Body() dto: CreditWalletDto) {
    return this.walletService.adminDebitWallet(admin, userId, dto.amount, dto.reason);
  }
}
