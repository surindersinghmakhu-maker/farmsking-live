import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { LabourService } from './labour.service';
import { CreateLabourWorkerDto, UpdateLabourWorkerDto } from './dto/create-labour-worker.dto';
import { CreateWorkEntryDto } from './dto/create-work-entry.dto';
import { CreateLabourPaymentDto } from './dto/create-labour-payment.dto';

@Controller('labour')
export class LabourController {
  constructor(private readonly labourService: LabourService) {}

  /** Labour Dashboard Endpoint - for logged-in Labourer user account */
  @Get('my-dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LABOUR, Role.FARMER, Role.ADMIN, Role.SUPER_ADMIN)
  getLabourDashboard(@CurrentUser() user: AuthUser) {
    return this.labourService.getLabourDashboard(user.id);
  }

  /** Search worker/user by 10-digit mobile number (Optional JWT so unauthenticated registration flow can also lookup King ID) */
  @Get('search-mobile')
  @UseGuards(OptionalJwtAuthGuard)
  searchByMobile(@Query('mobile') mobile: string) {
    return this.labourService.searchByMobile(mobile);
  }

  /** Worker Management Endpoints (Available to all authenticated users) */
  @Post('workers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LABOUR, Role.FARMER, Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER, Role.GARDENER, Role.ADVISOR, Role.BUSINESS_PARTNER, Role.OPERATOR)
  createWorker(@CurrentUser() user: AuthUser, @Body() dto: CreateLabourWorkerDto) {
    return this.labourService.createWorker(user, dto);
  }

  @Get('workers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LABOUR, Role.FARMER, Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER, Role.GARDENER, Role.ADVISOR, Role.BUSINESS_PARTNER, Role.OPERATOR)
  getWorkers(@CurrentUser() user: AuthUser) {
    return this.labourService.getWorkersForFarmer(user);
  }

  @Put('workers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LABOUR, Role.FARMER, Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER, Role.GARDENER, Role.ADVISOR, Role.BUSINESS_PARTNER, Role.OPERATOR)
  updateWorker(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateLabourWorkerDto) {
    return this.labourService.updateWorker(user, id, dto);
  }

  @Delete('workers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LABOUR, Role.FARMER, Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER, Role.GARDENER, Role.ADVISOR, Role.BUSINESS_PARTNER, Role.OPERATOR)
  deleteWorker(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.labourService.deleteWorker(user, id);
  }

  @Post('work-entries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FARMER, Role.ADMIN, Role.SUPER_ADMIN)
  createWorkEntry(@CurrentUser() user: AuthUser, @Body() dto: CreateWorkEntryDto) {
    return this.labourService.createWorkEntry(user.id, user.id, dto);
  }

  @Get('work-entries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FARMER, Role.ADMIN, Role.SUPER_ADMIN)
  getWorkEntries(@CurrentUser() user: AuthUser, @Query('workerId') workerId?: string) {
    return this.labourService.getWorkEntries(user.id, workerId);
  }

  @Post('payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FARMER, Role.ADMIN, Role.SUPER_ADMIN)
  createPayment(@CurrentUser() user: AuthUser, @Body() dto: CreateLabourPaymentDto) {
    return this.labourService.createPayment(user.id, user.id, dto);
  }

  @Get('payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FARMER, Role.ADMIN, Role.SUPER_ADMIN)
  getPayments(@CurrentUser() user: AuthUser, @Query('workerId') workerId?: string) {
    return this.labourService.getPayments(user.id, workerId);
  }

  @Get('statement/:workerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FARMER, Role.ADMIN, Role.SUPER_ADMIN)
  getWorkerStatement(@CurrentUser() user: AuthUser, @Param('workerId') workerId: string) {
    return this.labourService.getWorkerStatement(user.id, workerId);
  }
}
