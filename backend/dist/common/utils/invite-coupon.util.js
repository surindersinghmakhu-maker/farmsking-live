"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.provisionInviteCoupon = provisionInviteCoupon;
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const SINGLETON_ID = 'default';
const DAY_MS = 24 * 60 * 60 * 1000;
const ALPHANUMERIC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateInviteCode() {
    const bytes = (0, crypto_1.randomBytes)(5);
    let code = 'S';
    for (let i = 0; i < 5; i++) {
        code += ALPHANUMERIC[bytes[i] % ALPHANUMERIC.length];
    }
    return code;
}
async function provisionInviteCoupon(prisma, userId) {
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
            kind: client_1.CouponKind.PERSONAL_INVITE,
            commissionType: client_1.DiscountValueType.PERCENTAGE,
            commissionValue: settings.inviteCouponCommissionPercent,
            discountType: client_1.DiscountValueType.PERCENTAGE,
            discountValue: settings.inviteCouponDiscountPercent,
            expiresAt: new Date(Date.now() + settings.inviteCouponValidityDays * DAY_MS),
            usageLimit: settings.inviteCouponUsageLimit,
        },
    });
}
//# sourceMappingURL=invite-coupon.util.js.map