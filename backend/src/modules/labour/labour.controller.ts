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

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('labour')
export class LabourController {
  constructor(private readonly labourService: LabourService) {}

  /** Labour Dashboard Endpoint - for logged-in Labourer user account */
  @Get('my-dashboard')
  @Roles(Role.LABOUR, Role.FARMER, Role.ADMIN, Role.SUPER_ADMIN)
  getLabourDashboard(@CurrentUser() user: AuthUser) {
    return this.labourService.getLabourDashboard(user.id);
  }

  /** Farmer Endpoints */
  @Post('workers')
  @Roles(Role.FARMER, Role.ADMIN, Role.SUPER_ADMIN)
  createWorker(@CurrentUser() user: AuthUser, @Body() dto: CreateLabourWorkerDto) {
    return this.labourService.createWorker(user.id, dto);
  }

  @Get('workers')
  @Roles(Role.FARMER, Role.ADMIN, Role.SUPER_ADMIN)
  getWorkers(@CurrentUser() user: AuthUser) {
    return this.labourService.getWorkersForFarmer(user.id);
  }

  @Put('workers/:id')
  @Roles(Role.FARMER, Role.ADMIN, Role.SUPER_ADMIN)
  updateWorker(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateLabourWorkerDto) {
    return this.labourService.updateWorker(user.id, id, dto);
  }

  @Delete('workers/:id')
  @Roles(Role.FARMER, Role.ADMIN, Role.SUPER_ADMIN)
  deleteWorker(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.labourService.deleteWorker(user.id, id);
  }

  @Post('work-entries')
  @Roles(Role.FARMER, Role.ADMIN, Role.SUPER_ADMIN)
  createWorkEntry(@CurrentUser() user: AuthUser, @Body() dto: CreateWorkEntryDto) {
    return this.labourService.createWorkEntry(user.id, user.id, dto);
  }

  @Get('work-entries')
  @Roles(Role.FARMER, Role.ADMIN, Role.SUPER_ADMIN)
  getWorkEntries(@CurrentUser() user: AuthUser, @Query('workerId') workerId?: string) {
    return this.labourService.getWorkEntries(user.id, workerId);
  }

  @Post('payments')
  @Roles(Role.FARMER, Role.ADMIN, Role.SUPER_ADMIN)
  createPayment(@CurrentUser() user: AuthUser, @Body() dto: CreateLabourPaymentDto) {
    return this.labourService.createPayment(user.id, user.id, dto);
  }

  @Get('payments')
  @Roles(Role.FARMER, Role.ADMIN, Role.SUPER_ADMIN)
  getPayments(@CurrentUser() user: AuthUser, @Query('workerId') workerId?: string) {
    return this.labourService.getPayments(user.id, workerId);
  }

  @Get('statement/:workerId')
  @Roles(Role.FARMER, Role.ADMIN, Role.SUPER_ADMIN)
  getWorkerStatement(@CurrentUser() user: AuthUser, @Param('workerId') workerId: string) {
    return this.labourService.getWorkerStatement(user.id, workerId);
  }
}
