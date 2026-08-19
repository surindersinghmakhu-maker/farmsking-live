import { randomBytes } from 'crypto';
import { CouponKind, DiscountValueType, PrismaClient } from '@prisma/client';

const SINGLETON_ID = 'default';
const DAY_MS = 24 * 60 * 60 * 1000;

const ALPHANUMERIC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I — avoids look-alike mixups when read aloud/shared

/** 'S' + 5-character alphanumeric code — the default format for Special (personal invite) coupons. */
function generateInviteCode(): string {
  const bytes = randomBytes(5);
  let code = 'S';
  for (let i = 0; i < 5; i++) {
    code += ALPHANUMERIC[bytes[i] % ALPHANUMERIC.length];
  }
  return code;
}

/** Every user gets exactly one system-issued personal invite coupon, reusing the same Coupon/commission pipeline as Business Partners.
 * Commission/discount/validity/usage-limit defaults come from AppSetting (Coupon Master → Special) — admin can edit per-user afterwards via PATCH /coupons/:id. */
export async function provisionInviteCoupon(prisma: PrismaClient, userId: string): Promise<void> {
  const settings = await prisma.couponSystemSetting.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID },
  });

  let code = generateInviteCode();
  while (await prisma.coupon.findUnique({ where: { code } })) {
    code = generateInviteCode();
  }

  await prisma.coupon.create({
    data: {
      code,
      businessPartnerId: userId,
      createdById: userId,
      kind: CouponKind.PERSONAL_INVITE,
      commissionType: DiscountValueType.PERCENTAGE,
      commissionValue: settings.inviteCouponCommissionPercent,
      discountType: DiscountValueType.PERCENTAGE,
      discountValue: settings.inviteCouponDiscountPercent,
      expiresAt: new Date(Date.now() + settings.inviteCouponValidityDays * DAY_MS),
      usageLimit: settings.inviteCouponUsageLimit,
    },
  });
}
