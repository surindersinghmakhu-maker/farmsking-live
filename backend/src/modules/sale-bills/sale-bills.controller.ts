import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { SaleBillsService } from './sale-bills.service';
import { CreateSaleBillDto } from './dto/create-sale-bill.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FARMER)
@Controller('sale-bills')
export class SaleBillsController {
  constructor(private readonly saleBillsService: SaleBillsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSaleBillDto) {
    return this.saleBillsService.create(user, dto);
  }

  @Get()
  findAllMine(@CurrentUser() user: AuthUser) {
    return this.saleBillsService.listMine(user);
  }

  @Get('count/mine')
  countMine(@CurrentUser() user: AuthUser) {
    return this.saleBillsService.countMine(user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.saleBillsService.findOneOrThrow(user, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CreateSaleBillDto) {
    return this.saleBillsService.update(user, id, dto);
  }
}
