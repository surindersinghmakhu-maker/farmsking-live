import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
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

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.gardensService.findOneOrThrow(user, id);
  }

  @Post(':id/plants')
  addPlant(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CreatePlantDto) {
    return this.gardensService.addPlant(user, id, dto);
  }

  @Get(':id/plants')
  listPlants(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.gardensService.listPlants(user, id);
  }

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
}
