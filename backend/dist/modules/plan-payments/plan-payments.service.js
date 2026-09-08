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
exports.PlanPaymentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const advisor_assignment_service_1 = require("../advisor-assignment/advisor-assignment.service");
const plan_renewal_service_1 = require("../plan-renewal/plan-renewal.service");
const notifications_service_1 = require("../notifications/notifications.service");
const auth_user_util_1 = require("../../common/utils/auth-user.util");
const upi_util_1 = require("../../common/utils/upi.util");
const app_settings_service_1 = require("../app-settings/app-settings.service");
const DETAIL_INCLUDE = {
    farmer: { select: { id: true, name: true, mobile: true, kingId: true } },
    subscription: { include: { plan: true } },
};
function cycleDays(billingCycle) {
    return billingCycle === 'YEARLY' ? 365 : 30;
}
let PlanPaymentsService = class PlanPaymentsService {
    prisma;
    advisorAssignmentService;
    planRenewalService;
    notificationsService;
    appSettingsService;
    constructor(prisma, advisorAssignmentService, planRenewalService, notificationsService, appSettingsService) {
        this.prisma = prisma;
        this.advisorAssignmentService = advisorAssignmentService;
        this.planRenewalService = planRenewalService;
        this.notificationsService = notificationsService;
        this.appSettingsService = appSettingsService;
    }
    async initiate(user, farmerId) {
        const targetFarmerId = farmerId ?? ((0, auth_user_util_1.hasActiveRole)(user, client_1.Role.FARMER) ? user.id : undefined);
        if (!targetFarmerId) {
            throw new common_1.BadRequestException('A farmer must be specified to start a payment.');
        }
        if ((0, auth_user_util_1.hasActiveRole)(user, client_1.Role.ADVISOR) && targetFarmerId !== user.id) {
            await this.advisorAssignmentService.assertAdvisorAssignedToFarmerAnyExpiry(user.id, targetFarmerId);
        }
        const farmer = await this.prisma.user.findFirst({ where: { id: targetFarmerId, roles: { has: client_1.Role.FARMER }, deletedAt: null } });
        if (!farmer) {
            throw new common_1.NotFoundException('Farmer not found.');
        }
        const subscription = await this.prisma.advisorSubscription.findFirst({
            where: { farmerId: targetFarmerId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: { plan: true },
        });
        if (!subscription) {
            throw new common_1.BadRequestException('This farmer has no plan to pay for yet.');
        }
        const remark = farmer.kingId ?? farmer.id;
        const amount = Number(subscription.plan.price);
        const daysGranted = cycleDays(subscription.plan.billingCycle);
        const request = await this.prisma.planPaymentRequest.create({
            data: { farmerId: targetFarmerId, subscriptionId: subscription.id, amount, daysGranted },
            include: DETAIL_INCLUDE,
        });
        const settings = await this.appSettingsService.get();
        if (!settings.upiId) {
            throw new common_1.BadRequestException('UPI payment is not configured yet. Please contact support.');
        }
        const upiLink = (0, upi_util_1.buildUpiPaymentLink)({
            amount,
            note: remark,
            transactionRef: request.id,
            payeeVpa: settings.upiId,
            payeeName: settings.upiPayeeName ?? undefined,
        });
        return { ...request, upiLink };
    }
    listMine(user) {
        return this.prisma.planPaymentRequest.findMany({
            where: { farmerId: user.id },
            include: DETAIL_INCLUDE,
            orderBy: { requestedAt: 'desc' },
        });
    }
    async findOwnedOrThrow(user, id) {
        const request = await this.prisma.planPaymentRequest.findUnique({ where: { id }, include: DETAIL_INCLUDE });
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
        const updated = await this.prisma.planPaymentRequest.update({
            where: { id },
            data: { status: client_1.PlanPaymentStatus.SUBMITTED, submittedAt: new Date(), utr: dto.utr },
            include: DETAIL_INCLUDE,
        });
        const admins = await this.prisma.user.findMany({ where: { role: { in: [client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN] }, deletedAt: null }, select: { id: true } });
        await Promise.all(admins.map((admin) => this.notificationsService.create(admin.id, client_1.NotificationType.PAYMENT_DUE, 'Plan payment awaiting verification', `${request.farmer.name} claims ₹${request.amount} was paid for their plan. Please verify and confirm.`, { planPaymentRequestId: id })));
        return updated;
    }
    listPending() {
        return this.prisma.planPaymentRequest.findMany({
            where: { status: client_1.PlanPaymentStatus.SUBMITTED },
            include: DETAIL_INCLUDE,
            orderBy: { submittedAt: 'asc' },
        });
    }
    async confirm(admin, id) {
        const request = await this.prisma.planPaymentRequest.findUnique({ where: { id }, include: DETAIL_INCLUDE });
        if (!request) {
            throw new common_1.NotFoundException('Payment request not found.');
        }
        if (request.status !== client_1.PlanPaymentStatus.SUBMITTED) {
            throw new common_1.BadRequestException('Only submitted payment requests can be confirmed.');
        }
        const { newEndDate } = await this.planRenewalService.grantDaysDirectly(request.farmerId, request.daysGranted);
        const updated = await this.prisma.planPaymentRequest.update({
            where: { id },
            data: { status: client_1.PlanPaymentStatus.CONFIRMED, confirmedAt: new Date(), confirmedById: admin.id },
            include: DETAIL_INCLUDE,
        });
        await this.notificationsService.create(request.farmerId, client_1.NotificationType.SYSTEM, 'Payment confirmed', `Your payment of ₹${request.amount} was confirmed. Plan extended to ${newEndDate.toLocaleDateString('en-IN')}.`, { planPaymentRequestId: id });
        return { request: updated, newEndDate };
    }
    async reject(admin, id, dto) {
        const request = await this.prisma.planPaymentRequest.findUnique({ where: { id } });
        if (!request) {
            throw new common_1.NotFoundException('Payment request not found.');
        }
        if (request.status !== client_1.PlanPaymentStatus.SUBMITTED) {
            throw new common_1.BadRequestException('Only submitted payment requests can be rejected.');
        }
        const updated = await this.prisma.planPaymentRequest.update({
            where: { id },
            data: { status: client_1.PlanPaymentStatus.REJECTED, rejectedAt: new Date(), rejectionReason: dto.reason },
            include: DETAIL_INCLUDE,
        });
        await this.notificationsService.create(request.farmerId, client_1.NotificationType.SYSTEM, 'Payment could not be verified', dto.reason ?? 'We could not verify your UPI payment. Please try again or contact support.', { planPaymentRequestId: id });
        return updated;
    }
};
exports.PlanPaymentsService = PlanPaymentsService;
exports.PlanPaymentsService = PlanPaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        advisor_assignment_service_1.AdvisorAssignmentService,
        plan_renewal_service_1.PlanRenewalService,
        notifications_service_1.NotificationsService,
        app_settings_service_1.AppSettingsService])
], PlanPaymentsService);
//# sourceMappingURL=plan-payments.service.js.map