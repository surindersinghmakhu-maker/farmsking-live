import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { UpdateCouponSettingsDto } from './dto/update-coupon-settings.dto';

const SINGLETON_ID = 'default';

@Injectable()
export class CouponSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    return this.prisma.couponSystemSetting.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID },
    });
  }

  async update(admin: AuthUser, dto: UpdateCouponSettingsDto) {
    const fields: Record<string, unknown> = {};
    const keys: (keyof UpdateCouponSettingsDto)[] = [
      'partnerCouponDiscountPercent',
      'partnerCouponCommissionPercent',
      'partnerCouponMinOrderAmount',
      'partnerCouponMaxDiscountCap',
      'partnerCouponValidityDays',
      'referralCommissionPercent',
      'referralDiscountPercent',
      'referralMaxDiscountCap',
      'referralOrderLimit',
      'referralCouponValidityDays',
      'commissionCouponDiscountPercent',
      'commissionCouponCommissionPercent',
      'commissionCouponMinOrderAmount',
      'commissionCouponMaxDiscountCap',
      'commissionCouponValidityDays',
      'inviteCouponDiscountPercent',
      'inviteCouponCommissionPercent',
      'inviteCouponValidityDays',
      'inviteCouponUsageLimit',
    ];
    for (const key of keys) {
      if (dto[key] !== undefined) fields[key] = dto[key];
    }

    return this.prisma.couponSystemSetting.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...fields, updatedById: admin.id },
      update: { ...fields, updatedById: admin.id },
    });
  }
}
