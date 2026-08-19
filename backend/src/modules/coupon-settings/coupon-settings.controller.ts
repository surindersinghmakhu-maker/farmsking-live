import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { CouponSettingsService } from './coupon-settings.service';
import { UpdateCouponSettingsDto } from './dto/update-coupon-settings.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('coupon-settings')
export class CouponSettingsController {
  constructor(private readonly couponSettingsService: CouponSettingsService) {}

  /** Any authenticated user — coupon rates/validity are read server-side wherever a coupon is generated. */
  @Get()
  get() {
    return this.couponSettingsService.get();
  }

  @Roles(Role.SUPER_ADMIN)
  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateCouponSettingsDto) {
    return this.couponSettingsService.update(user, dto);
  }
}
