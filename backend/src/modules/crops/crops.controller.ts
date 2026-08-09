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

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FARMER, Role.ADMIN)
@Controller('crops')
export class CropsController {
  constructor(private readonly cropsService: CropsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCropDto) {
    return this.cropsService.create(user, dto);
  }

  @Get('plot/:plotId')
  findAllForPlot(@CurrentUser() user: AuthUser, @Param('plotId') plotId: string) {
    return this.cropsService.findAllForPlot(user, plotId);
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
