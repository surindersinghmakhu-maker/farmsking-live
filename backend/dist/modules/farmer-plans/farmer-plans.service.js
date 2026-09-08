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
exports.FarmerPlansService = exports.RENEW_HISTORY_MONTHS = exports.GRACE_PERIOD_DAYS = exports.EXPIRY_WARNING_DAYS = exports.PLAN_RANK = exports.PREMIUM_PLAN_MAX_ADVISOR_CROPS = exports.STANDARD_PLAN_MAX_ADVISOR_CROPS = exports.FREE_PLAN_MAX_ACTIVE_CROPS = exports.FREE_PLAN_MAX_CROPS = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const advisor_assignment_service_1 = require("../advisor-assignment/advisor-assignment.service");
const wallet_service_1 = require("../wallet/wallet.service");
const auth_user_util_1 = require("../../common/utils/auth-user.util");
exports.FREE_PLAN_MAX_CROPS = 3;
exports.FREE_PLAN_MAX_ACTIVE_CROPS = 3;
exports.STANDARD_PLAN_MAX_ADVISOR_CROPS = 5;
exports.PREMIUM_PLAN_MAX_ADVISOR_CROPS = 10;
exports.PLAN_RANK = {
    FREE: 0,
    PRO: 1,
    SMART: 2,
    SUPER: 3,
    BASIC: 0,
    SILVER: 1,
    GOLD: 2,
    PLATINUM: 3,
    DIAMOND: 4,
    ROYAL: 5,
};
exports.EXPIRY_WARNING_DAYS = 5;
exports.GRACE_PERIOD_DAYS = 2;
exports.RENEW_HISTORY_MONTHS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const RENEW_CUTOFF_MS = exports.RENEW_HISTORY_MONTHS * 30 * DAY_MS;
const ALPHANUMERIC_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function generateCode(plan) {
    const prefix = plan === client_1.FarmerSubscriptionPlan.PRO ? 'KC-LITE' : plan === client_1.FarmerSubscriptionPlan.SMART ? 'KC-PRO' : plan === client_1.FarmerSubscriptionPlan.SUPER ? 'KC-SUPER' : 'KC-FREE';
    const digits = (0, crypto_1.randomBytes)(4).readUInt32BE(0) % 1_000_000;
    return `${prefix}-${digits.toString().padStart(6, '0')}`;
}
let FarmerPlansService = class FarmerPlansService {
    prisma;
    advisorAssignmentService;
    walletService;
    constructor(prisma, advisorAssignmentService, walletService) {
        this.prisma = prisma;
        this.advisorAssignmentService = advisorAssignmentService;
        this.walletService = walletService;
    }
    async onModuleInit() {
        await this.ensureDefaultPricing();
    }
    async ensureDefaultPricing() {
        const defaults = [
            { plan: client_1.FarmerSubscriptionPlan.PRO, price: 199, billingPeriodDays: 180, partnerShareType: client_1.DiscountValueType.PERCENTAGE, partnerShareValue: 10, maxActiveCrops: null, advisorIncluded: false },
            { plan: client_1.FarmerSubscriptionPlan.PRO, price: 299, billingPeriodDays: 365, partnerShareType: client_1.DiscountValueType.PERCENTAGE, partnerShareValue: 10, maxActiveCrops: null, advisorIncluded: false },
            { plan: client_1.FarmerSubscriptionPlan.SMART, price: 499, billingPeriodDays: 30, partnerShareType: client_1.DiscountValueType.PERCENTAGE, partnerShareValue: 10, maxActiveCrops: 5, advisorIncluded: true },
            { plan: client_1.FarmerSubscriptionPlan.SMART, price: 1299, billingPeriodDays: 90, partnerShareType: client_1.DiscountValueType.PERCENTAGE, partnerShareValue: 10, maxActiveCrops: 5, advisorIncluded: true },
            { plan: client_1.FarmerSubscriptionPlan.SMART, price: 2299, billingPeriodDays: 180, partnerShareType: client_1.DiscountValueType.PERCENTAGE, partnerShareValue: 10, maxActiveCrops: 5, advisorIncluded: true },
            { plan: client_1.FarmerSubscriptionPlan.SMART, price: 3999, billingPeriodDays: 365, partnerShareType: client_1.DiscountValueType.PERCENTAGE, partnerShareValue: 10, maxActiveCrops: 5, advisorIncluded: true },
            { plan: client_1.FarmerSubscriptionPlan.SUPER, price: 999, billingPeriodDays: 30, partnerShareType: client_1.DiscountValueType.PERCENTAGE, partnerShareValue: 10, maxActiveCrops: null, advisorIncluded: true },
            { plan: client_1.FarmerSubscriptionPlan.SUPER, price: 2699, billingPeriodDays: 90, partnerShareType: client_1.DiscountValueType.PERCENTAGE, partnerShareValue: 10, maxActiveCrops: null, advisorIncluded: true },
            { plan: client_1.FarmerSubscriptionPlan.SUPER, price: 4999, billingPeriodDays: 180, partnerShareType: client_1.DiscountValueType.PERCENTAGE, partnerShareValue: 10, maxActiveCrops: null, advisorIncluded: true },
            { plan: client_1.FarmerSubscriptionPlan.SUPER, price: 8999, billingPeriodDays: 365, partnerShareType: client_1.DiscountValueType.PERCENTAGE, partnerShareValue: 10, maxActiveCrops: null, advisorIncluded: true },
        ];
        for (const d of defaults) {
            const existing = await this.prisma.farmerPlanPricing.findUnique({
                where: { plan_billingPeriodDays: { plan: d.plan, billingPeriodDays: d.billingPeriodDays } },
            });
            if (!existing) {
                await this.prisma.farmerPlanPricing.create({
                    data: {
                        plan: d.plan,
                        price: d.price,
                        billingPeriodDays: d.billingPeriodDays,
                        partnerShareType: d.partnerShareType,
                        partnerShareValue: d.partnerShareValue,
                        maxActiveCrops: d.maxActiveCrops,
                        advisorIncluded: d.advisorIncluded,
                    },
                });
            }
        }
    }
    async getEffectivePlan(farmerId) {
        const record = await this.prisma.farmerPlan.findUnique({ where: { farmerId } });
        if (!record) {
            await this.prisma.farmerPlan.create({ data: { farmerId, plan: client_1.FarmerSubscriptionPlan.FREE } });
            return { plan: client_1.FarmerSubscriptionPlan.FREE, startDate: null, endDate: null, isExpired: false, inGrace: false, expiringSoon: false, daysUntilExpiry: null };
        }
        if (record.plan === client_1.FarmerSubscriptionPlan.FREE) {
            return { plan: client_1.FarmerSubscriptionPlan.FREE, startDate: null, endDate: null, isExpired: false, inGrace: false, expiringSoon: false, daysUntilExpiry: null };
        }
        const now = new Date();
        if (record.endDate && record.endDate >= now) {
            const daysUntilExpiry = Math.ceil((record.endDate.getTime() - now.getTime()) / DAY_MS);
            return {
                plan: record.plan,
                startDate: record.startDate,
                endDate: record.endDate,
                isExpired: false,
                inGrace: false,
                expiringSoon: daysUntilExpiry <= exports.EXPIRY_WARNING_DAYS,
                daysUntilExpiry,
            };
        }
        const anchorExpiry = record.expiredAt ?? record.endDate ?? now;
        if (!record.expiredAt) {
            await this.prisma.farmerPlan.update({ where: { farmerId }, data: { expiredAt: anchorExpiry } });
        }
        const graceEndsAt = new Date(anchorExpiry.getTime() + exports.GRACE_PERIOD_DAYS * DAY_MS);
        if (now <= graceEndsAt) {
            return { plan: record.plan, startDate: record.startDate, endDate: record.endDate, isExpired: true, inGrace: true, expiringSoon: false, daysUntilExpiry: 0 };
        }
        const renewCutoff = new Date(anchorExpiry.getTime() + RENEW_CUTOFF_MS);
        if (now <= renewCutoff) {
            await this.trimAdvisorCropsToCap(farmerId, null);
            return { plan: client_1.FarmerSubscriptionPlan.FREE, startDate: null, endDate: null, isExpired: true, inGrace: false, expiringSoon: false, daysUntilExpiry: null };
        }
        await this.prisma.$transaction([
            this.prisma.farmerPlan.update({
                where: { farmerId },
                data: { plan: client_1.FarmerSubscriptionPlan.FREE, endDate: null, expiredAt: null, couponId: null },
            }),
            this.prisma.advisorAssignment.updateMany({
                where: { farmerId, status: client_1.AdvisorAssignmentStatus.ACTIVE },
                data: { status: client_1.AdvisorAssignmentStatus.REVOKED, endDate: now },
            }),
        ]);
        await this.trimAdvisorCropsToCap(farmerId, null);
        return { plan: client_1.FarmerSubscriptionPlan.FREE, startDate: null, endDate: null, isExpired: true, inGrace: false, expiringSoon: false, daysUntilExpiry: null };
    }
    async trimAdvisorCropsToCap(farmerId, newCap) {
        const activeAdvisorCrops = await this.prisma.cropCycle.findMany({
            where: {
                deletedAt: null,
                status: { notIn: [client_1.CropStatus.COMPLETED, client_1.CropStatus.FAILED] },
                advisorReviewStatus: { in: [client_1.CropAdvisorReviewStatus.PENDING, client_1.CropAdvisorReviewStatus.ACCEPTED] },
                plot: { farm: { ownerId: farmerId } },
            },
            orderBy: { submittedToAdvisorAt: 'desc' },
            select: { id: true },
        });
        const toRevert = newCap === null ? activeAdvisorCrops : activeAdvisorCrops.slice(0, Math.max(0, activeAdvisorCrops.length - newCap));
        if (toRevert.length === 0)
            return;
        await this.prisma.cropCycle.updateMany({
            where: { id: { in: toRevert.map((c) => c.id) } },
            data: { advisorReviewStatus: client_1.CropAdvisorReviewStatus.NONE, submittedToAdvisorAt: null, advisorAcceptedAt: null },
        });
    }
    async getMyPlan(user) {
        const effective = await this.getEffectivePlan(user.id);
        const planPricing = await this.prisma.farmerPlanPricing.findFirst({
            where: { plan: effective.plan },
        });
        const maxTotalCrops = planPricing?.maxTotalCrops ?? (effective.plan === client_1.FarmerSubscriptionPlan.FREE ? exports.FREE_PLAN_MAX_CROPS : null);
        const maxActiveCrops = planPricing?.maxActiveCrops ?? (effective.plan === client_1.FarmerSubscriptionPlan.FREE ? exports.FREE_PLAN_MAX_ACTIVE_CROPS : null);
        return {
            farmerId: user.id,
            ...effective,
            limits: {
                maxTotalCrops,
                maxActiveCrops,
                maxAdvisorCrops: null,
                fullCompletedCropDetails: effective.plan !== client_1.FarmerSubscriptionPlan.FREE,
                advisorIncluded: planPricing?.advisorIncluded ?? (effective.plan === client_1.FarmerSubscriptionPlan.SMART || effective.plan === client_1.FarmerSubscriptionPlan.SUPER),
            },
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
    async previewCoupon(user, code, farmerId) {
        const { coupon, targetFarmerId } = await this.resolveCouponAndFarmer(user, code, farmerId);
        const resultPlan = await this.resolveResultPlan(targetFarmerId, coupon.plan);
        const now = new Date();
        const currentPlan = await this.prisma.farmerPlan.findUnique({ where: { farmerId: targetFarmerId } });
        const isSameTierRenewal = currentPlan?.plan === resultPlan;
        const baseDate = isSameTierRenewal ? this.renewalBaseDate(currentPlan, now) : now;
        const newEndDate = new Date(baseDate.getTime() + coupon.daysGranted * DAY_MS);
        return {
            code: coupon.code,
            plan: coupon.plan,
            resultPlan,
            daysGranted: coupon.daysGranted,
            currentPlan: currentPlan?.plan ?? client_1.FarmerSubscriptionPlan.FREE,
            newEndDate,
            extendsExisting: baseDate.getTime() !== now.getTime(),
            includesAdvisor: resultPlan !== client_1.FarmerSubscriptionPlan.FREE,
        };
    }
    async resolveResultPlan(farmerId, couponPlan) {
        const effective = await this.getEffectivePlan(farmerId);
        return exports.PLAN_RANK[couponPlan] < exports.PLAN_RANK[effective.plan] ? effective.plan : couponPlan;
    }
    async redeemCoupon(user, dto) {
        const { coupon, targetFarmerId } = await this.resolveCouponAndFarmer(user, dto.code, dto.farmerId);
        const result = await this.applyPlanChange(targetFarmerId, coupon.plan, coupon.daysGranted, coupon.id, dto.advisorId);
        await this.prisma.farmerPlanCoupon.update({
            where: { id: coupon.id },
            data: { isUsed: true, usedAt: new Date(), usedByFarmerId: targetFarmerId },
        });
        await this.payoutCommissions(coupon, targetFarmerId);
        return result;
    }
    async applyPlanChange(farmerId, targetPlan, daysGranted, couponId, selectedAdvisorId) {
        const resultPlan = await this.resolveResultPlan(farmerId, targetPlan);
        const now = new Date();
        const currentPlan = await this.prisma.farmerPlan.findUnique({ where: { farmerId } });
        const isSameTierRenewal = currentPlan?.plan === resultPlan;
        const baseDate = isSameTierRenewal ? this.renewalBaseDate(currentPlan, now) : now;
        const extended = baseDate.getTime() !== now.getTime();
        const newEndDate = new Date(baseDate.getTime() + daysGranted * DAY_MS);
        const keptHigherPlan = resultPlan !== targetPlan;
        const updatedPlan = await this.prisma.farmerPlan.upsert({
            where: { farmerId },
            create: { farmerId, plan: resultPlan, startDate: now, endDate: newEndDate, couponId },
            update: {
                plan: resultPlan,
                startDate: extended && isSameTierRenewal ? currentPlan.startDate : now,
                endDate: newEndDate,
                expiredAt: null,
                ...(couponId ? { couponId } : {}),
            },
        });
        let advisorHired = false;
        if ([client_1.FarmerSubscriptionPlan.SMART, client_1.FarmerSubscriptionPlan.SUPER].includes(resultPlan)) {
            advisorHired = await this.ensurePremiumAdvisorHire(farmerId, newEndDate, couponId, selectedAdvisorId);
        }
        await this.trimAdvisorCropsToCap(farmerId, null);
        return {
            plan: updatedPlan,
            daysGranted,
            newEndDate,
            extended,
            advisorHired,
            keptHigherPlan,
        };
    }
    async payoutCommissions(coupon, farmerId) {
        const pricing = await this.prisma.farmerPlanPricing.findFirst({ where: { plan: coupon.plan } });
        if (!pricing)
            return;
        const ratio = coupon.daysGranted / pricing.billingPeriodDays;
        const farmer = await this.prisma.user.findUnique({ where: { id: farmerId }, select: { name: true, kingId: true } });
        const farmerLabel = farmer ? `${farmer.name}${farmer.kingId ? ` (ID: ${farmer.kingId})` : ''}` : 'a farmer';
        const isAdminIssuedFarmerCoupon = coupon.createdByRole === client_1.Role.SUPER_ADMIN && (coupon.category === client_1.PlanCouponCategory.FARMER_PLAN || !coupon.category);
        if (coupon.assignedBusinessPartnerId && !isAdminIssuedFarmerCoupon) {
            const partnerAmount = pricing.partnerShareType === client_1.DiscountValueType.PERCENTAGE
                ? (Number(pricing.price) * Number(pricing.partnerShareValue)) / 100
                : Number(pricing.partnerShareValue);
            const proratedAmount = Math.round(partnerAmount * ratio * 100) / 100;
            if (proratedAmount > 0) {
                await this.walletService.credit(coupon.assignedBusinessPartnerId, proratedAmount, `Commission for ${coupon.plan} plan coupon ${coupon.code} — redeemed by ${farmerLabel} on ${new Date().toLocaleDateString('en-IN')}`, { relatedUserId: farmerId });
                if (coupon.id) {
                    await this.prisma.farmerPlanCoupon.update({
                        where: { id: coupon.id },
                        data: { payoutAmount: proratedAmount, payoutRecipientId: coupon.assignedBusinessPartnerId },
                    });
                }
            }
        }
        if (pricing.advisorShareValue) {
            const assignment = await this.prisma.advisorAssignment.findFirst({
                where: { farmerId, status: client_1.AdvisorAssignmentStatus.ACTIVE },
            });
            const advisorTargetId = coupon.assignedAdvisorId || assignment?.advisorId;
            if (advisorTargetId) {
                const proratedAmount = Math.round(Number(pricing.advisorShareValue) * ratio * 100) / 100;
                if (proratedAmount > 0) {
                    await this.walletService.credit(advisorTargetId, proratedAmount, `Advisor share for ${coupon.plan} plan coupon ${coupon.code} — redeemed by ${farmerLabel} on ${new Date().toLocaleDateString('en-IN')}`, { relatedUserId: farmerId });
                    if (coupon.id) {
                        await this.prisma.farmerPlanCoupon.update({
                            where: { id: coupon.id },
                            data: { payoutAmount: proratedAmount, payoutRecipientId: advisorTargetId },
                        });
                    }
                }
            }
        }
    }
    getPricing() {
        return this.prisma.farmerPlanPricing.findMany({ orderBy: { price: 'asc' } });
    }
    async updatePricing(admin, plan, dto) {
        if (dto.billingPeriodDays != null && Number(dto.billingPeriodDays) > 0) {
            const days = Number(dto.billingPeriodDays);
            return this.prisma.farmerPlanPricing.upsert({
                where: { plan_billingPeriodDays: { plan, billingPeriodDays: days } },
                create: {
                    plan,
                    billingPeriodDays: days,
                    price: dto.price ?? 0,
                    partnerShareType: dto.partnerShareType ?? client_1.DiscountValueType.PERCENTAGE,
                    partnerShareValue: dto.partnerShareValue ?? 10,
                    advisorShareValue: dto.advisorShareValue,
                    adminShareValue: dto.adminShareValue,
                    partnerGenerationCostPercent: dto.partnerGenerationCostPercent,
                    advisorGenerationCostPercent: dto.advisorGenerationCostPercent,
                    maxTotalCrops: dto.maxTotalCrops,
                    maxActiveCrops: dto.maxActiveCrops,
                    advisorIncluded: dto.advisorIncluded ?? true,
                    chatEnabled: dto.chatEnabled ?? true,
                    weatherEnabled: dto.weatherEnabled ?? true,
                    isActive: dto.isActive ?? true,
                    updatedById: admin.id,
                },
                update: {
                    ...(dto.price !== undefined ? { price: dto.price } : {}),
                    ...(dto.partnerShareType !== undefined ? { partnerShareType: dto.partnerShareType } : {}),
                    ...(dto.partnerShareValue !== undefined ? { partnerShareValue: dto.partnerShareValue } : {}),
                    ...(dto.advisorShareValue !== undefined ? { advisorShareValue: dto.advisorShareValue } : {}),
                    ...(dto.adminShareValue !== undefined ? { adminShareValue: dto.adminShareValue } : {}),
                    ...(dto.partnerGenerationCostPercent !== undefined ? { partnerGenerationCostPercent: dto.partnerGenerationCostPercent } : {}),
                    ...(dto.advisorGenerationCostPercent !== undefined ? { advisorGenerationCostPercent: dto.advisorGenerationCostPercent } : {}),
                    ...(dto.maxTotalCrops !== undefined ? { maxTotalCrops: dto.maxTotalCrops } : {}),
                    ...(dto.maxActiveCrops !== undefined ? { maxActiveCrops: dto.maxActiveCrops } : {}),
                    ...(dto.advisorIncluded !== undefined ? { advisorIncluded: dto.advisorIncluded } : {}),
                    ...(dto.chatEnabled !== undefined ? { chatEnabled: dto.chatEnabled } : {}),
                    ...(dto.weatherEnabled !== undefined ? { weatherEnabled: dto.weatherEnabled } : {}),
                    ...(dto.gardenAdvisorIncluded !== undefined ? { gardenAdvisorIncluded: dto.gardenAdvisorIncluded } : {}),
                    ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
                    updatedById: admin.id,
                },
            });
        }
        await this.prisma.farmerPlanPricing.updateMany({
            where: { plan },
            data: {
                ...(dto.price !== undefined ? { price: dto.price } : {}),
                ...(dto.partnerShareType !== undefined ? { partnerShareType: dto.partnerShareType } : {}),
                ...(dto.partnerShareValue !== undefined ? { partnerShareValue: dto.partnerShareValue } : {}),
                ...(dto.advisorShareValue !== undefined ? { advisorShareValue: dto.advisorShareValue } : {}),
                ...(dto.adminShareValue !== undefined ? { adminShareValue: dto.adminShareValue } : {}),
                ...(dto.partnerGenerationCostPercent !== undefined ? { partnerGenerationCostPercent: dto.partnerGenerationCostPercent } : {}),
                ...(dto.advisorGenerationCostPercent !== undefined ? { advisorGenerationCostPercent: dto.advisorGenerationCostPercent } : {}),
                ...(dto.maxTotalCrops !== undefined ? { maxTotalCrops: dto.maxTotalCrops } : {}),
                ...(dto.maxActiveCrops !== undefined ? { maxActiveCrops: dto.maxActiveCrops } : {}),
                ...(dto.advisorIncluded !== undefined ? { advisorIncluded: dto.advisorIncluded } : {}),
                ...(dto.chatEnabled !== undefined ? { chatEnabled: dto.chatEnabled } : {}),
                ...(dto.weatherEnabled !== undefined ? { weatherEnabled: dto.weatherEnabled } : {}),
                ...(dto.gardenAdvisorIncluded !== undefined ? { gardenAdvisorIncluded: dto.gardenAdvisorIncluded } : {}),
                ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
                updatedById: admin.id,
            },
        });
        return this.prisma.farmerPlanPricing.findFirst({ where: { plan } });
    }
    async deletePricing(admin, id) {
        const item = await this.prisma.farmerPlanPricing.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('Plan pricing rate not found.');
        return this.prisma.farmerPlanPricing.delete({ where: { id } });
    }
    async ensurePremiumAdvisorHire(farmerId, endDate, couponId, selectedAdvisorId) {
        const existingSubscription = await this.prisma.advisorSubscription.findFirst({
            where: { farmerId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });
        if (existingSubscription) {
            await this.prisma.advisorSubscription.update({
                where: { id: existingSubscription.id },
                data: { status: 'ACTIVE', endDate },
            });
        }
        const existingAssignment = await this.prisma.advisorAssignment.findFirst({
            where: { farmerId, status: { in: [client_1.AdvisorAssignmentStatus.ACTIVE, client_1.AdvisorAssignmentStatus.PENDING] }, deletedAt: null },
        });
        if (existingAssignment) {
            return true;
        }
        let targetAdvisorId = selectedAdvisorId ?? null;
        if (!targetAdvisorId && couponId) {
            const coupon = await this.prisma.farmerPlanCoupon.findUnique({
                where: { id: couponId },
                select: { assignedAdvisorId: true },
            });
            if (coupon?.assignedAdvisorId) {
                targetAdvisorId = coupon.assignedAdvisorId;
            }
        }
        if (!targetAdvisorId) {
            try {
                const availableAdvisors = await this.prisma.user.findMany({
                    where: {
                        OR: [{ role: client_1.Role.ADVISOR }, { roles: { has: client_1.Role.ADVISOR } }],
                        deletedAt: null,
                    },
                    select: {
                        id: true,
                        _count: { select: { advisorAssignmentsAsAdvisor: { where: { status: client_1.AdvisorAssignmentStatus.ACTIVE } } } },
                    },
                    orderBy: { createdAt: 'asc' },
                });
                if (availableAdvisors.length > 0) {
                    availableAdvisors.sort((a, b) => a._count.advisorAssignmentsAsAdvisor - b._count.advisorAssignmentsAsAdvisor);
                    targetAdvisorId = availableAdvisors[0].id;
                }
            }
            catch {
            }
        }
        if (targetAdvisorId) {
            try {
                await this.advisorAssignmentService.requestSpecificAdvisor(farmerId, targetAdvisorId);
                return true;
            }
            catch {
            }
        }
        return false;
    }
    async chooseAdvisor(user, advisorId) {
        const effective = await this.getEffectivePlan(user.id);
        if (effective.plan === client_1.FarmerSubscriptionPlan.FREE) {
            throw new common_1.BadRequestException('Upgrade to the PRO plan to choose your advisor.');
        }
        const advisor = await this.prisma.user.findFirst({
            where: { id: advisorId, roles: { has: client_1.Role.ADVISOR }, advisorType: client_1.AdvisorType.FARM, deletedAt: null },
        });
        if (!advisor) {
            throw new common_1.NotFoundException('Advisor not found.');
        }
        return this.advisorAssignmentService.requestSpecificAdvisor(user.id, advisorId);
    }
    async grantDaysDirectly(dto) {
        const { farmerId, daysGranted, plan: selectedPlan, advisorId } = dto;
        const farmer = await this.prisma.user.findFirst({ where: { id: farmerId, deletedAt: null } });
        if (!farmer)
            throw new common_1.NotFoundException('Farmer not found.');
        const currentPlan = await this.prisma.farmerPlan.findUnique({ where: { farmerId } });
        const targetPlan = selectedPlan ?? currentPlan?.plan ?? client_1.FarmerSubscriptionPlan.PRO;
        if (targetPlan === client_1.FarmerSubscriptionPlan.FREE) {
            throw new common_1.BadRequestException('Select a paid plan tier to activate.');
        }
        const result = await this.applyPlanChange(farmerId, targetPlan, daysGranted, undefined, advisorId);
        if (advisorId) {
            const pricing = await this.prisma.farmerPlanPricing.findFirst({ where: { plan: targetPlan } });
            if (pricing && pricing.advisorShareValue) {
                const ratio = daysGranted / pricing.billingPeriodDays;
                const proratedAmount = Math.round(Number(pricing.advisorShareValue) * ratio * 100) / 100;
                if (proratedAmount > 0) {
                    const farmerLabel = `${farmer.name}${farmer.kingId ? ` (ID: ${farmer.kingId})` : ''}`;
                    await this.walletService.credit(advisorId, proratedAmount, `Advisor share for direct ${targetPlan} plan activation — farmer ${farmerLabel} on ${new Date().toLocaleDateString('en-IN')}`, { relatedUserId: farmerId });
                }
            }
        }
        return result;
    }
    async applyCouponToFarmerDirectly(user, dto) {
        const { coupon, targetFarmerId } = await this.resolveCouponAndFarmer(user, dto.code, dto.farmerId);
        const result = await this.applyPlanChange(targetFarmerId, coupon.plan, coupon.daysGranted, coupon.id, user.role === client_1.Role.ADVISOR ? user.id : undefined);
        await this.prisma.farmerPlanCoupon.update({
            where: { id: coupon.id },
            data: { isUsed: true, usedAt: new Date(), usedByFarmerId: targetFarmerId },
        });
        await this.payoutCommissions(coupon, targetFarmerId);
        return result;
    }
    async createCoupon(admin, dto) {
        if (dto.plan === client_1.FarmerSubscriptionPlan.FREE) {
            throw new common_1.BadRequestException('Cannot create a coupon for the FREE plan.');
        }
        const lockTargets = [dto.assignedFarmerId, dto.assignedAdvisorId, dto.assignedBusinessPartnerId].filter(Boolean);
        if (lockTargets.length > 1) {
            throw new common_1.BadRequestException('Lock a coupon to only one of: a farmer, an advisor, or a business partner.');
        }
        let targetPartnerName = 'Partner';
        if (dto.assignedFarmerId) {
            const farmer = await this.prisma.user.findFirst({
                where: { id: dto.assignedFarmerId, roles: { has: client_1.Role.FARMER }, deletedAt: null },
            });
            if (!farmer)
                throw new common_1.NotFoundException('Farmer not found.');
        }
        if (dto.assignedAdvisorId) {
            const advisor = await this.prisma.user.findFirst({
                where: { id: dto.assignedAdvisorId, roles: { has: client_1.Role.ADVISOR }, deletedAt: null },
            });
            if (!advisor)
                throw new common_1.NotFoundException('Advisor not found.');
            targetPartnerName = advisor.name;
        }
        if (dto.assignedBusinessPartnerId) {
            const partner = await this.prisma.user.findFirst({
                where: { id: dto.assignedBusinessPartnerId, roles: { has: client_1.Role.BUSINESS_PARTNER }, deletedAt: null },
            });
            if (!partner)
                throw new common_1.NotFoundException('Business partner not found.');
            targetPartnerName = partner.name;
        }
        const pricing = await this.prisma.farmerPlanPricing.findFirst({ where: { plan: dto.plan } });
        const ratio = pricing ? dto.daysGranted / pricing.billingPeriodDays : 0;
        const basePrice = pricing ? Number(pricing.price) * ratio : 0;
        let debitAmount = 0;
        if (pricing && (dto.assignedAdvisorId || dto.assignedBusinessPartnerId)) {
            let platformFee = pricing.adminShareValue != null ? Number(pricing.adminShareValue) * ratio : 0;
            if (platformFee <= 0) {
                if (dto.assignedBusinessPartnerId) {
                    const cut = pricing.partnerShareType === client_1.DiscountValueType.PERCENTAGE
                        ? (basePrice * Number(pricing.partnerShareValue)) / 100
                        : Number(pricing.partnerShareValue || 0) * ratio;
                    platformFee = Math.max(0, basePrice - cut);
                }
                else {
                    const cut = Number(pricing.advisorShareValue || 0) * ratio;
                    platformFee = Math.max(0, basePrice - cut);
                }
            }
            debitAmount = Math.max(0, Math.round(platformFee * 100) / 100);
        }
        const debitAssigneeId = dto.assignedAdvisorId || dto.assignedBusinessPartnerId || null;
        const quantity = dto.quantity ?? 1;
        const category = dto.category ?? (dto.assignedAdvisorId ? client_1.PlanCouponCategory.ADVISOR_PLAN : client_1.PlanCouponCategory.FARMER_PLAN);
        const created = [];
        for (let i = 0; i < quantity; i += 1) {
            let code = generateCode(dto.plan);
            while (await this.prisma.farmerPlanCoupon.findUnique({ where: { code } })) {
                code = generateCode(dto.plan);
            }
            const coupon = await this.prisma.farmerPlanCoupon.create({
                data: {
                    code,
                    category,
                    plan: dto.plan,
                    daysGranted: dto.daysGranted,
                    assignedFarmerId: dto.assignedFarmerId,
                    assignedAdvisorId: dto.assignedAdvisorId,
                    assignedBusinessPartnerId: dto.assignedBusinessPartnerId,
                    expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
                    createdById: admin.id,
                    createdByRole: admin.role,
                    generationCostAmount: debitAmount > 0 ? debitAmount : null,
                },
            });
            if (debitAssigneeId && debitAmount > 0) {
                await this.walletService.debit(debitAssigneeId, debitAmount, `Net cost for ${dto.plan} plan coupon ${coupon.code} (issued by Admin)`, { relatedUserId: admin.id });
            }
            created.push(coupon);
        }
        return created;
    }
    async generateOwnCoupon(user, dto) {
        if (dto.plan === client_1.FarmerSubscriptionPlan.FREE) {
            throw new common_1.BadRequestException('Cannot create a coupon for the FREE plan.');
        }
        const userRoles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role];
        const userDeactivated = user.deactivatedRoles ?? [];
        const activeRoles = userRoles.filter((r) => !userDeactivated.includes(r));
        const isAdvisor = activeRoles.includes(client_1.Role.ADVISOR) || activeRoles.includes(client_1.Role.ADMIN) || activeRoles.includes(client_1.Role.SUPER_ADMIN);
        const isPartnerOnly = activeRoles.includes(client_1.Role.BUSINESS_PARTNER) && !isAdvisor;
        if (isPartnerOnly) {
            if (dto.plan === client_1.FarmerSubscriptionPlan.SUPER) {
                throw new common_1.ForbiddenException('Business Partners can generate Lite (PRO) and Pro (SMART) plan coupons only. Please upgrade to Advisor or contact Admin for Smart (SUPER) plan coupons.');
            }
        }
        const quantity = dto.quantity && dto.quantity > 0 ? dto.quantity : 1;
        const pricing = await this.prisma.farmerPlanPricing.findFirst({ where: { plan: dto.plan } });
        const ratio = pricing ? dto.daysGranted / pricing.billingPeriodDays : 0;
        const basePrice = pricing ? Number(pricing.price) * ratio : 0;
        let debitAmount = 0;
        if (pricing) {
            let platformFee = pricing.adminShareValue != null ? Number(pricing.adminShareValue) * ratio : 0;
            if (platformFee <= 0) {
                if (isPartnerOnly) {
                    const cut = pricing.partnerShareType === client_1.DiscountValueType.PERCENTAGE
                        ? (basePrice * Number(pricing.partnerShareValue)) / 100
                        : Number(pricing.partnerShareValue || 0) * ratio;
                    platformFee = Math.max(0, basePrice - cut);
                }
                else {
                    const cut = Number(pricing.advisorShareValue || 0) * ratio;
                    platformFee = Math.max(0, basePrice - cut);
                }
            }
            debitAmount = Math.max(0, Math.round(platformFee * 100) / 100);
        }
        const totalDebit = debitAmount * quantity;
        if (totalDebit > 0) {
            const balance = await this.walletService.getBalance(user.id);
            if (balance < totalDebit) {
                throw new common_1.BadRequestException(`Insufficient Wallet Balance — ${quantity} coupon(s) generate ਕਰਨ ਦੀ ਕੁੱਲ ਲਾਗਤ ₹${totalDebit.toLocaleString('en-IN')} (₹${debitAmount} x ${quantity}) ਹੈ, ਤੁਹਾਡੇ ਵਾਲਿਟ ਵਿੱਚ ₹${balance.toLocaleString('en-IN')} ਹਨ। ਵਾਲਿਟ ਰੀਚਾਰਜ ਕਰੋ।`);
            }
        }
        const created = [];
        for (let i = 0; i < quantity; i += 1) {
            let code = generateCode(dto.plan);
            while (await this.prisma.farmerPlanCoupon.findUnique({ where: { code } })) {
                code = generateCode(dto.plan);
            }
            const coupon = await this.prisma.farmerPlanCoupon.create({
                data: {
                    code,
                    category: isAdvisor ? client_1.PlanCouponCategory.ADVISOR_PLAN : client_1.PlanCouponCategory.FARMER_PLAN,
                    plan: dto.plan,
                    daysGranted: dto.daysGranted,
                    assignedFarmerId: dto.assignedFarmerId,
                    assignedAdvisorId: isAdvisor ? user.id : undefined,
                    assignedBusinessPartnerId: isPartnerOnly ? user.id : dto.assignedBusinessPartnerId,
                    createdById: user.id,
                    createdByRole: user.role,
                    generationCostAmount: debitAmount > 0 ? debitAmount : null,
                },
            });
            if (debitAmount > 0) {
                await this.walletService.debit(user.id, debitAmount, `Generated ${dto.plan} plan coupon ${coupon.code}`);
            }
            created.push(coupon);
        }
        return quantity === 1 ? created[0] : created;
    }
    async deactivateCoupon(id) {
        const coupon = await this.prisma.farmerPlanCoupon.findUnique({ where: { id } });
        if (!coupon)
            throw new common_1.NotFoundException('Coupon not found.');
        if (coupon.isUsed)
            throw new common_1.BadRequestException('This coupon has already been redeemed — nothing to deactivate.');
        return this.prisma.farmerPlanCoupon.update({
            where: { id },
            data: { isUsed: true, usedAt: new Date() },
        });
    }
    listMineForAdvisor(user) {
        return this.prisma.farmerPlanCoupon.findMany({
            where: { assignedAdvisorId: user.id },
            orderBy: { createdAt: 'desc' },
        });
    }
    listMineForBusinessPartner(user) {
        return this.prisma.farmerPlanCoupon.findMany({
            where: { assignedBusinessPartnerId: user.id },
            orderBy: { createdAt: 'desc' },
        });
    }
    listAllCoupons() {
        return this.prisma.farmerPlanCoupon.findMany({
            include: {
                assignedFarmer: { select: { id: true, name: true, mobile: true } },
                assignedAdvisor: { select: { id: true, name: true, mobile: true } },
                assignedBusinessPartner: { select: { id: true, name: true, mobile: true } },
                usedByFarmer: { select: { id: true, name: true, mobile: true } },
                createdBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getCouponFinancialSummary() {
        const coupons = await this.prisma.farmerPlanCoupon.findMany({
            include: {
                createdBy: { select: { id: true, name: true, role: true } },
                usedByFarmer: { select: { id: true, name: true, kingId: true } },
            },
        });
        const pricings = await this.prisma.farmerPlanPricing.findMany();
        let directAdminIncome = 0;
        let partnerDebitsCollected = 0;
        let advisorPlatformFeesCollected = 0;
        for (const c of coupons) {
            const cost = Number(c.generationCostAmount || 0);
            if (cost > 0) {
                if (c.createdByRole === client_1.Role.BUSINESS_PARTNER) {
                    partnerDebitsCollected += cost;
                }
                else if (c.createdByRole === client_1.Role.ADVISOR) {
                    advisorPlatformFeesCollected += cost;
                }
            }
            if (c.isUsed && c.createdByRole === client_1.Role.SUPER_ADMIN) {
                const pricing = pricings.find((p) => p.plan === c.plan);
                if (pricing) {
                    const ratio = c.daysGranted / pricing.billingPeriodDays;
                    const val = Math.round(Number(pricing.price) * ratio * 100) / 100;
                    directAdminIncome += val;
                }
            }
        }
        const totalCouponIncome = directAdminIncome + partnerDebitsCollected + advisorPlatformFeesCollected;
        return {
            directAdminIncome: Math.round(directAdminIncome * 100) / 100,
            partnerDebitsCollected: Math.round(partnerDebitsCollected * 100) / 100,
            advisorPlatformFeesCollected: Math.round(advisorPlatformFeesCollected * 100) / 100,
            totalCouponIncome: Math.round(totalCouponIncome * 100) / 100,
            totalCouponsCount: coupons.length,
            usedCouponsCount: coupons.filter((c) => c.isUsed).length,
            unusedCouponsCount: coupons.filter((c) => !c.isUsed).length,
        };
    }
    listAllFarmerPlans() {
        return this.prisma.farmerPlan.findMany({
            include: {
                farmer: { select: { id: true, name: true, mobile: true, kingId: true } },
                coupon: { select: { code: true, plan: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async resolveCouponAndFarmer(user, code, farmerId) {
        const coupon = await this.prisma.farmerPlanCoupon.findUnique({
            where: { code: code.toUpperCase() },
        });
        if (!coupon)
            throw new common_1.NotFoundException('Invalid coupon code.');
        if (coupon.isUsed)
            throw new common_1.BadRequestException('This coupon has already been used.');
        if (coupon.expiresAt && coupon.expiresAt < new Date()) {
            throw new common_1.BadRequestException('This coupon has expired.');
        }
        const targetFarmerId = farmerId ?? ((0, auth_user_util_1.hasActiveRole)(user, client_1.Role.FARMER) ? user.id : undefined);
        if (!targetFarmerId) {
            throw new common_1.BadRequestException('A farmer must be specified to redeem this code.');
        }
        if (coupon.assignedFarmerId && coupon.assignedFarmerId !== targetFarmerId) {
            throw new common_1.ForbiddenException('This coupon is assigned to a different farmer.');
        }
        if (coupon.assignedAdvisorId && user.role === client_1.Role.ADVISOR && user.id !== coupon.assignedAdvisorId) {
            throw new common_1.ForbiddenException('This coupon is assigned to a different advisor.');
        }
        if (user.role === client_1.Role.ADVISOR && targetFarmerId !== user.id) {
            const isMyCoupon = coupon.assignedAdvisorId === user.id || coupon.createdById === user.id;
            if (!isMyCoupon) {
                await this.advisorAssignmentService.assertAdvisorAssignedToFarmerAnyExpiry(user.id, targetFarmerId);
            }
        }
        return { coupon, targetFarmerId };
    }
    getAdminDocsList() {
        return [
            {
                key: 'master',
                title: 'FarmsKing Platform Master User Guide',
                fileName: 'FARMSKING_MASTER_USER_GUIDE.md',
                description: 'Complete platform overview, AI protocol & feature matrix',
            },
            {
                key: 'admin',
                title: 'Super Admin Master Governance & Pitch Book',
                fileName: 'SUPER_ADMIN_MASTER_GOVERNANCE_GUIDE.md',
                description: 'Governance rules, 100% Admin income rule, financial summary dashboard',
            },
            {
                key: 'farmer',
                title: 'Farmer User Handbook',
                fileName: 'FARMER_USER_GUIDE.md',
                description: 'Farm setup, Arhtiya advances, auto-interest, mandi converter, J-Form vault',
            },
            {
                key: 'advisor',
                title: 'Farm Advisor User Handbook',
                fileName: 'ADVISOR_USER_GUIDE.md',
                description: 'Advisor plan coupons, active wallet credit, direct farmer activations',
            },
            {
                key: 'partner',
                title: 'Business Partner User Handbook',
                fileName: 'BUSINESS_PARTNER_GUIDE.md',
                description: 'Partner coupons, upfront wallet debits, direct farmer assignments',
            },
            {
                key: 'coupons',
                title: 'Plan Coupons & How to Get Manual',
                fileName: 'PLAN_COUPONS_AND_HOW_TO_GET.md',
                description: 'Plan tiers, coupon formats, 4 ways to get coupons, 20-referral free reward',
            },
        ];
    }
    downloadAdminDocContent(docKey, lang = 'pa') {
        const fs = require('fs');
        const path = require('path');
        const possiblePaths = {
            master: [
                path.join(process.cwd(), 'FARMSKING_MASTER_USER_GUIDE.md'),
                path.join(process.cwd(), '..', 'FARMSKING_MASTER_USER_GUIDE.md'),
                'd:\\FarmsKing\\FARMSKING_MASTER_USER_GUIDE.md',
            ],
            admin: [
                path.join(process.cwd(), 'docs', 'SUPER_ADMIN_MASTER_GOVERNANCE_GUIDE.md'),
                path.join(process.cwd(), '..', 'docs', 'SUPER_ADMIN_MASTER_GOVERNANCE_GUIDE.md'),
                'd:\\FarmsKing\\docs\\SUPER_ADMIN_MASTER_GOVERNANCE_GUIDE.md',
            ],
            farmer: [
                path.join(process.cwd(), 'docs', 'FARMER_USER_GUIDE.md'),
                path.join(process.cwd(), '..', 'docs', 'FARMER_USER_GUIDE.md'),
                'd:\\FarmsKing\\docs\\FARMER_USER_GUIDE.md',
            ],
            advisor: [
                path.join(process.cwd(), 'docs', 'ADVISOR_USER_GUIDE.md'),
                path.join(process.cwd(), '..', 'docs', 'ADVISOR_USER_GUIDE.md'),
                'd:\\FarmsKing\\docs\\ADVISOR_USER_GUIDE.md',
            ],
            partner: [
                path.join(process.cwd(), 'docs', 'BUSINESS_PARTNER_GUIDE.md'),
                path.join(process.cwd(), '..', 'docs', 'BUSINESS_PARTNER_GUIDE.md'),
                'd:\\FarmsKing\\docs\\BUSINESS_PARTNER_GUIDE.md',
            ],
            coupons: [
                path.join(process.cwd(), 'docs', 'PLAN_COUPONS_AND_HOW_TO_GET.md'),
                path.join(process.cwd(), '..', 'docs', 'PLAN_COUPONS_AND_HOW_TO_GET.md'),
                'd:\\FarmsKing\\docs\\PLAN_COUPONS_AND_HOW_TO_GET.md',
            ],
        };
        let rawContent = '';
        const pathsToTry = possiblePaths[docKey] || [];
        for (const p of pathsToTry) {
            if (fs.existsSync(p)) {
                rawContent = fs.readFileSync(p, 'utf8');
                break;
            }
        }
        if (lang === 'en') {
            rawContent = getEnglishGuideContent(docKey, rawContent);
        }
        else if (lang === 'hi') {
            rawContent = getHindiGuideContent(docKey, rawContent);
        }
        const docsList = this.getAdminDocsList();
        const docMeta = docsList.find((d) => d.key === docKey);
        const langSuffix = lang === 'en' ? 'ENGLISH' : lang === 'hi' ? 'HINDI' : 'PUNJABI';
        const pdfFileName = `${docKey}_guide_${langSuffix}.pdf`;
        if (docKey === 'farmer' && lang === 'pa') {
            const punjabiGuidePath = path.join(process.cwd(), '..', 'FarmsKing_Farmer_Guide_Punjabi.html');
            if (fs.existsSync(punjabiGuidePath)) {
                const punjabiHtml = fs.readFileSync(punjabiGuidePath, 'utf8');
                return {
                    key: docKey,
                    lang,
                    title: `${docMeta?.title || docKey} (${langSuffix})`,
                    fileName: pdfFileName,
                    content: rawContent,
                    htmlPdfContent: punjabiHtml,
                };
            }
        }
        let formattedBodyHtml = rawContent
            .replace(/\\\$/g, '$')
            .replace(/\$\\rightarrow\$/g, ' → ')
            .replace(/^# (.*$)/gim, '<h1 class="main-title">$1</h1>')
            .replace(/^## (.*$)/gim, '<h2 class="section-title">$1</h2>')
            .replace(/^### (.*$)/gim, '<h3 class="feature-title">$1</h3>')
            .replace(/^\> (.*$)/gim, '<blockquote class="quote-card">$1</blockquote>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/ - (.*$)/gim, '<li class="list-item">$1</li>')
            .replace(/`([^`]+)`/g, '<code class="code-badge">$1</code>');
        formattedBodyHtml = formattedBodyHtml.replace(/\|(.+)\|\n\|(?:\s*:?-+:?\s*\|)+\n((?:\|.+\|\n?)+)/g, (_match, headerRow, bodyRows) => {
            const headers = headerRow.split('|').filter(Boolean).map((h) => `<th>${h.trim()}</th>`).join('');
            const rows = bodyRows.trim().split('\n').map((row) => {
                const cols = row.split('|').filter(Boolean).map((c) => `<td>${c.trim()}</td>`).join('');
                return `<tr>${cols}</tr>`;
            }).join('');
            return `<div class="table-container"><table class="corp-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
        });
        const headerMeta = getLanguageHeaderMetadata(lang);
        const pdfHtmlContent = `
      <!DOCTYPE html>
      <html lang="${lang}">
      <head>
        <meta charset="UTF-8">
        <title>${docMeta?.title || docKey} (${langSuffix})</title>
        <style>
          @page { margin: 12mm; size: A4; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            padding: 24px 16px;
            color: #0f172a;
            line-height: 1.75;
            background: #f1f5f9;
            font-size: 14px;
          }
          .book-wrapper {
            max-width: 820px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            border: 2px solid #cbd5e1;
            box-shadow: 0 12px 30px rgba(0,0,0,0.08);
            padding: 38px 44px;
          }
          .header-box {
            background: linear-gradient(135deg, #166534 0%, #15803d 45%, #0d9488 100%);
            color: #ffffff;
            padding: 28px 32px;
            border-radius: 16px;
            margin-bottom: 26px;
            box-shadow: 0 8px 20px rgba(22, 101, 52, 0.25);
          }
          .header-box h1 { color: #ffffff !important; border: none !important; margin: 10px 0 0 0; font-size: 25px; font-weight: 800; letter-spacing: -0.5px; }
          .badge { background: rgba(255,255,255,0.25); padding: 5px 16px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; display: inline-block; }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 28px;
          }
          .stat-card-1 { background: #dcfce7; border: 1.5px solid #86efac; border-left: 5px solid #16a34a; padding: 12px 14px; border-radius: 10px; }
          .stat-card-2 { background: #e0f2fe; border: 1.5px solid #7dd3fc; border-left: 5px solid #0284c7; padding: 12px 14px; border-radius: 10px; }
          .stat-card-3 { background: #fef3c7; border: 1.5px solid #fde047; border-left: 5px solid #d97706; padding: 12px 14px; border-radius: 10px; }
          .stat-card-4 { background: #fae8ff; border: 1.5px solid #f0abfc; border-left: 5px solid #c026d3; padding: 12px 14px; border-radius: 10px; }
          
          .stat-val { font-size: 14px; font-weight: 800; margin-bottom: 2px; }
          .stat-card-1 .stat-val { color: #14532d; }
          .stat-card-2 .stat-val { color: #075985; }
          .stat-card-3 .stat-val { color: #78350f; }
          .stat-card-4 .stat-val { color: #701a75; }
          .stat-lbl { font-size: 10px; color: #475569; font-weight: 700; text-transform: uppercase; }

          .main-title { color: #15803d; border-bottom: 3px solid #bbf7d0; padding-bottom: 8px; margin-top: 26px; font-size: 21px; font-weight: 800; }
          .section-title { color: #15803d; background: #f0fdf4; border-left: 6px solid #16a34a; padding: 12px 18px; border-radius: 0 12px 12px 0; margin-top: 28px; font-size: 17px; font-weight: 800; }
          .feature-title { color: #0f172a; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #cbd5e1; border-left: 5px solid #0d9488; padding: 12px 18px; border-radius: 10px; margin-top: 22px; font-size: 14.5px; font-weight: 700; page-break-after: avoid; }
          
          .quote-card { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 5px solid #16a34a; padding: 14px 20px; color: #14532d; font-weight: 700; border-radius: 0 12px 12px 0; margin: 16px 0; font-size: 14px; }
          .code-badge { background: #f1f5f9; color: #0f172a; padding: 3px 8px; border-radius: 6px; font-family: monospace; font-size: 12px; border: 1px solid #cbd5e1; font-weight: 600; }
          .list-item { margin-bottom: 8px; }

          .table-container { margin: 20px 0; overflow-x: auto; page-break-inside: avoid; }
          .corp-table { width: 100%; border-collapse: collapse; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
          .corp-table th { background: linear-gradient(135deg, #15803d 0%, #0f766e 100%); color: #ffffff; text-align: left; padding: 12px 14px; font-size: 12.5px; font-weight: 800; }
          .corp-table td { padding: 11px 14px; border-bottom: 1px solid #e2e8f0; font-size: 12.5px; color: #334155; }
          .corp-table tbody tr:nth-child(even) { background: #f8fafc; }

          .footer-box { margin-top: 44px; padding-top: 20px; border-top: 2px solid #e2e8f0; font-size: 11.5px; color: #64748b; text-align: center; font-weight: 600; }
          @media print {
            body { padding: 0; background: #ffffff; }
            .book-wrapper { border: none; box-shadow: none; padding: 0; }
            .header-box { box-shadow: none; }
            .table-container, .feature-title, .stat-card-1, .stat-card-2, .stat-card-3, .stat-card-4 { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="book-wrapper">
          <div class="header-box">
            <span class="badge">FarmsKing Official Book · ${langSuffix}</span>
            <h1>${docMeta?.title || docKey}</h1>
            <p style="margin-top:8px; font-size:13px; opacity:0.95;">${headerMeta.subtitle}</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card-1">
              <div class="stat-val">${headerMeta.stat1Val}</div>
              <div class="stat-lbl">${headerMeta.stat1Lbl}</div>
            </div>
            <div class="stat-card-2">
              <div class="stat-val">🎙️ 0 ਟਾਈਪਿੰਗ</div>
              <div class="stat-lbl">ਪੰਜਾਬੀ Voice AI</div>
            </div>
            <div class="stat-card-3">
              <div class="stat-val">100% ਸ਼ੁੱਧਤਾ</div>
              <div class="stat-lbl">ਆੜ੍ਹਤੀਆ ਆਟੋ-ਵਿਆਜ</div>
            </div>
            <div class="stat-card-4">
              <div class="stat-val">🛰️ ਸੈਟੇਲਾਈਟ</div>
              <div class="stat-lbl">ISRO ਖੇਤ ਰਡਾਰ</div>
            </div>
          </div>

          <div style="font-size: 14px; color: #334155;">
            ${formattedBodyHtml}
          </div>

          <div class="footer-box">
            © 2026 FarmsKing Smart Agriculture Platform · Universal King ID Network (FK-XXXXXX) · All Rights Reserved
          </div>
        </div>
    `;
        return {
            key: docKey,
            lang,
            title: `${docMeta?.title || docKey} (${langSuffix})`,
            fileName: pdfFileName,
            content: rawContent,
            htmlPdfContent: pdfHtmlContent,
        };
    }
};
exports.FarmerPlansService = FarmerPlansService;
exports.FarmerPlansService = FarmerPlansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        advisor_assignment_service_1.AdvisorAssignmentService,
        wallet_service_1.WalletService])
], FarmerPlansService);
function getEnglishGuideContent(docKey, fallbackPa) {
    switch (docKey) {
        case 'farmer':
            return `# 🌾 FarmsKing Farmer Master Guide, Pricing & Benefits (English Edition)

> **Comprehensive step-by-step guide for farmers explaining app installation, plan prices, features matrix, and top 10 savings benefits.**

---

## 📱 1. How to Install & Setup
1. **Download App**: Open Google Play Store, search for **FarmsKing** and install.
2. **Sign Up**: Enter your 10-digit mobile number + 4-digit OTP.
3. **King ID**: Get your unique Universal King ID (e.g. \`FK-100238\`) automatically!

---

## 💰 2. Subscription Plans & Pricing
- **🟢 FREE Plan (₹0 / Lifetime)**: Basic 3 crops tracking, live mandi rates.
- **🔵 PRO (Lite) Plan (₹199 / 6 Mo, ₹299 / 1 Year)**: Unlimited crops, Punjabi & English Voice AI, Arhtiya interest calculator, J-Form vault.
- **🟣 SMART Plan (₹499 / Mo, ₹3,999 / 1 Year)**: Satellite crop health radar (ISRO/Sentinel-2) + Dedicated Farm Doctor.
- **👑 SUPER Premium Plan (₹999 / Mo, ₹6,999 / 1 Year)**: 30-Day Mandi Price Prediction + Forward Lock Escrow Contracts.

---

## 💡 3. Top 10 Farmer Benefits (Save ₹50,000 to ₹1,00,000 per crop cycle)
1. **Zero Typing Needed (Voice AI Mic)**: Speak in Punjabi/English, AI auto-updates your ledger!
2. **Zero Interest Errors (Arhtiya Auto-Interest)**: Auto-computes exact daily interest on advances.
3. **Mandi Weight Converter**: Convert bags (50kg/35kg) or Mann into Quintals automatically.
4. **Early Disease Alert (Satellite Radar)**: Detect disease 3 days early via ISRO/Sentinel-2 maps.
5. **Extra ₹100-₹200/Quintal Rate**: Sell crops at peak price using 30-day AI mandi predictions.
6. **Save ₹250/Bag on DAP/Urea**: Join Village Group Buying pools for factory rates.
7. **Digital J-Form Vault**: Store crop sale receipts safely forever.
8. **Government Subsidy Auto-Claim**: 1-click forms for Solar Pump, DSR & Happy Seeder.
9. **1-Year Free PRO Plan**: Refer 20 farmer friends -> Get 1 Year PRO Plan FREE!
10. **Lifetime Wallet Cashback**: Earn 1% to 0.01% recurring cashback on referral network!
`;
        case 'advisor':
            return `# 🎓 Farm Advisor Master Guide (English Edition)

1. **Profile**: Register as Farm/Garden Advisor.
2. **Generate Coupons**: Issue plan coupons to farmers via WhatsApp.
3. **Wallet Share**: Earn instant commission (₹150-₹300) per activated farmer!
`;
        case 'partner':
            return `# 🤝 Business Partner Master Guide (English Edition)

1. **Bulk Stock**: Purchase bulk plan coupons at wholesale discount.
2. **Direct Activation**: Input farmer's King ID (\`FK-100238\`) to instantly activate their plan.
3. **Lifetime Royalties**: Earn recurring cashback on all crop store purchases.
`;
        case 'coupons':
            return `# 🎁 Plan Coupons Manual & 4 Ways to Get (English Edition)

1. **20-Referral Milestone**: Refer 20 farmer friends -> Get 1 Year PRO Plan FREE!
2. **From Advisor**: Get coupon code directly from your local Farm Advisor.
3. **From Business Partner**: Get coupon code from fertilizer dealers.
4. **Super Admin Offer**: Redeem promo codes for 100% discount.
`;
        default:
            return fallbackPa;
    }
}
function getHindiGuideContent(docKey, fallbackPa) {
    switch (docKey) {
        case 'farmer':
            return `# 🌾 फार्म्सकिंग किसान मास्टर गाइड, प्लान व फायदे (हिन्दी संस्करण)

> **किसान भाइयों के लिए ऐप इंस्टॉल करने, प्लान की कीमतों, फीचर्स और 10 बड़े फायदों की पूरी गाइड।**

---

## 📱 1. ऐप कैसे इंस्टॉल व चालू करें?
1. **ऐप डाउनलोड करें**: प्ले स्टोर पर **FarmsKing** सर्च करके इंस्टॉल करें।
2. **साइन अप करें**: 10-अंकों का मोबाइल नंबर और 4-अंकों का OTP भरें।
3. **King ID**: आपकी यूनीक Universal King ID (जैसे \`FK-100238\`) बन जाएगी!

---

## 💰 2. सब्सक्राइब प्लान व कीमतें
- **🟢 FREE Plan (₹0 / लाइफटाइम)**: 3 फसलों का हिसाब, लाइव मंडी भाव।
- **🔵 PRO (Lite) Plan (₹199 / 6 महीने, ₹299 / 1 साल)**: असीमित फसलें, वॉइस एआई, आढ़तिया ब्याज कनवर्टर, जे-फॉर्म वॉल्ट।
- **🟣 SMART Plan (₹499 / महीना, ₹3,999 / 1 साल)**: सेटेलाइट फसल स्वास्थ्य (ISRO/Sentinel-2) + समर्पित कृषि डॉक्टर।
- **👑 SUPER Premium Plan (₹999 / महीना, ₹6,999 / 1 साल)**: 30 दिन मंडी भाव भविष्यवाणी + प्राइस लॉक कूपन।

---

## 💡 3. किसान भाइयों के लिए 10 बड़े फायदे (₹50,000 से ₹1,00,000 तक की बचत)
1. **टाइप करने की जरूरत नहीं (वॉइस एआई)**: बोलकर हिसाब लिखें, ऐप अपने आप सहेजेगी।
2. **आढ़तिया ब्याज में जीरो गलती**: दैनिक ब्याज का स्वचालित हिसाब रखें।
3. **मंडी कनवर्टर**: बोरी (50kg/35kg) को तुरंत क्विंटल में बदलें।
4. **बीमारी का 3 दिन पहले अलर्ट (सेटेलाइट)**: सेटेलाइट नक्शे पर लाल निशान देखकर स्प्रे करें।
5. **₹100-₹200/क्विंटल ज्यादा रेट**: 30 दिन की भविष्यवाणी देखकर सही समय फसल बेचें।
6. **₹250/बोरी की बचत**: विलेज ग्रुप बाइंग से खाद-बीज खरीदें।
7. **डिजिटल J-Form वॉल्ट**: फसल बिक्री रसीद हमेशा सुरक्षित रखें।
8. **सरकारी सब्सिडी ऑटो-फॉर्म**: 1-क्लिक में सब्सिडी क्लेम करें।
9. **1 साल का फ्री PRO प्लान**: 20 दोस्तों को जोड़ें -> ₹299 का प्लान फ्री पाएं!
10. **लाइफटाइम वॉलेट कैशबैक**: रेफरल नेटवर्क पर 1% से 0.01% कैशबैक पाएं!
`;
        case 'advisor':
            return `# 🎓 कृषि सलाहकार मास्टर गाइड (हिन्दी संस्करण)

1. **प्रोफाइल**: Farm Advisor के रूप में रजिस्टर करें।
2. **कूपन जारी करें**: किसानों को व्हाट्सएप पर कूपन कोड भेजें।
3. **वॉलेट कमाई**: प्रति किसान ₹150-₹300 की तुरंत कमाई करें!
`;
        case 'partner':
            return `# 🤝 बिजनेस पार्टनर मास्टर गाइड (हिन्दी संस्करण)

1. **बल्क कूपन**: डिस्काउंट पर कूपन खरीदें।
2. **डायरेक्ट एक्टिवेशन**: किसान की King ID से प्लान तुरंत चालू करें।
3. **लाइफटाइम कमीशन**: हर खरीदारी पर लाइफटाइम कैशबैक पाएं!
`;
        case 'coupons':
            return `# 🎁 कूपन कैसे प्राप्त करें? (हिन्दी संस्करण)

1. **20-रेफरल इनाम**: 20 दोस्तों को जोड़ें -> 1 साल का PRO प्लान फ्री!
2. **सलाहकार से कूपन लें**: नजदीकी कृषि सलाहकार से कूपन कोड लें।
3. **डीलर से कूपन लें**: खाद/बीज विक्रेता से कूपन प्राप्त करें।
4. **सुपर एडमिन ऑफर**: 100% डिस्काउंट प्रोमो कोड रिडीम करें।
`;
        default:
            return fallbackPa;
    }
}
function getLanguageHeaderMetadata(lang) {
    switch (lang) {
        case 'en':
            return {
                subtitle: 'Official Step-by-Step User Handbook & Feature Guide for Farmers',
                stat1Val: '₹50,000 - ₹1,00,000',
                stat1Lbl: 'Crop Savings',
                stat2Val: '🎙️ Zero Typing',
                stat2Lbl: 'Voice AI Assistant',
                stat3Val: '100% Accuracy',
                stat3Lbl: 'Arhtiya Auto Interest',
                stat4Val: '🛰️ Satellite',
                stat4Lbl: 'ISRO Field Radar',
            };
        case 'hi':
            return {
                subtitle: 'किसान भाइयों के लिए संपूर्ण सरल चरण-दर-चरण निर्देश पुस्तक',
                stat1Val: '₹50,000 - ₹1,00,000',
                stat1Lbl: 'प्रति फसल बचत',
                stat2Val: '🎙️ 0 टाइपिंग',
                stat2Lbl: 'वॉइस एआई असिस्टेंट',
                stat3Val: '100% शुद्धता',
                stat3Lbl: 'आढ़तिया ऑटो-ब्याज',
                stat4Val: '🛰️ सेटेलाइट',
                stat4Lbl: 'ISRO फसल रडार',
            };
        case 'ur':
            return {
                subtitle: 'کسانوں کے لیے مکمل آسان، رنگین مرحلہ وار ہدایت کی کتاب',
                stat1Val: '₹50,000 - ₹1,00,000',
                stat1Lbl: 'فصل بچت',
                stat2Val: '🎙️ 0 ٹائپنگ',
                stat2Lbl: 'وائس AI اسسٹنٹ',
                stat3Val: '100% درستگی',
                stat3Lbl: 'آڑھتیا آٹو سود',
                stat4Val: '🛰️ سیٹلائٹ',
                stat4Lbl: 'ISRO فیلڈ رڈار',
            };
        case 'mr':
            return {
                subtitle: 'शेतकरी बांधवांसाठी संपूर्ण सोपी, रंगीबेरंगी पायरी-पायरीने मार्गदर्शन पुस्तिका',
                stat1Val: '₹50,000 - ₹1,00,000',
                stat1Lbl: 'दर पीक बचत',
                stat2Val: '🎙️ 0 टायपिंग',
                stat2Lbl: 'व्हॉइस AI असिस्टंट',
                stat3Val: '100% तंतोतंत',
                stat3Lbl: 'आडत्याचे ऑटो व्याज',
                stat4Val: '🛰️ सॅटेलाइट',
                stat4Lbl: 'ISRO शेत रडार',
            };
        case 'gu':
            return {
                subtitle: 'ખેડૂત ભાઈઓ માટે સંપૂર્ણ સરળ, રંગીન તબક્કાવાર માર્ગદર્શિકા પુસ્તક',
                stat1Val: '₹50,000 - ₹1,00,000',
                stat1Lbl: 'પાક બચત',
                stat2Val: '🎙️ 0 ટાઈપિંગ',
                stat2Lbl: 'વોઈસ AI આસિસ્ટન્ટ',
                stat3Val: '100% સચોટતા',
                stat3Lbl: 'આડતીયા ઓટો વ્યાજ',
                stat4Val: '🛰️ સેટેલાઇટ',
                stat4Lbl: 'ISRO ખેતર રડાર',
            };
        case 'te':
            return {
                subtitle: 'రైతు సోదరుల కోసం సమగ్రమైన సులువైన దశల వారీ మార్గదర్శక పుస్తకం',
                stat1Val: '₹50,000 - ₹1,00,000',
                stat1Lbl: 'పంట పొదుపు',
                stat2Val: '🎙️ 0 టైపింగ్',
                stat2Lbl: 'వాయిస్ AI అసిస్టెంట్',
                stat3Val: '100% కచ్చితత్వం',
                stat3Lbl: 'ఆడత్యా ఆటో వడ్డీ',
                stat4Val: '🛰️ శాటిలైట్',
                stat4Lbl: 'ISRO పొలం రాడార్',
            };
        case 'ta':
            return {
                subtitle: 'விவசாயிகளுக்கான முழுமையான எளிய படி-படியான வழிகாட்டி புத்தகம்',
                stat1Val: '₹50,000 - ₹1,00,000',
                stat1Lbl: 'பயிர் சேமிப்பு',
                stat2Val: '🎙️ 0 டைப்பிங்',
                stat2Lbl: 'வாய்ஸ் AI உதவியாளர்',
                stat3Val: '100% துல்லியம்',
                stat3Lbl: 'ஆடத்யா ஆட்டோ வட்டி',
                stat4Val: '🛰️ செயற்கைக்கோள்',
                stat4Lbl: 'ISRO பண்ணை ரேடார்',
            };
        case 'kn':
            return {
                subtitle: 'ರೈತ ಬಾಂಧವರಿಗಾಗಿ ಸಂಪೂರ್ಣ ಸರಳ ಹಂತ-ಹಂತದ ಮಾರ್ಗದರ್ಶಕ ಪುಸ್ತಕ',
                stat1Val: '₹50,000 - ₹1,00,000',
                stat1Lbl: 'ಬೆಳೆ ಉಳಿತಾಯ',
                stat2Val: '🎙️ 0 ಟೈಪಿಂಗ್',
                stat2Lbl: 'ವಾಯ್ಸ್ AI ಸಹಾಯಕ',
                stat3Val: '100% ನಿಖರತೆ',
                stat3Lbl: 'ಆಡತ್ಯ ಆಟೋ ಬಡ್ಡಿ',
                stat4Val: '🛰️ ಸ್ಯಾಟಲೈಟ್',
                stat4Lbl: 'ISRO ಜಮೀನು ರಾಡಾರ್',
            };
        case 'bn':
            return {
                subtitle: 'কৃষক ভাইদের জন্য সম্পূর্ণ সহজ ধাপ-ভিত্তিক নির্দেশিকা বই',
                stat1Val: '₹50,000 - ₹1,00,000',
                stat1Lbl: 'ফসল সঞ্চয়',
                stat2Val: '🎙️ 0 টাইপিং',
                stat2Lbl: 'ভয়েস AI সহকারী',
                stat3Val: '100% সঠিকতা',
                stat3Lbl: 'আড়তদার অটো সুদ',
                stat4Val: '🛰️ স্যাটেলাইট',
                stat4Lbl: 'ISRO জমি রাডার',
            };
        case 'pa':
        default:
            return {
                subtitle: 'ਕਿਸਾਨ ਭਰਾਵਾਂ ਲਈ ਬਿਲਕੁਲ ਆਸਾਨ, ਰੰਗਦਾਰ ਸਟੈੱਪ-ਬਾਏ-ਸਟੈੱਪ ਹਦਾਇਤ ਪੁਸਤਕ',
                stat1Val: '₹50,000 - ₹1,00,000',
                stat1Lbl: 'ਬਚਤ ਪ੍ਰਤੀ ਫਸਲ',
                stat2Val: '🎙️ 0 ਟਾਈਪਿੰਗ',
                stat2Lbl: 'ਪੰਜਾਬੀ Voice AI',
                stat3Val: '100% ਸ਼ੁੱਧਤਾ',
                stat3Lbl: 'ਆੜ੍ਹਤੀਆ ਆਟੋ-ਵਿਆਜ',
                stat4Val: '🛰️ ਸੈਟੇਲਾਈਟ',
                stat4Lbl: 'ISRO ਖੇਤ ਰਡਾਰ',
            };
    }
}
function getMultiLanguageGuideContent(docKey, lang, fallbackPa) {
    if (lang === 'en')
        return getEnglishGuideContent(docKey, fallbackPa);
    if (lang === 'hi')
        return getHindiGuideContent(docKey, fallbackPa);
    return fallbackPa;
}
//# sourceMappingURL=farmer-plans.service.js.map