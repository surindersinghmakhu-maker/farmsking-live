import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { CropProblemsService } from './crop-problems.service';
import { CreateCropProblemDto } from './dto/create-crop-problem.dto';
import { RespondCropProblemDto } from './dto/respond-crop-problem.dto';
import { UpdateCropProblemStatusDto } from './dto/update-crop-problem-status.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('crop-problems')
export class CropProblemsController {
  constructor(private readonly cropProblemsService: CropProblemsService) {}

  @Roles(Role.FARMER)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCropProblemDto) {
    return this.cropProblemsService.create(user, dto);
  }

  @Roles(Role.FARMER)
  @Get('mine')
  findMine(@CurrentUser() user: AuthUser) {
    return this.cropProblemsService.findAllForFarmer(user);
  }

  @Roles(Role.ADVISOR)
  @Get('assigned')
  findAssigned(@CurrentUser() user: AuthUser) {
    return this.cropProblemsService.findAllForAdvisor(user);
  }

  @Roles(Role.FARMER, Role.ADVISOR, Role.ADMIN)
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cropProblemsService.findOneOrThrow(user, id);
  }

  @Roles(Role.ADVISOR)
  @Patch(':id/respond')
  respond(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: RespondCropProblemDto) {
    return this.cropProblemsService.respond(user, id, dto);
  }

  @Roles(Role.FARMER, Role.ADVISOR)
  @Patch(':id/status')
  updateStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateCropProblemStatusDto) {
    return this.cropProblemsService.updateStatus(user, id, dto);
  }
}
