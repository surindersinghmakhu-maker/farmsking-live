import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { PlanPaymentsService } from './plan-payments.service';
import { SubmitPlanPaymentDto } from './dto/submit-plan-payment.dto';
import { RejectPlanPaymentDto } from './dto/reject-plan-payment.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('plan-payments')
export class PlanPaymentsController {
  constructor(private readonly planPaymentsService: PlanPaymentsService) {}

  @Roles(Role.FARMER, Role.ADVISOR)
  @Post()
  initiate(@CurrentUser() user: AuthUser, @Query('farmerId') farmerId?: string) {
    return this.planPaymentsService.initiate(user, farmerId);
  }

  @Roles(Role.FARMER, Role.ADVISOR)
  @Get('mine')
  listMine(@CurrentUser() user: AuthUser) {
    return this.planPaymentsService.listMine(user);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('pending')
  listPending() {
    return this.planPaymentsService.listPending();
  }

  @Roles(Role.FARMER, Role.ADVISOR)
  @Post(':id/submit')
  submit(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SubmitPlanPaymentDto) {
    return this.planPaymentsService.submit(user, id, dto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/confirm')
  confirm(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.planPaymentsService.confirm(user, id);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/reject')
  reject(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: RejectPlanPaymentDto) {
    return this.planPaymentsService.reject(user, id, dto);
  }
}
