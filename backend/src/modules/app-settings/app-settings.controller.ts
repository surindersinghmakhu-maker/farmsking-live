import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { AppSettingsService } from './app-settings.service';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';

@Controller('app-settings')
export class AppSettingsController {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  /** Any visitor / user — needed to load branding, logo, app settings, UPI payee name */
  @Get()
  get() {
    return this.appSettingsService.get();
  }

  /** Any visitor / user — real contact details for the "Support"/"Contact Us" screens */
  @Get('support-contact')
  getSupportContact() {
    return this.appSettingsService.getSupportContact();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateAppSettingsDto) {
    return this.appSettingsService.update(user, dto);
  }

  /** Get live category & sub-category feature flags (Public for shop & home catalogs) */
  @Get('feature-flags')
  getFeatureFlags() {
    return this.appSettingsService.getFeatureFlags();
  }

  /** Update feature flags (Super Admin / Admin only) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch('feature-flags')
  updateFeatureFlags(@CurrentUser() user: AuthUser, @Body() flags: any) {
    return this.appSettingsService.updateFeatureFlags(user, flags);
  }

  /** Get active dynamic SEO settings */
  @Get('seo')
  getSeo() {
    return this.appSettingsService.getSeo();
  }

  /** Update dynamic SEO settings */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post('seo')
  updateSeo(@Body() dto: any) {
    return this.appSettingsService.updateSeo(dto);
  }

  /** Get all active system integrations (SMS, Gateway, WhatsApp, Product, Social, OTP, About) */
  @Get('integrations')
  getIntegrations() {
    return this.appSettingsService.getIntegrations();
  }

  /** Update system integrations (Super Admin / Admin only) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch('integrations')
  updateIntegrations(@CurrentUser() user: AuthUser, @Body() payload: any) {
    return this.appSettingsService.updateIntegrations(user, payload);
  }

  /** Get third-party service provider credentials & active providers */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Get('service-config')
  getServiceConfig() {
    return this.appSettingsService.getServiceConfig();
  }

  /** Update third-party service provider configuration */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post('service-config')
  updateServiceConfig(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.appSettingsService.updateServiceConfig(user, body);
  }

  @Get('public-master-data')
  getPublicMasterData() {
    return this.appSettingsService.getPublicMasterData();
  }
}

/** Public unauthenticated endpoint for website visitors & app public screens */
@Controller('public-contact')
export class PublicContactController {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  @Get()
  getSupportContact() {
    return this.appSettingsService.getSupportContact();
  }

  /** Public master data for website visitors & mobile app startup without login */
  @Get('master-data')
  getPublicMasterData() {
    return this.appSettingsService.getPublicMasterData();
  }

  /** Public app settings for unauthenticated visitors */
  @Get('app-settings')
  getPublicAppSettings() {
    return this.appSettingsService.get();
  }
}


