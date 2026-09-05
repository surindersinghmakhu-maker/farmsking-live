import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { AdvisorAssignmentService } from './advisor-assignment.service';
import { CreateAdvisorAssignmentDto } from './dto/create-advisor-assignment.dto';
import { ListFarmersQueryDto } from './dto/list-farmers-query.dto';
import { RejectAssignmentDto } from './dto/reject-assignment.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('advisor-assignments')
export class AdvisorAssignmentController {
  constructor(private readonly advisorAssignmentService: AdvisorAssignmentService) {}

  @Roles(Role.ADVISOR)
  @Get('stats')
  getFarmerStats(@CurrentUser() user: AuthUser) {
    return this.advisorAssignmentService.getFarmerStats(user);
  }

  @Roles(Role.ADVISOR)
  @Get('farmers')
  findFarmers(@CurrentUser() user: AuthUser, @Query() query: ListFarmersQueryDto) {
    return this.advisorAssignmentService.findFarmersByStatus(user, query.status ?? 'ALL');
  }

  @Roles(Role.ADVISOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Get('farmers/:farmerId')
  findFarmerDetail(@CurrentUser() user: AuthUser, @Param('farmerId') farmerId: string) {
    return this.advisorAssignmentService.findFarmerDetail(user, farmerId);
  }

  @Roles(Role.FARMER, Role.GARDENER)
  @Get('my-advisor')
  findMyAdvisor(@CurrentUser() user: AuthUser) {
    return this.advisorAssignmentService.findMyAdvisor(user);
  }

  /** Farmer/Gardener: their most recent still-open hire request, awaiting the advisor's accept/reject. */
  @Roles(Role.FARMER, Role.GARDENER)
  @Get('my-pending-request')
  findMyPendingRequest(@CurrentUser() user: AuthUser) {
    return this.advisorAssignmentService.findMyPendingRequest(user);
  }

  /** Farmer/Gardener: browse the advisors they could choose (matching FARM/GARDEN type), to pick one when on STANDARD/PREMIUM. */
  @Roles(Role.FARMER, Role.GARDENER)
  @Get('available')
  listAvailableAdvisors(@CurrentUser() user: AuthUser) {
    return this.advisorAssignmentService.listAvailableAdvisors(user);
  }

  @Roles(Role.FARMER, Role.GARDENER)
  @Post('choose-advisor/:advisorId')
  requestSpecificAdvisor(@CurrentUser() user: AuthUser, @Param('advisorId') advisorId: string) {
    return this.advisorAssignmentService.requestSpecificAdvisor(user.id, advisorId);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAdvisorAssignmentDto) {
    return this.advisorAssignmentService.create(user, dto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.ADVISOR)
  @Post(':id/revoke')
  revoke(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.advisorAssignmentService.revoke(user, id);
  }

  /** Advisor accepts a farmer's PENDING hire request. */
  @Roles(Role.ADVISOR)
  @Post(':id/accept')
  accept(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.advisorAssignmentService.accept(user, id);
  }

  /** Advisor rejects a farmer's PENDING hire request — the farmer can send another request afterwards. */
  @Roles(Role.ADVISOR)
  @Post(':id/reject')
  reject(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: RejectAssignmentDto) {
    return this.advisorAssignmentService.reject(user, id, dto.reason);
  }

  @Roles(Role.ADVISOR)
  @Post('farmers/:farmerId/renewal-reminder')
  sendRenewalReminder(@CurrentUser() user: AuthUser, @Param('farmerId') farmerId: string) {
    return this.advisorAssignmentService.sendRenewalReminder(user, farmerId);
  }
}
