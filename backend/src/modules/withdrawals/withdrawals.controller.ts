import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { ApproveWithdrawalDto } from './dto/approve-withdrawal.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('withdrawals')
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Roles(Role.BUSINESS_PARTNER, Role.ADVISOR)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWithdrawalDto) {
    return this.withdrawalsService.create(user, dto);
  }

  @Roles(Role.BUSINESS_PARTNER, Role.ADVISOR)
  @Get('mine')
  listMine(@CurrentUser() user: AuthUser) {
    return this.withdrawalsService.listMine(user);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get()
  listAll() {
    return this.withdrawalsService.listAll();
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id/approve')
  approve(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ApproveWithdrawalDto) {
    return this.withdrawalsService.approve(user, id, dto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id/reject')
  reject(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body('notes') notes?: string) {
    return this.withdrawalsService.reject(user, id, notes);
  }
}
