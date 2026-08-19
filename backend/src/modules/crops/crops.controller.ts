import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { CropsService } from './crops.service';
import { CreateCropDto } from './dto/create-crop.dto';
import { UpdateCropDto } from './dto/update-crop.dto';
import { RejectCropDto } from './dto/reject-crop.dto';
import { UpdateCropScheduleDto } from './dto/update-crop-schedule.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FARMER, Role.ADVISOR, Role.ADMIN, Role.SUPER_ADMIN)
@Controller('crops')
export class CropsController {
  constructor(private readonly cropsService: CropsService) {}

  @Roles(Role.FARMER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCropDto) {
    return this.cropsService.create(user, dto);
  }

  @Roles(Role.ADVISOR)
  @Get('advisor/pending')
  listPendingForAdvisor(@CurrentUser() user: AuthUser) {
    return this.cropsService.listPendingForAdvisor(user);
  }

  @Roles(Role.ADVISOR)
  @Get('advisor/accepted')
  listAcceptedForAdvisor(@CurrentUser() user: AuthUser) {
    return this.cropsService.listAcceptedForAdvisor(user);
  }

  @Roles(Role.FARMER)
  @Post(':id/submit-to-advisor')
  submitToAdvisor(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cropsService.submitToAdvisor(user, id);
  }

  @Roles(Role.FARMER)
  @Post(':id/cancel-submission')
  cancelSubmission(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cropsService.cancelSubmission(user, id);
  }

  @Roles(Role.ADVISOR)
  @Post(':id/accept')
  acceptByAdvisor(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cropsService.acceptByAdvisor(user, id);
  }

  @Roles(Role.ADVISOR)
  @Post(':id/reject')
  rejectByAdvisor(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: RejectCropDto) {
    return this.cropsService.rejectByAdvisor(user, id, dto.reason);
  }

  @Roles(Role.FARMER, Role.ADVISOR)
  @Patch(':id/schedule')
  updateAssignedSchedule(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateCropScheduleDto) {
    return this.cropsService.updateAssignedSchedule(user, id, dto.assignedSchedule);
  }

  @Roles(Role.FARMER)
  @Get('mine')
  listMineForFarmer(@CurrentUser() user: AuthUser) {
    return this.cropsService.listMineForFarmer(user);
  }

  @Get('plot/:plotId')
  findAllForPlot(@CurrentUser() user: AuthUser, @Param('plotId') plotId: string) {
    return this.cropsService.findAllForPlot(user, plotId);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('lookup/:cropId')
  lookupByCropId(@Param('cropId') cropId: string) {
    return this.cropsService.lookupByCropId(cropId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cropsService.findOneOrThrow(user, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateCropDto) {
    return this.cropsService.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cropsService.remove(user, id);
  }
}
