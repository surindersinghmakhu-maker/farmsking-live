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

  @Roles(Role.SUPER_ADMIN)
  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateAppSettingsDto) {
    return this.appSettingsService.update(user, dto);
  }
}
