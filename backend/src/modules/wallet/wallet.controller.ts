import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
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

  @Roles(Role.BUSINESS_PARTNER, Role.ADVISOR)
  @Get('mine')
  getMyWallet(@CurrentUser() user: AuthUser) {
    return this.walletService.getMyWallet(user);
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
