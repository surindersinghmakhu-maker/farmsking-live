"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePartnerCouponCode = generatePartnerCouponCode;
exports.provisionPartnerReferralCoupon = provisionPartnerReferralCoupon;
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const SINGLETON_ID = 'default';
const ALPHANUMERIC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generatePartnerCouponCode() {
    const bytes = (0, crypto_1.randomBytes)(5);
    let code = 'R';
    for (let i = 0; i < 5; i++) {
        code += ALPHANUMERIC[bytes[i] % ALPHANUMERIC.length];
    }
    return code;
}
async function provisionPartnerReferralCoupon(prisma, businessPartnerId, createdById) {
    const existing = await prisma.coupon.findFirst({
        where: { businessPartnerId, kind: client_1.CouponKind.PARTNER_REFERRAL, isActive: true },
    });
    if (existing)
        return;
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
            kind: client_1.CouponKind.PARTNER_REFERRAL,
            commissionType: client_1.DiscountValueType.PERCENTAGE,
            commissionValue: settings.partnerCouponCommissionPercent,
            discountType: client_1.DiscountValueType.PERCENTAGE,
            discountValue: settings.partnerCouponDiscountPercent,
            discountMaxCap: settings.partnerCouponMaxDiscountCap,
            minOrderAmount: settings.partnerCouponMinOrderAmount,
            expiresAt: new Date(Date.now() + settings.partnerCouponValidityDays * 24 * 60 * 60 * 1000),
            usageLimit: 100000,
        },
    });
}
//# sourceMappingURL=partner-coupon.util.js.map