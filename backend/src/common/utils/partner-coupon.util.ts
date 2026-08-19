import { randomBytes } from 'crypto';
import { CouponKind, DiscountValueType, PrismaClient } from '@prisma/client';

const SINGLETON_ID = 'default';
const ALPHANUMERIC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I — avoids look-alike mixups when read aloud/shared

/** 'R' + 5-character alphanumeric code — the default format for Business Partner referral coupons. */
export function generatePartnerCouponCode(): string {
  const bytes = randomBytes(5);
  let code = 'R';
  for (let i = 0; i < 5; i++) {
    code += ALPHANUMERIC[bytes[i] % ALPHANUMERIC.length];
  }
  return code;
}

/**
 * Issued once per account when it's granted the BUSINESS_PARTNER role — a min-order-gated, capped
 * referral coupon separate from the account's personal invite code. Discount %, commission %, min
 * order amount, max discount cap, and validity are all Super-Admin configurable via AppSetting.
 * Silently skips if this account already holds an active one.
 */
export async function provisionPartnerReferralCoupon(
  prisma: PrismaClient,
  businessPartnerId: string,
  createdById: string,
): Promise<void> {
  const existing = await prisma.coupon.findFirst({
    where: { businessPartnerId, kind: CouponKind.PARTNER_REFERRAL, isActive: true },
  });
  if (existing) return;

  const settings = await prisma.couponSystemSetting.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID },
  });

  let code = generatePartnerCouponCode();
  while (await prisma.coupon.findUnique({ where: { code } })) {
    code = generatePartnerCouponCode();
  }

  await prisma.coupon.create({
    data: {
      code,
      businessPartnerId,
      createdById,
      kind: CouponKind.PARTNER_REFERRAL,
      commissionType: DiscountValueType.PERCENTAGE,
      commissionValue: settings.partnerCouponCommissionPercent,
      discountType: DiscountValueType.PERCENTAGE,
      discountValue: settings.partnerCouponDiscountPercent,
      discountMaxCap: settings.partnerCouponMaxDiscountCap,
      minOrderAmount: settings.partnerCouponMinOrderAmount,
      expiresAt: new Date(Date.now() + settings.partnerCouponValidityDays * 24 * 60 * 60 * 1000),
      usageLimit: 100000,
    },
  });
}
