"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.provisionReferralWelcomeCoupon = provisionReferralWelcomeCoupon;
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const SINGLETON_ID = 'default';
function generateReferralCouponCode() {
    return `WELCOME-${(0, crypto_1.randomBytes)(3).toString('hex').toUpperCase()}`;
}
async function provisionReferralWelcomeCoupon(prisma, customerId, referrerId) {
    const existing = await prisma.coupon.findFirst({
        where: { kind: client_1.CouponKind.REFERRAL_WELCOME, businessPartnerId: referrerId, createdById: customerId },
    });
    if (existing)
        return existing.code;
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
            createdById: customerId,
            kind: client_1.CouponKind.REFERRAL_WELCOME,
            commissionType: client_1.DiscountValueType.PERCENTAGE,
            commissionValue: settings.referralCommissionPercent,
            discountType: client_1.DiscountValueType.PERCENTAGE,
            discountValue: settings.referralDiscountPercent,
            discountMaxCap: settings.referralMaxDiscountCap,
            expiresAt: new Date(Date.now() + settings.referralCouponValidityDays * 24 * 60 * 60 * 1000),
            usageLimit: settings.referralOrderLimit,
        },
    });
    return code;
}
//# sourceMappingURL=referral-coupon.util.js.map