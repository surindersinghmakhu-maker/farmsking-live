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
exports.PlanRenewalService = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const advisor_assignment_service_1 = require("../advisor-assignment/advisor-assignment.service");
const auth_user_util_1 = require("../../common/utils/auth-user.util");
const upi_util_1 = require("../../common/utils/upi.util");
const app_settings_service_1 = require("../app-settings/app-settings.service");
const DAY_MS = 24 * 60 * 60 * 1000;
function generateCode() {
    return `RENEW-${(0, crypto_1.randomBytes)(3).toString('hex').toUpperCase()}`;
}
function computeExtension(subscription, daysGranted, applyBonus) {
    const now = new Date();
    const currentEndDate = subscription.endDate;
    const isPending = !!currentEndDate && currentEndDate.getTime() > now.getTime();
    const bonusDayApplied = applyBonus && isPending;
    const baseDate = isPending ? currentEndDate : now;
    const totalDays = daysGranted + (bonusDayApplied ? 1 : 0);
    const newEndDate = new Date(baseDate.getTime() + totalDays * DAY_MS);
    return { bonusDayApplied, newEndDate };
}
let PlanRenewalService = class PlanRenewalService {
    prisma;
    advisorAssignmentService;
    appSettingsService;
    constructor(prisma, advisorAssignmentService, appSettingsService) {
        this.prisma = prisma;
        this.advisorAssignmentService = advisorAssignmentService;
        this.appSettingsService = appSettingsService;
    }
    async create(admin, dto) {
        if (dto.assignedFarmerId && dto.assignedAdvisorId) {
            throw new common_1.BadRequestException('Lock a coupon to a farmer or an advisor, not both.');
        }
        if (dto.assignedFarmerId) {
            const farmer = await this.prisma.user.findFirst({
                where: { id: dto.assignedFarmerId, roles: { has: client_1.Role.FARMER }, deletedAt: null },
            });
            if (!farmer) {
                throw new common_1.NotFoundException('Farmer not found.');
            }
        }
        if (dto.assignedAdvisorId) {
            const advisor = await this.prisma.user.findFirst({
                where: { id: dto.assignedAdvisorId, roles: { has: client_1.Role.ADVISOR }, deletedAt: null },
            });
            if (!advisor) {
                throw new common_1.NotFoundException('Advisor not found.');
            }
        }
        let code = generateCode();
        while (await this.prisma.planRenewalCoupon.findUnique({ where: { code } })) {
            code = generateCode();
        }
        return this.prisma.planRenewalCoupon.create({
            data: {
                code,
                daysGranted: dto.daysGranted,
                createdById: admin.id,
                assignedFarmerId: dto.assignedFarmerId,
                assignedAdvisorId: dto.assignedAdvisorId,
            },
        });
    }
    listAll() {
        return this.prisma.planRenewalCoupon.findMany({
            include: {
                assignedFarmer: { select: { id: true, name: true, mobile: true } },
                assignedAdvisor: { select: { id: true, name: true, mobile: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    listMineForAdvisor(user) {
        return this.prisma.planRenewalCoupon.findMany({
            where: { assignedAdvisorId: user.id },
            orderBy: { createdAt: 'desc' },
        });
    }
    async resolveCouponAndFarmer(user, code, farmerId) {
        const coupon = await this.prisma.planRenewalCoupon.findUnique({ where: { code: code.toUpperCase() } });
        if (!coupon) {
            throw new common_1.NotFoundException('Invalid renewal code.');
        }
        if (coupon.isUsed) {
            throw new common_1.BadRequestException('This renewal code has already been used.');
        }
        const targetFarmerId = farmerId ?? ((0, auth_user_util_1.hasActiveRole)(user, client_1.Role.FARMER) ? user.id : undefined);
        if (!targetFarmerId) {
            throw new common_1.BadRequestException('A farmer must be specified to redeem this code.');
        }
        if (coupon.assignedFarmerId && coupon.assignedFarmerId !== targetFarmerId) {
            throw new common_1.ForbiddenException('This renewal code is assigned to a different farmer.');
        }
        if (coupon.assignedAdvisorId && (user.role !== client_1.Role.ADVISOR || user.id !== coupon.assignedAdvisorId)) {
            throw new common_1.ForbiddenException('This renewal code is assigned to a different advisor.');
        }
        if (user.role === client_1.Role.ADVISOR && targetFarmerId !== user.id) {
            await this.advisorAssignmentService.assertAdvisorAssignedToFarmerAnyExpiry(user.id, targetFarmerId);
        }
        const subscription = await this.prisma.advisorSubscription.findFirst({
            where: { farmerId: targetFarmerId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });
        return { coupon, targetFarmerId, subscription };
    }
    async previewRedeem(user, code, farmerId) {
        const { coupon, subscription } = await this.resolveCouponAndFarmer(user, code, farmerId);
        if (!subscription) {
            const newEndDate = new Date(Date.now() + coupon.daysGranted * DAY_MS);
            return { daysGranted: coupon.daysGranted, bonusDayApplied: false, newEndDate, isFirstHire: true };
        }
        const { bonusDayApplied, newEndDate } = computeExtension(subscription, coupon.daysGranted, true);
        return { daysGranted: coupon.daysGranted, bonusDayApplied, newEndDate, isFirstHire: false };
    }
    async redeem(user, code, dto) {
        const { coupon, targetFarmerId, subscription } = await this.resolveCouponAndFarmer(user, code, dto.farmerId);
        const now = new Date();
        if (!subscription) {
            const plan = await this.prisma.advisorPlan.findFirst({ where: { isActive: true } });
            if (!plan) {
                throw new common_1.NotFoundException('No advisor plan is configured yet. Please contact support.');
            }
            const newEndDate = new Date(now.getTime() + coupon.daysGranted * DAY_MS);
            const newSubscription = await this.prisma.advisorSubscription.create({
                data: { farmerId: targetFarmerId, planId: plan.id, status: client_1.SubscriptionPlanStatus.ACTIVE, approvedAt: now, startDate: now, endDate: newEndDate },
            });
            await this.advisorAssignmentService.createFromSubscription(newSubscription.id, targetFarmerId);
            await this.prisma.farmerPlan.upsert({
                where: { farmerId: targetFarmerId },
                create: { farmerId: targetFarmerId, plan: client_1.FarmerSubscriptionPlan.PRO, endDate: newEndDate },
                update: { plan: client_1.FarmerSubscriptionPlan.PRO, endDate: newEndDate, expiredAt: null },
            });
            await this.prisma.planRenewalCoupon.update({
                where: { id: coupon.id },
                data: { isUsed: true, usedAt: now, assignedFarmerId: targetFarmerId, bonusDayApplied: false },
            });
            return { subscription: newSubscription, daysAdded: coupon.daysGranted, bonusDayApplied: false, newEndDate, isFirstHire: true };
        }
        const { bonusDayApplied, newEndDate } = computeExtension(subscription, coupon.daysGranted, true);
        const [updatedSubscription] = await this.prisma.$transaction([
            this.prisma.advisorSubscription.update({
                where: { id: subscription.id },
                data: { status: client_1.SubscriptionPlanStatus.ACTIVE, startDate: subscription.startDate ?? now, endDate: newEndDate },
            }),
            this.prisma.planRenewalCoupon.update({
                where: { id: coupon.id },
                data: { isUsed: true, usedAt: now, assignedFarmerId: targetFarmerId, bonusDayApplied },
            }),
            this.prisma.farmerPlan.upsert({
                where: { farmerId: targetFarmerId },
                create: { farmerId: targetFarmerId, plan: client_1.FarmerSubscriptionPlan.PRO, endDate: newEndDate },
                update: { plan: client_1.FarmerSubscriptionPlan.PRO, endDate: newEndDate, expiredAt: null },
            }),
        ]);
        return { subscription: updatedSubscription, daysAdded: coupon.daysGranted, bonusDayApplied, newEndDate, isFirstHire: false };
    }
    async getUpiLinkForFarmer(user, farmerId) {
        const targetFarmerId = farmerId ?? ((0, auth_user_util_1.hasActiveRole)(user, client_1.Role.FARMER) ? user.id : undefined);
        if (!targetFarmerId) {
            throw new common_1.BadRequestException('A farmer must be specified to generate a payment link.');
        }
        if ((0, auth_user_util_1.hasActiveRole)(user, client_1.Role.ADVISOR) && targetFarmerId !== user.id) {
            await this.advisorAssignmentService.assertAdvisorAssignedToFarmerAnyExpiry(user.id, targetFarmerId);
        }
        const [farmer, subscription] = await Promise.all([
            this.prisma.user.findFirst({ where: { id: targetFarmerId, roles: { has: client_1.Role.FARMER }, deletedAt: null } }),
            this.prisma.advisorSubscription.findFirst({
                where: { farmerId: targetFarmerId, deletedAt: null },
                orderBy: { createdAt: 'desc' },
                include: { plan: true },
            }),
        ]);
        if (!farmer) {
            throw new common_1.NotFoundException('Farmer not found.');
        }
        if (!subscription) {
            throw new common_1.BadRequestException('This farmer has no plan to pay for yet.');
        }
        const remark = farmer.kingId ?? farmer.id;
        const settings = await this.appSettingsService.get();
        if (!settings.upiId) {
            throw new common_1.BadRequestException('UPI payment is not configured yet. Please contact support.');
        }
        const upiLink = (0, upi_util_1.buildUpiPaymentLink)({
            amount: Number(subscription.plan.price),
            note: remark,
            transactionRef: remark,
            payeeVpa: settings.upiId,
            payeeName: settings.upiPayeeName ?? undefined,
        });
        return { upiLink, amount: Number(subscription.plan.price), farmerKingId: remark, planName: subscription.plan.name };
    }
    async grantDaysDirectly(farmerId, daysGranted) {
        const subscription = await this.prisma.advisorSubscription.findFirst({
            where: { farmerId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });
        if (!subscription) {
            throw new common_1.BadRequestException('This farmer needs an active plan before days can be added. Please subscribe first.');
        }
        const { newEndDate } = computeExtension(subscription, daysGranted, false);
        const now = new Date();
        const updatedSubscription = await this.prisma.advisorSubscription.update({
            where: { id: subscription.id },
            data: { status: client_1.SubscriptionPlanStatus.ACTIVE, startDate: subscription.startDate ?? now, endDate: newEndDate },
        });
        return { subscription: updatedSubscription, daysAdded: daysGranted, newEndDate };
    }
};
exports.PlanRenewalService = PlanRenewalService;
exports.PlanRenewalService = PlanRenewalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        advisor_assignment_service_1.AdvisorAssignmentService,
        app_settings_service_1.AppSettingsService])
], PlanRenewalService);
//# sourceMappingURL=plan-renewal.service.js.map