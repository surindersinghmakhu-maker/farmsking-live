import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { WeatherService } from './weather.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FARMER, Role.GARDENER, Role.ADVISOR, Role.ADMIN, Role.SUPER_ADMIN)
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  /**
   * Free for every farmer/gardener — no subscription required.
   * An advisor may pass ?userId=<farmerId|gardenerId> to see the local weather of one of their assigned users
   * (e.g. while chatting with them) — verified against their active AdvisorAssignment.
   */
  @Get('current')
  getCurrent(@CurrentUser() user: AuthUser, @Query('userId') userId?: string) {
    return this.weatherService.getCurrent(user, userId);
  }

  /** Advisor dashboard's Weather Alerts tab — assigned farmers whose weather-alert thresholds are currently triggered. */
  @Roles(Role.ADVISOR)
  @Get('advisor-alerts')
  getAdvisorAlerts(@CurrentUser() user: AuthUser) {
    return this.weatherService.getAdvisorAlerts(user);
  }
}
