import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { SprayScheduleService } from './spray-schedules.service';
import { CreateSprayScheduleDto } from './dto/create-spray-schedule.dto';
import { UpdateSprayScheduleDto } from './dto/update-spray-schedule.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FARMER, Role.ADVISOR, Role.ADMIN, Role.SUPER_ADMIN)
@Controller('spray-schedules')
export class SprayScheduleController {
  constructor(private readonly sprayScheduleService: SprayScheduleService) {}

  @Roles(Role.ADVISOR)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSprayScheduleDto) {
    return this.sprayScheduleService.create(user, dto);
  }

  @Get('catalog/search')
  searchCatalog(@Query('q') q?: string) {
    return this.sprayScheduleService.searchCatalog(q ?? '');
  }

  @Get('crop/:cropCycleId')
  listForCrop(@CurrentUser() user: AuthUser, @Param('cropCycleId') cropCycleId: string) {
    return this.sprayScheduleService.listForCrop(user, cropCycleId);
  }

  @Roles(Role.ADVISOR)
  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateSprayScheduleDto) {
    return this.sprayScheduleService.update(user, id, dto);
  }

  @Roles(Role.ADVISOR)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sprayScheduleService.remove(user, id);
  }
}
