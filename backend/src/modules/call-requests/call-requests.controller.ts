import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { CallRequestsService } from './call-requests.service';
import { ResolveCallRequestDto } from './dto/resolve-call-request.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('call-requests')
export class CallRequestsController {
  constructor(private readonly callRequestsService: CallRequestsService) {}

  @Roles(Role.FARMER, Role.GARDENER)
  @Post()
  create(@CurrentUser() user: AuthUser) {
    return this.callRequestsService.create(user);
  }

  @Roles(Role.FARMER, Role.GARDENER)
  @Get('mine/pending')
  getMyPending(@CurrentUser() user: AuthUser) {
    return this.callRequestsService.getMyPending(user);
  }

  @Roles(Role.ADVISOR)
  @Get('mine')
  listMine(@CurrentUser() user: AuthUser) {
    return this.callRequestsService.listMine(user);
  }

  @Roles(Role.ADVISOR)
  @Patch(':id/resolve')
  resolve(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ResolveCallRequestDto) {
    return this.callRequestsService.resolve(user, id, dto);
  }
}
