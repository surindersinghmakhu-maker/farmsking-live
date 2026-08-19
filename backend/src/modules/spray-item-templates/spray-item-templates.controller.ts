import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { SprayItemTemplatesService } from './spray-item-templates.service';
import { CreateSprayItemTemplateDto } from './dto/create-spray-item-template.dto';
import { UpdateSprayItemTemplateDto } from './dto/update-spray-item-template.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('spray-item-templates')
export class SprayItemTemplatesController {
  constructor(private readonly service: SprayItemTemplatesService) {}

  @Roles(Role.ADVISOR)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSprayItemTemplateDto) {
    return this.service.create(user.id, dto);
  }

  @Roles(Role.ADVISOR)
  @Get('mine')
  listMine(@CurrentUser() user: AuthUser) {
    return this.service.listMine(user.id);
  }

  @Roles(Role.SUPER_ADMIN)
  @Get()
  listAll() {
    return this.service.listAll();
  }

  @Roles(Role.FARMER, Role.GARDENER)
  @Get('for-my-advisor')
  listForMyAdvisor(@CurrentUser() user: AuthUser) {
    return this.service.listForMyAdvisor(user.id);
  }

  @Roles(Role.ADVISOR)
  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateSprayItemTemplateDto) {
    return this.service.update(user.id, id, dto);
  }

  @Roles(Role.ADVISOR)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.id, id);
  }
}
