import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { AdvisorAssignmentService } from './advisor-assignment.service';
import { CreateAdvisorAssignmentDto } from './dto/create-advisor-assignment.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('advisor-assignments')
export class AdvisorAssignmentController {
  constructor(private readonly advisorAssignmentService: AdvisorAssignmentService) {}

  @Roles(Role.ADVISOR)
  @Get('my-farmers')
  findMyFarmers(@CurrentUser() user: AuthUser) {
    return this.advisorAssignmentService.findMyFarmers(user);
  }

  @Roles(Role.FARMER)
  @Get('my-advisor')
  findMyAdvisor(@CurrentUser() user: AuthUser) {
    return this.advisorAssignmentService.findMyAdvisor(user);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAdvisorAssignmentDto) {
    return this.advisorAssignmentService.create(user, dto);
  }

  @Roles(Role.ADMIN, Role.ADVISOR)
  @Post(':id/revoke')
  revoke(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.advisorAssignmentService.revoke(user, id);
  }
}
