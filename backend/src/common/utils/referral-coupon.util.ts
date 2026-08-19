import { randomBytes } from 'crypto';
import { CouponKind, DiscountValueType, PrismaClient } from '@prisma/client';

const SINGLETON_ID = 'default';

function generateReferralCouponCode(): string {
  return `WELCOME-${randomBytes(3).toString('hex').toUpperCase()}`;
}

/**
 * Issued once when a customer's account gets linked to a referrer (at signup via referral code, or later
 * by a Super Admin) — a discount coupon the referred customer redeems on their own orders. Its usageLimit
 * caps it to the configured number of orders (default 5); each redemption also credits a commission to the
 * referrer's wallet, reusing the existing Coupon/CouponRedemption pipeline. Silently skips if the customer
 * already has one (referredById is permanent, set only once).
 */
export async function provisionReferralWelcomeCoupon(
  prisma: PrismaClient,
  customerId: string,
  referrerId: string,
): Promise<string | null> {
  const existing = await prisma.coupon.findFirst({
    where: { kind: CouponKind.REFERRAL_WELCOME, businessPartnerId: referrerId, createdById: customerId },
  });
  if (existing) return existing.code;

  const settings = await prisma.couponSystemSetting.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID },
  });

  let code = generateReferralCouponCode();
  while (await prisma.coupon.findUnique({ where: { code } })) {
    code = generateReferralCouponCode();
  }

  await prisma.coupon.create({
    data: {
      code,
      businessPartnerId: referrerId,
      // createdById must reference a valid user — the referred customer themselves, since it's their
      // welcome coupon (distinct from businessPartnerId, who is who earns the commission on its use).
      createdById: customerId,
      kind: CouponKind.REFERRAL_WELCOME,
      commissionType: DiscountValueType.PERCENTAGE,
      commissionValue: settings.referralCommissionPercent,
      discountType: DiscountValueType.PERCENTAGE,
      discountValue: settings.referralDiscountPercent,
      discountMaxCap: settings.referralMaxDiscountCap,
      expiresAt: new Date(Date.now() + settings.referralCouponValidityDays * 24 * 60 * 60 * 1000),
      usageLimit: settings.referralOrderLimit,
    },
  });

  await prisma.user.update({ where: { id: customerId }, data: { referralWelcomeCouponCode: code } });
  return code;
}
