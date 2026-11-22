import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { GardensService } from './gardens.service';
import { CreateGardenDto } from './dto/create-garden.dto';
import { CreatePlantDto } from './dto/create-plant.dto';
import { CreateGardenExpenseDto } from './dto/create-garden-expense.dto';
import { CreatePlantCareScheduleDto } from './dto/create-plant-care-schedule.dto';
import { LogPlantHealthDto } from './dto/log-plant-health.dto';
import { DiagnosePlantDto } from './dto/diagnose-plant.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.GARDENER, Role.ADMIN, Role.SUPER_ADMIN)
@Controller('gardens')
export class GardensController {
  constructor(private readonly gardensService: GardensService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateGardenDto) {
    return this.gardensService.create(user, dto);
  }

  @Get('mine')
  findAll(@CurrentUser() user: AuthUser) {
    return this.gardensService.findAll(user);
  }

  // ── Plants Endpoints (Standalone & Garden-bound) ──
  @Get('plants')
  listAllPlants(@CurrentUser() user: AuthUser) {
    return this.gardensService.listAllPlants(user);
  }

  @Post('plants')
  addStandalonePlant(@CurrentUser() user: AuthUser, @Body() dto: CreatePlantDto) {
    return this.gardensService.addPlant(user, dto.gardenId || null, dto);
  }

  @Get('plants/:id')
  getPlantDetails(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.gardensService.getPlantOrThrow(user, id);
  }

  // ── Care Schedules & Recurring Tasks ──
  @Get('care-tasks')
  listCareTasks(@CurrentUser() user: AuthUser, @Query('dueToday') dueToday?: string) {
    return this.gardensService.listCareTasks(user, { dueToday: dueToday === 'true' });
  }

  @Post('care-tasks')
  addCareSchedule(@CurrentUser() user: AuthUser, @Body() dto: CreatePlantCareScheduleDto) {
    return this.gardensService.addCareSchedule(user, dto);
  }

  @Patch('care-tasks/:id/complete')
  completeCareTask(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.gardensService.completeCareTask(user, id);
  }

  // ── Health Logs & Photo Timeline ──
  @Post('plants/health-log')
  logPlantHealth(@CurrentUser() user: AuthUser, @Body() dto: LogPlantHealthDto) {
    return this.gardensService.logPlantHealth(user, dto);
  }

  // ── AI Credit Status & Quota ──
  @Get('ai-credits')
  getAiCreditStatus(@CurrentUser() user: AuthUser) {
    return this.gardensService.getAiCreditStatus(user);
  }

  // ── Garden Expenses ──
  @Post('expenses')
  addExpense(@CurrentUser() user: AuthUser, @Body() dto: CreateGardenExpenseDto) {
    return this.gardensService.addExpense(user, dto);
  }

  @Get('expenses')
  listExpenses(@CurrentUser() user: AuthUser) {
    return this.gardensService.listExpenses(user);
  }

  @Delete('expenses/:id')
  deleteExpense(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.gardensService.deleteExpense(user, id);
  }

  // ── Garden Sub-resources ──
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.gardensService.findOneOrThrow(user, id);
  }

  @Post(':id/plants')
  addPlantToGarden(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CreatePlantDto) {
    return this.gardensService.addPlant(user, id, dto);
  }

  @Get(':id/plants')
  listGardenPlants(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.gardensService.listPlants(user, id);
  }
}
