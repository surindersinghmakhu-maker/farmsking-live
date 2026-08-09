import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { CropActivitySchedulesService } from './crop-activity-schedules.service';
import { CreateActivityScheduleDto } from './dto/create-activity-schedule.dto';
import { UpdateActivityScheduleDto } from './dto/update-activity-schedule.dto';
import { BulkCreateActivityScheduleDto } from './dto/bulk-create-activity-schedule.dto';
import { CompleteActivityDto } from './dto/complete-activity.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('crop-activity-schedules')
export class CropActivitySchedulesController {
  constructor(private readonly cropActivitySchedulesService: CropActivitySchedulesService) {}

  @Roles(Role.ADVISOR)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateActivityScheduleDto) {
    return this.cropActivitySchedulesService.create(user, dto);
  }

  @Roles(Role.ADVISOR)
  @Post('bulk')
  bulkCreate(@CurrentUser() user: AuthUser, @Body() dto: BulkCreateActivityScheduleDto) {
    return this.cropActivitySchedulesService.bulkCreate(user, dto);
  }

  @Roles(Role.FARMER)
  @Get('today')
  findToday(@CurrentUser() user: AuthUser) {
    return this.cropActivitySchedulesService.findTodayForFarmer(user);
  }

  @Roles(Role.FARMER, Role.ADVISOR, Role.ADMIN)
  @Get('crop/:cropCycleId')
  findAllForCropCycle(@CurrentUser() user: AuthUser, @Param('cropCycleId') cropCycleId: string) {
    return this.cropActivitySchedulesService.findAllForCropCycle(user, cropCycleId);
  }

  @Roles(Role.ADVISOR)
  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateActivityScheduleDto) {
    return this.cropActivitySchedulesService.update(user, id, dto);
  }

  @Roles(Role.FARMER)
  @Patch(':id/complete')
  complete(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CompleteActivityDto) {
    return this.cropActivitySchedulesService.complete(user, id, dto);
  }

  @Roles(Role.ADVISOR)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cropActivitySchedulesService.remove(user, id);
  }
}
