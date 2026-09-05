import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { AppSettingsService } from './app-settings.service';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('app-settings')
export class AppSettingsController {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  /** Any authenticated user — needed to build UPI payment links on order/plan screens. */
  @Get()
  get() {
    return this.appSettingsService.get();
  }

  /** Any authenticated user — real contact details for the "Support"/"Contact Us" screens. */
  @Get('support-contact')
  getSupportContact() {
    return this.appSettingsService.getSupportContact();
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateAppSettingsDto) {
    return this.appSettingsService.update(user, dto);
  }

  /** Get live category & sub-category feature flags */
  @Get('feature-flags')
  getFeatureFlags() {
    return this.appSettingsService.getFeatureFlags();
  }

  /** Update feature flags (Super Admin / Admin only) */
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch('feature-flags')
  updateFeatureFlags(@CurrentUser() user: AuthUser, @Body() flags: any) {
    return this.appSettingsService.updateFeatureFlags(user, flags);
  }
}

