import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { FarmerPlanPaymentsService } from './farmer-plan-payments.service';
import { InitiateFarmerPlanPaymentDto } from './dto/initiate-farmer-plan-payment.dto';
import { SubmitFarmerPlanPaymentDto } from './dto/submit-farmer-plan-payment.dto';
import { RejectFarmerPlanPaymentDto } from './dto/reject-farmer-plan-payment.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('farmer-plan-payments')
export class FarmerPlanPaymentsController {
  constructor(private readonly farmerPlanPaymentsService: FarmerPlanPaymentsService) {}

  @Roles(Role.FARMER, Role.ADVISOR)
  @Post()
  initiate(@CurrentUser() user: AuthUser, @Body() dto: InitiateFarmerPlanPaymentDto, @Query('farmerId') farmerId?: string) {
    return this.farmerPlanPaymentsService.initiate(user, dto, farmerId);
  }

  @Roles(Role.FARMER, Role.ADVISOR)
  @Get('mine')
  listMine(@CurrentUser() user: AuthUser) {
    return this.farmerPlanPaymentsService.listMine(user);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('pending')
  listPending() {
    return this.farmerPlanPaymentsService.listPending();
  }

  @Roles(Role.FARMER, Role.ADVISOR)
  @Post(':id/submit')
  submit(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SubmitFarmerPlanPaymentDto) {
    return this.farmerPlanPaymentsService.submit(user, id, dto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/confirm')
  confirm(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.farmerPlanPaymentsService.confirm(user, id);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/reject')
  reject(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: RejectFarmerPlanPaymentDto) {
    return this.farmerPlanPaymentsService.reject(user, id, dto);
  }
}
