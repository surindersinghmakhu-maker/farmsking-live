import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { LabourService } from './labour.service';
import { CreateLabourWorkerDto, UpdateLabourWorkerDto } from './dto/create-labour-worker.dto';
import { CreateWorkEntryDto } from './dto/create-work-entry.dto';
import { CreateLabourPaymentDto } from './dto/create-labour-payment.dto';
import { getEffectiveFarmerId } from '../../common/utils/effective-farmer.util';

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

  /** Search worker/user by 10-digit mobile number (Authenticated users only; returns masked public summary) */
  @Get('search-mobile')
  @UseGuards(JwtAuthGuard)
  searchByMobile(@Query('mobile') mobile: string) {
    return this.labourService.searchByMobile(mobile);
  }

  /** Worker Management Endpoints */
  @Post('workers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LABOUR, Role.FARMER, Role.GARDENER, Role.SUPERVISOR, Role.ADMIN, Role.SUPER_ADMIN)
  createWorker(@CurrentUser() user: AuthUser, @Body() dto: CreateLabourWorkerDto) {
    return this.labourService.createWorker(user, dto);
  }

  @Get('workers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LABOUR, Role.FARMER, Role.GARDENER, Role.SUPERVISOR, Role.ADMIN, Role.SUPER_ADMIN)
  getWorkers(@CurrentUser() user: AuthUser) {
    return this.labourService.getWorkersForFarmer(user);
  }

  @Put('workers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LABOUR, Role.FARMER, Role.GARDENER, Role.SUPERVISOR, Role.ADMIN, Role.SUPER_ADMIN)
  updateWorker(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateLabourWorkerDto) {
    return this.labourService.updateWorker(user, id, dto);
  }

  @Delete('workers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FARMER, Role.GARDENER, Role.SUPERVISOR, Role.ADMIN, Role.SUPER_ADMIN)
  deleteWorker(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.labourService.deleteWorker(user, id);
  }

  @Post('work-entries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FARMER, Role.SUPERVISOR, Role.ADMIN, Role.SUPER_ADMIN)
  async createWorkEntry(@CurrentUser() user: AuthUser, @Body() dto: CreateWorkEntryDto) {
    await this.labourService.assertSupervisorLabourAccess(user, 'entry');
    const farmerId = getEffectiveFarmerId(user);
    return this.labourService.createWorkEntry(farmerId, user.id, dto);
  }

  @Get('work-entries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FARMER, Role.SUPERVISOR, Role.ADMIN, Role.SUPER_ADMIN)
  async getWorkEntries(@CurrentUser() user: AuthUser, @Query('workerId') workerId?: string) {
    await this.labourService.assertSupervisorLabourAccess(user, 'view');
    const farmerId = getEffectiveFarmerId(user);
    return this.labourService.getWorkEntries(farmerId, workerId);
  }

  @Post('payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FARMER, Role.SUPERVISOR, Role.ADMIN, Role.SUPER_ADMIN)
  async createPayment(@CurrentUser() user: AuthUser, @Body() dto: CreateLabourPaymentDto) {
    await this.labourService.assertSupervisorLabourAccess(user, 'entry');
    const farmerId = getEffectiveFarmerId(user);
    return this.labourService.createPayment(farmerId, user.id, dto);
  }

  @Get('payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FARMER, Role.SUPERVISOR, Role.ADMIN, Role.SUPER_ADMIN)
  async getPayments(@CurrentUser() user: AuthUser, @Query('workerId') workerId?: string) {
    await this.labourService.assertSupervisorLabourAccess(user, 'view');
    const farmerId = getEffectiveFarmerId(user);
    return this.labourService.getPayments(farmerId, workerId);
  }

  @Get('statement/:workerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FARMER, Role.SUPERVISOR, Role.ADMIN, Role.SUPER_ADMIN)
  async getWorkerStatement(@CurrentUser() user: AuthUser, @Param('workerId') workerId: string) {
    await this.labourService.assertSupervisorLabourAccess(user, 'view');
    const farmerId = getEffectiveFarmerId(user);
    return this.labourService.getWorkerStatement(farmerId, workerId);
  }
}
