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
var FarmerPlanPaymentsService_1;
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
const wallet_service_1 = require("../wallet/wallet.service");
const cashfree_service_1 = require("../cashfree/cashfree.service");
const razorpay_service_1 = require("../razorpay/razorpay.service");
const phonepe_service_1 = require("../phonepe/phonepe.service");
const DAY_MS = 24 * 60 * 60 * 1000;
const DETAIL_INCLUDE = {
    farmer: { select: { id: true, name: true, mobile: true, kingId: true } },
};
let FarmerPlanPaymentsService = FarmerPlanPaymentsService_1 = class FarmerPlanPaymentsService {
    constructor(prisma, advisorAssignmentService, notificationsService, appSettingsService, farmerPlansService, walletService, cashfreeService, razorpayService, phonePeService) {
        this.prisma = prisma;
        this.advisorAssignmentService = advisorAssignmentService;
        this.notificationsService = notificationsService;
        this.appSettingsService = appSettingsService;
        this.farmerPlansService = farmerPlansService;
        this.walletService = walletService;
        this.cashfreeService = cashfreeService;
        this.razorpayService = razorpayService;
        this.phonePeService = phonePeService;
        this.logger = new common_1.Logger(FarmerPlanPaymentsService_1.name);
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
        const now = new Date();
        const currentPlanType = effective.plan ?? client_1.FarmerSubscriptionPlan.FREE;
        const currentRank = farmer_plans_service_1.PLAN_RANK[currentPlanType] ?? 0;
        const targetRank = farmer_plans_service_1.PLAN_RANK[dto.targetPlan] ?? 0;
        const isCurrentActive = currentPlanType !== client_1.FarmerSubscriptionPlan.FREE && !!effective.endDate && effective.endDate > now;
        const isAdvisorBooking = Boolean(dto.selectedDoctorId ||
            dto.selectedAdvisorId ||
            dto.doctorKingId ||
            dto.advisorKingId ||
            dto.targetPlan === client_1.FarmerSubscriptionPlan.GOLD ||
            dto.targetPlan === client_1.FarmerSubscriptionPlan.ROYAL);
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
        if (!pricing && (dto.customAmount === undefined || dto.customAmount === null)) {
            throw new common_1.BadRequestException('Pricing for this plan is not configured yet. Please contact support.');
        }
        let baseAmount = dto.customAmount !== undefined && dto.customAmount !== null
            ? Number(dto.customAmount)
            : pricing
                ? Number(pricing.price)
                : 0;
        const daysGranted = dto.billingPeriodDays ?? pricing?.billingPeriodDays ?? 30;
        const appSettings = await this.appSettingsService.get();
        if (dto.customAmount === undefined || dto.customAmount === null) {
            const planConfig = appSettings?.featureFlags?.farmerPlanConfigs?.[dto.targetPlan];
            if (planConfig?.offer?.enabled && Number(planConfig.offer?.offerPrice) > 0) {
                baseAmount = Number(planConfig.offer.offerPrice);
            }
        }
        let proratedCredit = 0;
        if (isCurrentActive && targetRank > currentRank && effective.endDate) {
            const daysRemaining = Math.max(0, Math.ceil((effective.endDate.getTime() - now.getTime()) / DAY_MS));
            const currentPricing = await this.prisma.farmerPlanPricing.findFirst({
                where: { plan: currentPlanType },
                orderBy: { billingPeriodDays: 'desc' },
            });
            const currentPrice = currentPricing ? Number(currentPricing.price) : 0;
            const currentTotalDays = currentPricing?.billingPeriodDays || 365;
            const rawCredit = (daysRemaining / currentTotalDays) * currentPrice;
            proratedCredit = Math.round(Math.min(rawCredit, baseAmount) * 100) / 100;
        }
        let amount = Math.max(0, Math.round((baseAmount - proratedCredit) * 100) / 100);
        let walletPointsUsed = 0;
        if (dto.useWalletPoints) {
            const currentWalletPoints = await this.walletService.getBalance(targetFarmerId);
            if (currentWalletPoints > 0) {
                walletPointsUsed = Math.min(currentWalletPoints, amount);
                amount = Math.max(0, Math.round((amount - walletPointsUsed) * 100) / 100);
                await this.walletService.debit(targetFarmerId, walletPointsUsed, `Redeemed ${walletPointsUsed} FarmsKing Points for ${dto.targetPlan} Plan subscription`, { relatedUserId: targetFarmerId });
            }
        }
        const request = await this.prisma.farmerPlanPaymentRequest.create({
            data: {
                farmerId: targetFarmerId,
                targetPlan: dto.targetPlan,
                amount,
                daysGranted,
                selectedDoctorId: dto.selectedDoctorId ?? null,
                selectedAdvisorId: dto.selectedAdvisorId ?? null,
                doctorKingId: dto.doctorKingId ?? null,
                advisorKingId: dto.advisorKingId ?? null,
            },
            include: DETAIL_INCLUDE,
        });
        const integrations = await this.appSettingsService.getIntegrations();
        const activeGateway = integrations.gateway?.activeGateway || integrations.gateway?.routing?.farmerPlanGateway || 'PHONEPE';
        const upiPayeeVpa = integrations.gateway.providers.upiDirect?.upiId || appSettings.upiId || 'surindersinghmakhu-5@oksbi';
        const upiPayeeName = integrations.gateway.providers.upiDirect?.payeeName || appSettings.upiPayeeName || 'FarmsKing Technologies';
        if (amount === 0) {
            await this.farmerPlansService.applyPlanChange(targetFarmerId, dto.targetPlan, daysGranted, undefined, dto.selectedAdvisorId || dto.selectedDoctorId);
            const confirmedRequest = await this.prisma.farmerPlanPaymentRequest.update({
                where: { id: request.id },
                data: {
                    status: client_1.PlanPaymentStatus.CONFIRMED,
                    confirmedAt: new Date(),
                },
                include: DETAIL_INCLUDE,
            });
            return {
                ...confirmedRequest,
                status: 'CONFIRMED',
                confirmed: true,
                activated: true,
                activeGateway: 'WALLET_POINTS',
                paidViaPoints: walletPointsUsed,
                paymentLink: null,
                phonepeRedirectUrl: null,
                cashfreeSessionId: null,
                cashfreePaymentLink: null,
                razorpayShortUrl: null,
                upiLink: null,
                payeeVpa: upiPayeeVpa,
                payeeName: upiPayeeName,
                message: 'Plan activated instantly using FarmsKing Points!',
            };
        }
        const upiLink = (0, upi_util_1.buildUpiPaymentLink)({
            amount,
            note: `FK-${dto.targetPlan}-${(farmer.kingId || farmer.id).slice(0, 8)}`,
            transactionRef: `PLAN-${request.id.slice(0, 12)}`,
            payeeVpa: upiPayeeVpa,
            payeeName: upiPayeeName,
        });
        let cashfreeSessionId = null;
        let cashfreePaymentLink = null;
        let phonepeRedirectUrl = null;
        let razorpayShortUrl = null;
        let paymentLink = null;
        const appBaseUrl = (process.env.APP_URL || 'https://farmsking.in').replace(/\/$/, '');
        const redirectCallbackUrl = `${appBaseUrl}/orders?plan_payment_id=${request.id}&status=success`;
        if (activeGateway === 'PHONEPE') {
            try {
                const phonePeRes = await this.phonePeService.createPayment(`PLAN-${request.id}`, amount, redirectCallbackUrl);
                phonepeRedirectUrl = phonePeRes.redirectUrl;
                paymentLink = phonePeRes.redirectUrl;
            }
            catch (err) {
                this.logger.error(`PhonePe createPayment error for PLAN-${request.id}: ${err?.message || err}`);
                try {
                    const cashfreeRes = await this.cashfreeService.createStandardOrder({
                        orderId: `PLAN-${request.id}`,
                        amount,
                        customerId: farmer.id,
                        customerPhone: farmer.mobile,
                        customerName: farmer.name,
                    });
                    cashfreeSessionId = cashfreeRes.paymentSessionId;
                    cashfreePaymentLink = cashfreeRes.paymentLink;
                    paymentLink = cashfreeRes.paymentLink;
                }
                catch (cfErr) {
                    this.logger.error(`Cashfree fallback error for PLAN-${request.id}: ${cfErr?.message || cfErr}`);
                }
            }
        }
        else if (activeGateway === 'CASHFREE') {
            try {
                const cashfreeRes = await this.cashfreeService.createStandardOrder({
                    orderId: `PLAN-${request.id}`,
                    amount,
                    customerId: farmer.id,
                    customerPhone: farmer.mobile,
                    customerName: farmer.name,
                });
                cashfreeSessionId = cashfreeRes.paymentSessionId;
                cashfreePaymentLink = cashfreeRes.paymentLink;
                paymentLink = cashfreeRes.paymentLink;
            }
            catch (err) {
                this.logger.error(`Cashfree createStandardOrder error for PLAN-${request.id}: ${err?.message || err}`);
                try {
                    const phonePeRes = await this.phonePeService.createPayment(`PLAN-${request.id}`, amount, redirectCallbackUrl);
                    phonepeRedirectUrl = phonePeRes.redirectUrl;
                    paymentLink = phonePeRes.redirectUrl;
                }
                catch (peErr) {
                    this.logger.error(`PhonePe fallback error for PLAN-${request.id}: ${peErr?.message || peErr}`);
                }
            }
        }
        else if (activeGateway === 'RAZORPAY') {
            try {
                const rzpRes = await this.razorpayService.createStandardOrder({
                    orderId: `PLAN-${request.id}`,
                    amount,
                    notes: { farmerPlanPaymentRequestId: request.id },
                });
                razorpayShortUrl = rzpRes?.short_url || null;
                paymentLink = rzpRes?.short_url || null;
            }
            catch (err) {
                this.logger.error(`Razorpay createStandardOrder error for PLAN-${request.id}: ${err?.message || err}`);
            }
        }
        return {
            ...request,
            activeGateway,
            paymentLink: paymentLink || cashfreePaymentLink || phonepeRedirectUrl || razorpayShortUrl,
            phonepeRedirectUrl,
            cashfreeSessionId,
            cashfreePaymentLink,
            razorpayShortUrl,
            upiLink,
            payeeVpa: upiPayeeVpa,
            payeeName: upiPayeeName,
        };
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
        const integrations = await this.appSettingsService.getIntegrations();
        const isAdvisorBooking = Boolean(request.selectedDoctorId || request.selectedAdvisorId || request.doctorKingId || request.advisorKingId);
        const activeGateway = isAdvisorBooking
            ? (integrations?.gateway?.routing?.advisorBookingGateway || integrations?.gateway?.activeGateway || 'UPI_DIRECT')
            : (integrations?.gateway?.routing?.farmerPlanGateway || integrations?.gateway?.activeGateway || 'UPI_DIRECT');
        const isTestPayment = activeGateway === 'TEST_MODE' || Boolean(integrations?.gateway?.providers?.testMode?.autoConfirmOnSubmit);
        if (isTestPayment) {
            const actualAdmin = await this.prisma.user.findFirst({ where: { role: { in: [client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN] }, deletedAt: null }, select: { id: true } });
            const adminId = actualAdmin?.id || user.id;
            const mockAdmin = { id: adminId, role: client_1.Role.ADMIN, roles: [client_1.Role.ADMIN] };
            const confirmResult = await this.confirm(mockAdmin, id);
            return {
                ...confirmResult.request,
                isAutoActivated: true,
                coupon: confirmResult.coupon,
                plan: confirmResult.plan,
                newEndDate: confirmResult.newEndDate,
                advisorHired: confirmResult.advisorHired,
            };
        }
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
        const prefix = request.targetPlan === client_1.FarmerSubscriptionPlan.PRO ? 'FB' : request.targetPlan === client_1.FarmerSubscriptionPlan.SMART ? 'FP' : 'FS';
        const digits = Math.floor(100000 + Math.random() * 900000);
        const code = `${prefix}${digits}`;
        const isAdvisorPlan = (request.targetPlan === client_1.FarmerSubscriptionPlan.SMART || request.targetPlan === client_1.FarmerSubscriptionPlan.SUPER || request.targetPlan === client_1.FarmerSubscriptionPlan.GOLD || request.targetPlan === client_1.FarmerSubscriptionPlan.ROYAL);
        const coupon = await this.prisma.farmerPlanCoupon.create({
            data: {
                code,
                category: isAdvisorPlan ? client_1.PlanCouponCategory.DOCTOR_CONSULTATION : client_1.PlanCouponCategory.FARMER_PLAN,
                plan: request.targetPlan,
                daysGranted: request.daysGranted,
                assignedFarmerId: request.farmerId,
                assignedAdvisorId: request.selectedAdvisorId ?? undefined,
                doctorKingId: request.doctorKingId ?? null,
                advisorKingId: request.advisorKingId ?? null,
                createdById: request.selectedDoctorId ?? admin.id,
                createdByRole: admin.role,
                isUsed: true,
                usedAt: new Date(),
                usedByFarmerId: request.farmerId,
                generationCostAmount: request.amount,
            },
        });
        const targetAdvisorOrDoctorId = request.selectedAdvisorId || request.selectedDoctorId || undefined;
        const result = await this.farmerPlansService.applyPlanChange(request.farmerId, request.targetPlan, request.daysGranted, coupon.id, targetAdvisorOrDoctorId);
        const totalAmount = Number(request.amount || 0);
        if (totalAmount > 0) {
            const appSettings = await this.prisma.appSetting.findUnique({ where: { id: 'default' } });
            const platformFeePercent = appSettings?.advisorPlatformFeePercent ?? 10.0;
            const adminFeePercent = appSettings?.advisorAdminFeePercent ?? 10.0;
            const platformFee = Math.round(totalAmount * (platformFeePercent / 100));
            const adminFee = Math.round(totalAmount * (adminFeePercent / 100));
            const doctorAdvisorPayout = Math.max(0, totalAmount - (platformFee + adminFee));
            if (request.selectedDoctorId && request.selectedAdvisorId) {
                const advisorCut = Math.round(doctorAdvisorPayout * 0.50);
                const doctorCut = doctorAdvisorPayout - advisorCut;
                await this.walletService.credit(request.selectedAdvisorId, advisorCut, `Advisor consultation share (Net: ₹${advisorCut}, Platform Fee: ${platformFeePercent}%, Admin Fee: ${adminFeePercent}%) for ${request.targetPlan} plan by ${request.farmer.name}`);
                await this.walletService.credit(request.selectedDoctorId, doctorCut, `Doctor consultation share (Net: ₹${doctorCut}, Platform Fee: ${platformFeePercent}%, Admin Fee: ${adminFeePercent}%) for ${request.targetPlan} plan by ${request.farmer.name}`);
            }
            else if (request.selectedDoctorId) {
                await this.walletService.credit(request.selectedDoctorId, doctorAdvisorPayout, `Crop Doctor consultation payout (Net: ₹${doctorAdvisorPayout}, Platform Fee: ${platformFeePercent}%, Admin Fee: ${adminFeePercent}%) for ${request.targetPlan} plan by ${request.farmer.name}`);
            }
            else if (request.selectedAdvisorId) {
                await this.walletService.credit(request.selectedAdvisorId, doctorAdvisorPayout, `Farm Advisor consultation payout (Net: ₹${doctorAdvisorPayout}, Platform Fee: ${platformFeePercent}%, Admin Fee: ${adminFeePercent}%) for ${request.targetPlan} plan by ${request.farmer.name}`);
            }
        }
        const updated = await this.prisma.farmerPlanPaymentRequest.update({
            where: { id },
            data: { status: client_1.PlanPaymentStatus.CONFIRMED, confirmedAt: new Date(), confirmedById: admin.id },
            include: DETAIL_INCLUDE,
        });
        await this.notificationsService.create(request.farmerId, client_1.NotificationType.SYSTEM, 'Payment confirmed', `Your payment of ₹${request.amount} was confirmed! Coupon ${coupon.code} has been assigned & redeemed for your account. ${result.plan.plan} plan is active until ${result.newEndDate.toLocaleDateString('en-IN')}.${isAdvisorPlan ? ' Your Crop Doctor / Advisor supervision is now active.' : ''}`, { farmerPlanPaymentRequestId: id, couponCode: coupon.code });
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
exports.FarmerPlanPaymentsService = FarmerPlanPaymentsService = FarmerPlanPaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        advisor_assignment_service_1.AdvisorAssignmentService,
        notifications_service_1.NotificationsService,
        app_settings_service_1.AppSettingsService,
        farmer_plans_service_1.FarmerPlansService,
        wallet_service_1.WalletService,
        cashfree_service_1.CashfreeService,
        razorpay_service_1.RazorpayService,
        phonepe_service_1.PhonePeService])
], FarmerPlanPaymentsService);
//# sourceMappingURL=farmer-plan-payments.service.js.map