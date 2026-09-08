"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponsService = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
const partner_coupon_util_1 = require("../../common/utils/partner-coupon.util");
const ALPHANUMERIC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateCouponCode() {
    const bytes = (0, crypto_1.randomBytes)(5);
    let code = 'C';
    for (let i = 0; i < 5; i++) {
        code += ALPHANUMERIC[bytes[i] % ALPHANUMERIC.length];
    }
    return code;
}
function applyDiscountValue(type, value, base, maxCap) {
    const raw = type === 'PERCENTAGE' ? (base * value) / 100 : value;
    const capped = maxCap != null ? Math.min(raw, maxCap) : raw;
    return Math.min(capped, base);
}
let CouponsService = class CouponsService {
    prisma;
    walletService;
    constructor(prisma, walletService) {
        this.prisma = prisma;
        this.walletService = walletService;
    }
    async create(user, dto) {
        const partner = await this.prisma.user.findFirst({
            where: { id: dto.businessPartnerId, roles: { hasSome: [client_1.Role.BUSINESS_PARTNER, client_1.Role.ADVISOR] }, deletedAt: null },
        });
        if (!partner) {
            throw new common_1.NotFoundException('Business partner or advisor not found.');
        }
        let code;
        if (dto.code) {
            code = dto.code.trim().toUpperCase();
            if (await this.prisma.coupon.findUnique({ where: { code } })) {
                throw new common_1.ConflictException('That coupon code is already in use.');
            }
        }
        else {
            code = generateCouponCode();
            while (await this.prisma.coupon.findUnique({ where: { code } })) {
                code = generateCouponCode();
            }
        }
        return this.prisma.coupon.create({
            data: {
                code,
                businessPartnerId: dto.businessPartnerId,
                kind: dto.kind ?? client_1.CouponKind.GENERIC,
                commissionType: dto.commissionType,
                commissionValue: dto.commissionValue,
                commissionMaxCap: dto.commissionMaxCap,
                discountType: dto.discountType,
                discountValue: dto.discountValue,
                discountMaxCap: dto.discountMaxCap,
                minOrderAmount: dto.minOrderAmount,
                expiresAt: new Date(dto.expiresAt),
                usageLimit: dto.usageLimit,
                createdById: user.id,
            },
        });
    }
    listAll() {
        return this.prisma.coupon.findMany({
            include: { businessPartner: { select: { id: true, name: true, mobile: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    listMine(user) {
        return this.prisma.coupon.findMany({
            where: { businessPartnerId: user.id },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOneOrThrow(id) {
        const coupon = await this.prisma.coupon.findUnique({ where: { id } });
        if (!coupon) {
            throw new common_1.NotFoundException('Coupon not found.');
        }
        return coupon;
    }
    async update(id, dto) {
        await this.findOneOrThrow(id);
        return this.prisma.coupon.update({
            where: { id },
            data: {
                ...dto,
                ...(dto.expiresAt ? { expiresAt: new Date(dto.expiresAt) } : {}),
            },
        });
    }
    async remove(id) {
        await this.findOneOrThrow(id);
        return this.prisma.coupon.update({ where: { id }, data: { isActive: false } });
    }
    async getRedemptions(user, id) {
        const coupon = await this.findOneOrThrow(id);
        if (user.role !== client_1.Role.ADMIN && user.role !== client_1.Role.SUPER_ADMIN && coupon.businessPartnerId !== user.id) {
            throw new common_1.ForbiddenException('You do not have access to this coupon.');
        }
        return this.prisma.couponRedemption.findMany({
            where: { couponId: id },
            include: { customer: { select: { id: true, name: true, mobile: true } } },
            orderBy: { redeemedAt: 'desc' },
        });
    }
    async getActiveForOrder(code, orderAmount) {
        const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
        if (!coupon || !coupon.isActive) {
            throw new common_1.NotFoundException('Invalid or inactive coupon code.');
        }
        if (coupon.expiresAt < new Date()) {
            throw new common_1.BadRequestException('This coupon has expired.');
        }
        if (coupon.usedCount >= coupon.usageLimit) {
            throw new common_1.ConflictException('This coupon has reached its usage limit.');
        }
        if (coupon.minOrderAmount != null && orderAmount < Number(coupon.minOrderAmount)) {
            throw new common_1.BadRequestException(`This coupon needs a minimum order of ₹${coupon.minOrderAmount}.`);
        }
        const discountAmount = applyDiscountValue(coupon.discountType, Number(coupon.discountValue), orderAmount, coupon.discountMaxCap != null ? Number(coupon.discountMaxCap) : null);
        const commissionAmount = applyDiscountValue(coupon.commissionType, Number(coupon.commissionValue), orderAmount, coupon.commissionMaxCap != null ? Number(coupon.commissionMaxCap) : null);
        return { coupon, discountAmount, commissionAmount };
    }
    async previewForOrder(code, orderAmount) {
        const { discountAmount, commissionAmount } = await this.getActiveForOrder(code, orderAmount);
        return { discountAmount, commissionAmount, finalAmount: orderAmount - discountAmount };
    }
    async redeem(user, code, dto) {
        const { coupon, discountAmount, commissionAmount } = await this.getActiveForOrder(code, dto.orderAmount);
        const [redemption] = await this.prisma.$transaction([
            this.prisma.couponRedemption.create({
                data: {
                    couponId: coupon.id,
                    customerId: user.id,
                    orderAmount: dto.orderAmount,
                    discountAmount,
                    commissionAmount,
                },
            }),
            this.prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } }),
        ]);
        await this.walletService.credit(coupon.businessPartnerId, commissionAmount, `Commission from coupon ${coupon.code}`, { couponRedemptionId: redemption.id });
        if (user.role === client_1.Role.CUSTOMER) {
            const partner = await this.prisma.user.findFirst({
                where: { id: coupon.businessPartnerId, roles: { has: client_1.Role.BUSINESS_PARTNER }, deletedAt: null },
            });
            if (partner) {
                await this.prisma.partnerAssignment.upsert({
                    where: { customerId: user.id },
                    create: { businessPartnerId: partner.id, customerId: user.id },
                    update: {},
                });
            }
        }
        return { discountAmount, commissionAmount, redemption };
    }
    async issueOnePartnerCoupon(businessPartnerId, createdById, settingsIn) {
        const settings = settingsIn ??
            (await this.prisma.couponSystemSetting.upsert({
                where: { id: 'default' },
                update: {},
                create: { id: 'default' },
            }));
        let code = (0, partner_coupon_util_1.generatePartnerCouponCode)();
        while (await this.prisma.coupon.findUnique({ where: { code } })) {
            code = (0, partner_coupon_util_1.generatePartnerCouponCode)();
        }
        return this.prisma.coupon.create({
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
    async issuePartnerCoupon(caller, dto) {
        if (dto.businessPartnerId) {
            const partner = await this.prisma.user.findFirst({
                where: { id: dto.businessPartnerId, roles: { has: client_1.Role.BUSINESS_PARTNER }, deletedAt: null },
            });
            if (!partner) {
                throw new common_1.NotFoundException('Business partner not found.');
            }
            const coupon = await this.issueOnePartnerCoupon(dto.businessPartnerId, caller.id);
            return { issuedCount: 1, coupons: [coupon] };
        }
        const [partners, settings] = await Promise.all([
            this.prisma.user.findMany({
                where: { roles: { has: client_1.Role.BUSINESS_PARTNER }, deletedAt: null },
                select: { id: true },
            }),
            this.prisma.couponSystemSetting.upsert({ where: { id: 'default' }, update: {}, create: { id: 'default' } }),
        ]);
        const coupons = await Promise.all(partners.map((partner) => this.issueOnePartnerCoupon(partner.id, caller.id, settings)));
        return { issuedCount: coupons.length, coupons };
    }
};
exports.CouponsService = CouponsService;
exports.CouponsService = CouponsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService])
], CouponsService);
//# sourceMappingURL=coupons.service.js.map