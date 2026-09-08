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
exports.FarmerPlanPaymentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const advisor_assignment_service_1 = require("../advisor-assignment/advisor-assignment.service");
const notifications_service_1 = require("../notifications/notifications.service");
const app_settings_service_1 = require("../app-settings/app-settings.service");
const farmer_plans_service_1 = require("../farmer-plans/farmer-plans.service");
const auth_user_util_1 = require("../../common/utils/auth-user.util");
const upi_util_1 = require("../../common/utils/upi.util");
const DETAIL_INCLUDE = {
    farmer: { select: { id: true, name: true, mobile: true, kingId: true } },
};
let FarmerPlanPaymentsService = class FarmerPlanPaymentsService {
    prisma;
    advisorAssignmentService;
    notificationsService;
    appSettingsService;
    farmerPlansService;
    constructor(prisma, advisorAssignmentService, notificationsService, appSettingsService, farmerPlansService) {
        this.prisma = prisma;
        this.advisorAssignmentService = advisorAssignmentService;
        this.notificationsService = notificationsService;
        this.appSettingsService = appSettingsService;
        this.farmerPlansService = farmerPlansService;
    }
    async initiate(user, dto, farmerId) {
        const targetFarmerId = farmerId ?? user.id;
        if (!targetFarmerId) {
            throw new common_1.BadRequestException('A farmer must be specified to start a payment.');
        }
        if ((0, auth_user_util_1.hasActiveRole)(user, client_1.Role.ADVISOR) && targetFarmerId !== user.id) {
            await this.advisorAssignmentService.assertAdvisorAssignedToFarmerAnyExpiry(user.id, targetFarmerId);
        }
        const farmer = await this.prisma.user.findFirst({ where: { id: targetFarmerId, deletedAt: null } });
        if (!farmer) {
            throw new common_1.NotFoundException('Farmer account not found. Please log in again.');
        }
        const effective = await this.farmerPlansService.getEffectivePlan(targetFarmerId);
        if (farmer_plans_service_1.PLAN_RANK[dto.targetPlan] < farmer_plans_service_1.PLAN_RANK[effective.plan]) {
            throw new common_1.BadRequestException(`You already have the ${effective.plan} plan active — this would be a downgrade.`);
        }
        let pricing = dto.billingPeriodDays
            ? await this.prisma.farmerPlanPricing.findFirst({
                where: { plan: dto.targetPlan, billingPeriodDays: Number(dto.billingPeriodDays) },
            })
            : null;
        if (!pricing) {
            pricing = await this.prisma.farmerPlanPricing.findFirst({
                where: { plan: dto.targetPlan },
                orderBy: { billingPeriodDays: 'desc' },
            });
        }
        if (!pricing) {
            throw new common_1.BadRequestException('Pricing for this plan is not configured yet. Please contact support.');
        }
        const amount = Number(pricing.price);
        const daysGranted = pricing.billingPeriodDays;
        const request = await this.prisma.farmerPlanPaymentRequest.create({
            data: { farmerId: targetFarmerId, targetPlan: dto.targetPlan, amount, daysGranted },
            include: DETAIL_INCLUDE,
        });
        const settings = await this.appSettingsService.get();
        if (!settings.upiId) {
            throw new common_1.BadRequestException('UPI payment is not configured yet. Please contact support.');
        }
        const upiLink = (0, upi_util_1.buildUpiPaymentLink)({
            amount,
            note: `${dto.targetPlan} Plan, ID=${farmer.kingId ?? farmer.id}, ${farmer.name}`,
            transactionRef: request.id,
            payeeVpa: settings.upiId,
            payeeName: settings.upiPayeeName ?? undefined,
        });
        return { ...request, upiLink };
    }
    listMine(user) {
        return this.prisma.farmerPlanPaymentRequest.findMany({
            where: { farmerId: user.id },
            include: DETAIL_INCLUDE,
            orderBy: { requestedAt: 'desc' },
        });
    }
    async findOwnedOrThrow(user, id) {
        const request = await this.prisma.farmerPlanPaymentRequest.findUnique({ where: { id }, include: DETAIL_INCLUDE });
        if (!request) {
            throw new common_1.NotFoundException('Payment request not found.');
        }
        const isOwner = request.farmerId === user.id;
        const staffRoles = [client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN];
        if (!isOwner && !staffRoles.includes(user.role)) {
            if (user.role === client_1.Role.ADVISOR) {
                await this.advisorAssignmentService.assertAdvisorAssignedToFarmerAnyExpiry(user.id, request.farmerId);
            }
            else {
                throw new common_1.ForbiddenException('You do not have access to this payment request.');
            }
        }
        return request;
    }
    async submit(user, id, dto) {
        const request = await this.findOwnedOrThrow(user, id);
        if (request.status !== client_1.PlanPaymentStatus.PENDING) {
            throw new common_1.BadRequestException('This payment request has already been submitted or resolved.');
        }
        const updated = await this.prisma.farmerPlanPaymentRequest.update({
            where: { id },
            data: { status: client_1.PlanPaymentStatus.SUBMITTED, submittedAt: new Date(), utr: dto.utr, screenshotUrl: dto.screenshotUrl },
            include: DETAIL_INCLUDE,
        });
        const admins = await this.prisma.user.findMany({ where: { role: { in: [client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN] }, deletedAt: null }, select: { id: true } });
        await Promise.all(admins.map((admin) => this.notificationsService.create(admin.id, client_1.NotificationType.PAYMENT_DUE, 'Plan upgrade payment awaiting verification', `${request.farmer.name} claims ₹${request.amount} was paid to upgrade to ${request.targetPlan}. Please verify and confirm.`, { farmerPlanPaymentRequestId: id })));
        return updated;
    }
    listPending() {
        return this.prisma.farmerPlanPaymentRequest.findMany({
            where: { status: client_1.PlanPaymentStatus.SUBMITTED },
            include: DETAIL_INCLUDE,
            orderBy: { submittedAt: 'asc' },
        });
    }
    async confirm(admin, id) {
        const request = await this.prisma.farmerPlanPaymentRequest.findUnique({ where: { id }, include: DETAIL_INCLUDE });
        if (!request) {
            throw new common_1.NotFoundException('Payment request not found.');
        }
        if (request.status !== client_1.PlanPaymentStatus.SUBMITTED) {
            throw new common_1.BadRequestException('Only submitted payment requests can be confirmed.');
        }
        const prefix = request.targetPlan === client_1.FarmerSubscriptionPlan.PRO ? 'KC-LITE' : request.targetPlan === client_1.FarmerSubscriptionPlan.SMART ? 'KC-PRO' : request.targetPlan === client_1.FarmerSubscriptionPlan.SUPER ? 'KC-SUPER' : 'KC-FREE';
        const digits = Math.floor(Math.random() * 1000000);
        const code = `${prefix}-${digits.toString().padStart(6, '0')}`;
        const isAdvisorPlan = (request.targetPlan === client_1.FarmerSubscriptionPlan.SMART || request.targetPlan === client_1.FarmerSubscriptionPlan.SUPER);
        const coupon = await this.prisma.farmerPlanCoupon.create({
            data: {
                code,
                category: isAdvisorPlan ? client_1.PlanCouponCategory.ADVISOR_PLAN : client_1.PlanCouponCategory.FARMER_PLAN,
                plan: request.targetPlan,
                daysGranted: request.daysGranted,
                assignedFarmerId: request.farmerId,
                createdById: admin.id,
                createdByRole: admin.role,
                isUsed: true,
                usedAt: new Date(),
                usedByFarmerId: request.farmerId,
                generationCostAmount: request.amount,
            },
        });
        const result = await this.farmerPlansService.applyPlanChange(request.farmerId, request.targetPlan, request.daysGranted);
        const updated = await this.prisma.farmerPlanPaymentRequest.update({
            where: { id },
            data: { status: client_1.PlanPaymentStatus.CONFIRMED, confirmedAt: new Date(), confirmedById: admin.id },
            include: DETAIL_INCLUDE,
        });
        await this.notificationsService.create(request.farmerId, client_1.NotificationType.SYSTEM, 'Payment confirmed', `Your payment of ₹${request.amount} was confirmed! Coupon ${coupon.code} has been assigned & redeemed for your account. ${result.plan.plan} plan is active until ${result.newEndDate.toLocaleDateString('en-IN')}.${isAdvisorPlan ? ' Please select your preferred Farm Advisor in the Advisor section.' : ''}`, { farmerPlanPaymentRequestId: id, couponCode: coupon.code });
        return { request: updated, coupon, ...result };
    }
    async reject(admin, id, dto) {
        const request = await this.prisma.farmerPlanPaymentRequest.findUnique({ where: { id } });
        if (!request) {
            throw new common_1.NotFoundException('Payment request not found.');
        }
        if (request.status !== client_1.PlanPaymentStatus.SUBMITTED) {
            throw new common_1.BadRequestException('Only submitted payment requests can be rejected.');
        }
        const updated = await this.prisma.farmerPlanPaymentRequest.update({
            where: { id },
            data: { status: client_1.PlanPaymentStatus.REJECTED, rejectedAt: new Date(), rejectionReason: dto.reason },
            include: DETAIL_INCLUDE,
        });
        await this.notificationsService.create(request.farmerId, client_1.NotificationType.SYSTEM, 'Payment could not be verified', dto.reason ?? 'We could not verify your UPI payment. Please try again or contact support.', { farmerPlanPaymentRequestId: id });
        return updated;
    }
};
exports.FarmerPlanPaymentsService = FarmerPlanPaymentsService;
exports.FarmerPlanPaymentsService = FarmerPlanPaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        advisor_assignment_service_1.AdvisorAssignmentService,
        notifications_service_1.NotificationsService,
        app_settings_service_1.AppSettingsService,
        farmer_plans_service_1.FarmerPlansService])
], FarmerPlanPaymentsService);
//# sourceMappingURL=farmer-plan-payments.service.js.map