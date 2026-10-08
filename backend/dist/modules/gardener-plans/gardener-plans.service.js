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
exports.GardenerPlansService = exports.RENEW_HISTORY_MONTHS = exports.GRACE_PERIOD_DAYS = exports.EXPIRY_WARNING_DAYS = exports.FREE_PLAN_MAX_PLANTS = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const app_settings_service_1 = require("../app-settings/app-settings.service");
const cashfree_service_1 = require("../cashfree/cashfree.service");
exports.FREE_PLAN_MAX_PLANTS = 5;
exports.EXPIRY_WARNING_DAYS = 5;
exports.GRACE_PERIOD_DAYS = 2;
exports.RENEW_HISTORY_MONTHS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const RENEW_CUTOFF_MS = exports.RENEW_HISTORY_MONTHS * 30 * DAY_MS;
function generateCode() {
    return `GPLAN-${(0, crypto_1.randomBytes)(4).toString('hex').toUpperCase()}`;
}
let GardenerPlansService = class GardenerPlansService {
    constructor(prisma, appSettingsService, cashfreeService) {
        this.prisma = prisma;
        this.appSettingsService = appSettingsService;
        this.cashfreeService = cashfreeService;
    }
    async getEffectivePlan(gardenerId) {
        const record = await this.prisma.gardenerPlan.findUnique({ where: { gardenerId } });
        if (!record) {
            await this.prisma.gardenerPlan.create({ data: { gardenerId, plan: client_1.GardenerSubscriptionPlan.FREE } });
            return { plan: client_1.GardenerSubscriptionPlan.FREE, endDate: null, isExpired: false, inGrace: false, expiringSoon: false, daysUntilExpiry: null };
        }
        if (record.plan === client_1.GardenerSubscriptionPlan.FREE) {
            return { plan: client_1.GardenerSubscriptionPlan.FREE, endDate: null, isExpired: false, inGrace: false, expiringSoon: false, daysUntilExpiry: null };
        }
        const now = new Date();
        if (record.endDate && record.endDate >= now) {
            const daysUntilExpiry = Math.ceil((record.endDate.getTime() - now.getTime()) / DAY_MS);
            return {
                plan: record.plan,
                endDate: record.endDate,
                isExpired: false,
                inGrace: false,
                expiringSoon: daysUntilExpiry <= exports.EXPIRY_WARNING_DAYS,
                daysUntilExpiry,
            };
        }
        const anchorExpiry = record.expiredAt ?? record.endDate ?? now;
        if (!record.expiredAt) {
            await this.prisma.gardenerPlan.update({ where: { gardenerId }, data: { expiredAt: anchorExpiry } });
        }
        const graceEndsAt = new Date(anchorExpiry.getTime() + exports.GRACE_PERIOD_DAYS * DAY_MS);
        if (now <= graceEndsAt) {
            return { plan: record.plan, endDate: record.endDate, isExpired: true, inGrace: true, expiringSoon: false, daysUntilExpiry: 0 };
        }
        const renewCutoff = new Date(anchorExpiry.getTime() + RENEW_CUTOFF_MS);
        if (now <= renewCutoff) {
            return { plan: client_1.GardenerSubscriptionPlan.FREE, endDate: null, isExpired: true, inGrace: false, expiringSoon: false, daysUntilExpiry: null };
        }
        await this.prisma.$transaction([
            this.prisma.gardenerPlan.update({
                where: { gardenerId },
                data: { plan: client_1.GardenerSubscriptionPlan.FREE, endDate: null, expiredAt: null, couponId: null },
            }),
            this.prisma.advisorAssignment.updateMany({
                where: { farmerId: gardenerId, status: client_1.AdvisorAssignmentStatus.ACTIVE },
                data: { status: client_1.AdvisorAssignmentStatus.REVOKED, endDate: now },
            }),
        ]);
        return { plan: client_1.GardenerSubscriptionPlan.FREE, endDate: null, isExpired: true, inGrace: false, expiringSoon: false, daysUntilExpiry: null };
    }
    async getMyPlan(user) {
        const effective = await this.getEffectivePlan(user.id);
        const record = await this.prisma.gardenerPlan.findUnique({ where: { gardenerId: user.id } });
        return {
            gardenerId: user.id,
            ...effective,
            hasUsedVipTrial: record?.hasUsedVipTrial ?? false,
            trialStartedAt: record?.trialStartedAt ?? null,
            limits: effective.plan === client_1.GardenerSubscriptionPlan.FREE
                ? { maxPlants: exports.FREE_PLAN_MAX_PLANTS, advisorIncluded: false }
                : { maxPlants: null, advisorIncluded: true },
        };
    }
    renewalBaseDate(currentPlan, now) {
        if (currentPlan?.endDate && currentPlan.endDate > now)
            return currentPlan.endDate;
        if (currentPlan?.expiredAt && now.getTime() - currentPlan.expiredAt.getTime() <= RENEW_CUTOFF_MS) {
            return currentPlan.expiredAt;
        }
        return now;
    }
    async previewCoupon(user, code) {
        const coupon = await this.resolveCoupon(code, user.id);
        const now = new Date();
        const currentPlan = await this.prisma.gardenerPlan.findUnique({ where: { gardenerId: user.id } });
        const baseDate = this.renewalBaseDate(currentPlan, now);
        const newEndDate = new Date(baseDate.getTime() + coupon.daysGranted * DAY_MS);
        return {
            code: coupon.code,
            plan: coupon.plan,
            daysGranted: coupon.daysGranted,
            currentPlan: currentPlan?.plan ?? client_1.GardenerSubscriptionPlan.FREE,
            newEndDate,
            extendsExisting: baseDate.getTime() !== now.getTime(),
        };
    }
    async redeemCoupon(user, dto) {
        const coupon = await this.resolveCoupon(dto.code, user.id);
        const now = new Date();
        const currentPlan = await this.prisma.gardenerPlan.findUnique({ where: { gardenerId: user.id } });
        const baseDate = this.renewalBaseDate(currentPlan, now);
        const extended = baseDate.getTime() !== now.getTime();
        const newEndDate = new Date(baseDate.getTime() + coupon.daysGranted * DAY_MS);
        const [updatedPlan] = await this.prisma.$transaction([
            this.prisma.gardenerPlan.upsert({
                where: { gardenerId: user.id },
                create: {
                    gardenerId: user.id,
                    plan: coupon.plan,
                    startDate: now,
                    endDate: newEndDate,
                    couponId: coupon.id,
                },
                update: {
                    plan: coupon.plan,
                    startDate: extended ? currentPlan.startDate : now,
                    endDate: newEndDate,
                    expiredAt: null,
                    couponId: coupon.id,
                },
            }),
            this.prisma.gardenerPlanCoupon.update({
                where: { id: coupon.id },
                data: { isUsed: true, usedAt: now, usedByGardenerId: user.id },
            }),
        ]);
        return { plan: updatedPlan, daysGranted: coupon.daysGranted, newEndDate, extended };
    }
    async createCoupon(admin, dto) {
        if (dto.assignedGardenerId) {
            const gardener = await this.prisma.user.findFirst({
                where: { id: dto.assignedGardenerId, roles: { has: client_1.Role.GARDENER }, deletedAt: null },
            });
            if (!gardener)
                throw new common_1.NotFoundException('Gardener not found.');
        }
        let code = generateCode();
        while (await this.prisma.gardenerPlanCoupon.findUnique({ where: { code } })) {
            code = generateCode();
        }
        return this.prisma.gardenerPlanCoupon.create({
            data: {
                code,
                plan: dto.plan,
                daysGranted: dto.daysGranted,
                assignedGardenerId: dto.assignedGardenerId,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
                createdById: admin.id,
            },
        });
    }
    listAllCoupons() {
        return this.prisma.gardenerPlanCoupon.findMany({
            include: {
                assignedGardener: { select: { id: true, name: true, mobile: true } },
                usedByGardener: { select: { id: true, name: true, mobile: true } },
                createdBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    listAllGardenerPlans() {
        return this.prisma.gardenerPlan.findMany({
            include: {
                gardener: { select: { id: true, name: true, mobile: true, kingId: true } },
                coupon: { select: { code: true, plan: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async resolveCoupon(code, gardenerId) {
        const coupon = await this.prisma.gardenerPlanCoupon.findUnique({ where: { code: code.toUpperCase() } });
        if (!coupon)
            throw new common_1.NotFoundException('Invalid coupon code.');
        if (coupon.isUsed)
            throw new common_1.BadRequestException('This coupon has already been used.');
        if (coupon.expiresAt && coupon.expiresAt < new Date()) {
            throw new common_1.BadRequestException('This coupon has expired.');
        }
        if (coupon.assignedGardenerId && coupon.assignedGardenerId !== gardenerId) {
            throw new common_1.ForbiddenException('This coupon is assigned to a different gardener.');
        }
        return coupon;
    }
    async initiatePayment(user, plan) {
        if (plan === client_1.GardenerSubscriptionPlan.FREE) {
            throw new common_1.BadRequestException('Cannot purchase FREE plan.');
        }
        const settings = await this.appSettingsService.get();
        const price = plan === client_1.GardenerSubscriptionPlan.VIP ? settings.gardenerVipCardPrice : settings.gardenerProCardPrice;
        const request = await this.prisma.gardenerPlanPaymentRequest.create({
            data: {
                gardenerId: user.id,
                plan,
                amount: price,
            },
        });
        const orderId = `GCARD-${request.id}`;
        const cfOrder = await this.cashfreeService.createStandardOrder({
            orderId,
            amount: Number(price),
            customerId: user.id,
            customerPhone: user.mobile,
            customerName: user.name || 'Gardener',
        });
        return { paymentSessionId: cfOrder.paymentSessionId, orderId };
    }
    async activateVipTrial(user) {
        const existing = await this.prisma.gardenerPlan.findUnique({ where: { gardenerId: user.id } });
        if (existing?.hasUsedVipTrial) {
            throw new common_1.BadRequestException('VIP Trial ਪਹਿਲਾਂ ਹੀ ਵਰਤਿਆ ਜਾ ਚੁੱਕਾ ਹੈ। ਹੁਣ PRO ਜਾਂ VIP Card ਖਰੀਦੋ।');
        }
        if (existing?.plan === client_1.GardenerSubscriptionPlan.VIP && existing.endDate && existing.endDate > new Date()) {
            throw new common_1.BadRequestException('ਤੁਹਾਡੇ ਕੋਲ ਪਹਿਲਾਂ ਹੀ ਐਕਟਿਵ VIP Plan ਹੈ।');
        }
        const now = new Date();
        const trialEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await this.prisma.gardenerPlan.upsert({
            where: { gardenerId: user.id },
            create: {
                gardenerId: user.id,
                plan: client_1.GardenerSubscriptionPlan.VIP,
                startDate: now,
                endDate: trialEndDate,
                hasUsedVipTrial: true,
                trialStartedAt: now,
            },
            update: {
                plan: client_1.GardenerSubscriptionPlan.VIP,
                startDate: now,
                endDate: trialEndDate,
                expiredAt: null,
                hasUsedVipTrial: true,
                trialStartedAt: now,
            },
        });
        return {
            success: true,
            plan: client_1.GardenerSubscriptionPlan.VIP,
            trialEndDate,
            message: '🎉 VIP Trial 30 ਦਿਨਾਂ ਲਈ ਐਕਟਿਵ ਹੋ ਗਿਆ!',
        };
    }
};
exports.GardenerPlansService = GardenerPlansService;
exports.GardenerPlansService = GardenerPlansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_settings_service_1.AppSettingsService,
        cashfree_service_1.CashfreeService])
], GardenerPlansService);
//# sourceMappingURL=gardener-plans.service.js.map