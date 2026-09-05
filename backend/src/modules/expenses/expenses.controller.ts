import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FARMER, Role.ADMIN, Role.SUPER_ADMIN)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get('categories')
  listCategories() {
    return this.expensesService.listCategories();
  }

  @Get('categories/all')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  listAllCategoriesForAdmin() {
    return this.expensesService.listAllCategoriesForAdmin();
  }

  @Post('categories')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  createCategory(@Body() dto: { key: string; labelEn: string; labelHi?: string; sortOrder?: number }) {
    return this.expensesService.createCategory(dto);
  }

  @Patch('categories/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  updateCategory(@Param('id') id: string, @Body() dto: { labelEn?: string; labelHi?: string; sortOrder?: number; isActive?: boolean }) {
    return this.expensesService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  deleteCategory(@Param('id') id: string) {
    return this.expensesService.deleteCategory(id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(user, dto);
  }

  @Get('farm/:farmId')
  findAllForFarm(@CurrentUser() user: AuthUser, @Param('farmId') farmId: string) {
    return this.expensesService.findAllForFarm(user, farmId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.expensesService.findOneOrThrow(user, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expensesService.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.expensesService.remove(user, id);
  }
}
