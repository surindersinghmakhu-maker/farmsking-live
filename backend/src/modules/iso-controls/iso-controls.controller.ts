import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { IsoControlsService } from './iso-controls.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';

@Controller('iso-controls')
export class IsoControlsController {
  constructor(private readonly isoControlsService: IsoControlsService) {}

  /** Public / Authenticated: Get all ISO module controls status */
  @Get()
  getAllControls() {
    return this.isoControlsService.getAllModuleControls();
  }

  /** Public / Authenticated: Get single ISO module control status */
  @Get(':moduleKey')
  getModuleControl(@Param('moduleKey') moduleKey: string) {
    return this.isoControlsService.getModuleControl(moduleKey);
  }

  /** Admin Only: Toggle ISO Module ON/OFF */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Put(':moduleKey/toggle')
  toggleModule(
    @Param('moduleKey') moduleKey: string,
    @Body() body: { isEnabled: boolean; maintenanceMessage?: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.isoControlsService.toggleModule(
      moduleKey,
      body.isEnabled,
      body.maintenanceMessage,
      user.id,
      user.name || user.mobile,
    );
  }

  /** Admin Only: Get ISO Audit Trail Logs */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('audit/logs')
  getAuditLogs() {
    return this.isoControlsService.getAuditLogs();
  }
}
